import { EntityId } from "../../shared/ids.js";
import { ApplicationContext, ApplicationError, AuthorizationError, AuthorizationService, NotFoundError } from "./shared.js";
import { ApplicationKernel } from "./kernel.js";
export * from "./shared.js";
import { Tenant, Organization, Unit, User, Professional, Subject, createTenant, createOrganization, createUnit, createUser, createProfessional, createSubject } from "../domain/entities.js";
import { Role, UserRole, createRole, createUserRole } from "../domain/access.js";
import { createAuditEntry } from "../domain/audit.js";
import { createDomainEvent } from "../domain/event.js";
import { DomainInvariantError } from "../domain/errors.js";
import { EventPublisher, IdentityProvider, UnitOfWork } from "../contracts/core.js";
import { TenantRepository, OrganizationRepository, UnitRepository, UserRepository, ProfessionalRepository, SubjectRepository, RoleRepository, UserRoleRepository, AuditSink, IdGenerator, Clock } from "./../contracts/application.js";

export type CreateTenantCommand = { readonly name: string };
export type CreateOrganizationCommand = { readonly tenantId: EntityId; readonly name: string };
export type CreateUnitCommand = { readonly tenantId: EntityId; readonly organizationId: EntityId; readonly name: string };
export type CreateUserCommand = { readonly tenantId: EntityId; readonly identityId: EntityId; readonly displayName: string };
export type CreateProfessionalCommand = { readonly tenantId: EntityId; readonly userId: EntityId; readonly organizationId: EntityId };
export type CreateSubjectCommand = { readonly tenantId: EntityId; readonly organizationId: EntityId; readonly displayName: string };
export type CreateRoleCommand = { readonly name: string; readonly architecturalRole?: Role["architecturalRole"] };
export type AssignRoleCommand = { readonly userId: EntityId; readonly roleId: EntityId; readonly scope: UserRole["scope"] };

export interface CoreApplicationDependencies {
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly identities: IdentityProvider;
  readonly unitOfWork: UnitOfWork;
  readonly authorization: AuthorizationService;
  readonly audit: AuditSink;
  readonly events: EventPublisher;
  readonly tenants: TenantRepository;
  readonly organizations: OrganizationRepository;
  readonly units: UnitRepository;
  readonly users: UserRepository;
  readonly professionals: ProfessionalRepository;
  readonly subjects: SubjectRepository;
  readonly roles: RoleRepository;
  readonly userRoles: UserRoleRepository;
}

const PRIVILEGED_ARCHITECTURAL_ROLES: ReadonlySet<string> = new Set(["platform-admin", "technical-operator"]);

export class HealCoreApplication {
  private readonly k: ApplicationKernel;
  constructor(private readonly d: CoreApplicationDependencies) { this.k = new ApplicationKernel(d); }

  async createTenant(context: ApplicationContext, command: CreateTenantCommand): Promise<Tenant> {
    if (context.scope !== "platform") throw new ApplicationError("tenant creation requires platform context");
    await this.k.authorize(context, "tenant.create", "tenant");
    const entity = createTenant({ id: this.d.ids.next(), name: command.name });
    await this.k.commit(context, entity.id, { save: () => this.d.tenants.save(entity), action: "tenant.created", resource: "tenant", resourceId: entity.id, eventType: "tenant.created", payload: { tenantId: entity.id } });
    return entity;
  }

  async getTenant(context: ApplicationContext, id: EntityId): Promise<Tenant> {
    await this.k.authorize(context, "tenant.read", "tenant", id);
    // A foreign tenant is indistinguishable from a missing one: no existence oracle across tenants.
    if (context.scope === "tenant" && context.tenantId !== id) {
      await this.k.refuse(context, "tenant.read", "tenant", id, "outside-tenancy", new NotFoundError("tenant", id));
    }
    const entity = await this.d.tenants.getById(id);
    if (!entity) throw new NotFoundError("tenant", id);
    return entity;
  }

  async createOrganization(context: ApplicationContext, command: CreateOrganizationCommand): Promise<Organization> {
    const tenantId = this.k.tenantId(context);
    await this.k.requireTenancy(context, command.tenantId === tenantId, "organization.create", "organization", "organization tenant does not match request tenancy");
    await this.k.authorize(context, "organization.create", "organization");
    const tenant = await this.d.tenants.getById(command.tenantId);
    if (!tenant) throw new NotFoundError("tenant", command.tenantId);
    const entity = createOrganization({ id: this.d.ids.next(), tenantId: command.tenantId, name: command.name }, tenant);
    await this.k.commit(context, tenantId, { save: () => this.d.organizations.save(entity), action: "organization.created", resource: "organization", resourceId: entity.id, eventType: "organization.created", payload: { organizationId: entity.id } });
    return entity;
  }

  async createUnit(context: ApplicationContext, command: CreateUnitCommand): Promise<Unit> {
    const tenantId = this.k.tenantId(context);
    await this.k.requireTenancy(context, command.tenantId === tenantId && this.k.organizationId(context) === command.organizationId, "unit.create", "unit", "unit is outside request tenancy");
    await this.k.authorize(context, "unit.create", "unit");
    const organization = await this.d.organizations.getInTenant(tenantId, command.organizationId);
    if (!organization) throw new NotFoundError("organization", command.organizationId);
    const entity = createUnit({ id: this.d.ids.next(), tenantId: command.tenantId, organizationId: command.organizationId, name: command.name }, organization);
    await this.k.commit(context, tenantId, { save: () => this.d.units.save(entity), action: "unit.created", resource: "unit", resourceId: entity.id, eventType: "unit.created", payload: { unitId: entity.id } });
    return entity;
  }

  async createUser(context: ApplicationContext, command: CreateUserCommand): Promise<User> {
    const tenantId = this.k.tenantId(context);
    await this.k.requireTenancy(context, command.tenantId === tenantId, "user.create", "user", "user tenant does not match request tenancy");
    await this.k.authorize(context, "user.create", "user");
    const tenant = await this.d.tenants.getById(tenantId);
    if (!tenant) throw new NotFoundError("tenant", tenantId);
    const identity = await this.d.identities.resolve(command.identityId);
    if (!identity) throw new NotFoundError("identity", command.identityId);
    const entity = createUser({ id: this.d.ids.next(), tenantId, identityId: identity.id, displayName: command.displayName }, tenant);
    await this.k.commit(context, tenantId, { save: () => this.d.users.save(entity), action: "user.created", resource: "user", resourceId: entity.id, eventType: "user.created", payload: { userId: entity.id } });
    return entity;
  }

  async createProfessional(context: ApplicationContext, command: CreateProfessionalCommand): Promise<Professional> {
    const tenantId = this.k.tenantId(context);
    await this.k.requireTenancy(context, command.tenantId === tenantId && this.k.organizationId(context) === command.organizationId, "professional.create", "professional", "professional is outside request tenancy");
    await this.k.authorize(context, "professional.create", "professional");
    const user = await this.d.users.getInTenant(tenantId, command.userId);
    const organization = await this.d.organizations.getInTenant(tenantId, command.organizationId);
    if (!user) throw new NotFoundError("user", command.userId);
    if (!organization) throw new NotFoundError("organization", command.organizationId);
    const entity = createProfessional({ id: this.d.ids.next(), tenantId, userId: command.userId, organizationId: command.organizationId }, user, organization);
    await this.k.commit(context, tenantId, { save: () => this.d.professionals.save(entity), action: "professional.created", resource: "professional", resourceId: entity.id, eventType: "professional.created", payload: { professionalId: entity.id } });
    return entity;
  }

  async createSubject(context: ApplicationContext, command: CreateSubjectCommand): Promise<Subject> {
    const tenantId = this.k.tenantId(context);
    await this.k.requireTenancy(context, command.tenantId === tenantId && this.k.organizationId(context) === command.organizationId, "subject.create", "subject", "subject is outside request tenancy");
    await this.k.authorize(context, "subject.create", "subject");
    const organization = await this.d.organizations.getInTenant(tenantId, command.organizationId);
    if (!organization) throw new NotFoundError("organization", command.organizationId);
    const entity = createSubject({ id: this.d.ids.next(), tenantId, organizationId: command.organizationId, displayName: command.displayName }, organization);
    await this.k.commit(context, tenantId, { save: () => this.d.subjects.save(entity), action: "subject.created", resource: "subject", resourceId: entity.id, eventType: "subject.created", payload: { subjectId: entity.id } });
    return entity;
  }

  async createRole(context: ApplicationContext, command: CreateRoleCommand): Promise<Role> {
    const privileged = command.architecturalRole !== undefined && PRIVILEGED_ARCHITECTURAL_ROLES.has(command.architecturalRole);
    if (privileged && context.scope !== "platform") {
      await this.k.refuse(context, "role.create", "role", undefined, "privileged-role-outside-platform", new AuthorizationError("platform-level roles can only be created in platform context"));
    }
    await this.k.authorize(context, "role.create", "role", undefined, { architecturalRole: command.architecturalRole });
    const auditTenant = this.k.auditTenantId(context);
    const entity = createRole({ id: this.d.ids.next(), name: command.name, architecturalRole: command.architecturalRole });
    await this.k.commit(context, auditTenant, { save: () => this.d.roles.save(entity), action: "role.created", resource: "role", resourceId: entity.id, eventType: "role.created", payload: { roleId: entity.id } });
    return entity;
  }

  /** The acting context must be at least as broad as the scope it grants: org-level admins cannot grant tenant-wide or other-org roles. */
  private contextCoversScope(context: Extract<ApplicationContext, { scope: "tenant" }>, scope: Exclude<UserRole["scope"], { level: "platform" }>): boolean {
    if (scope.level === "tenant") return !context.organizationId && !context.unitId;
    if (scope.level === "organization") return !context.unitId && (!context.organizationId || context.organizationId === scope.organizationId);
    return (!context.organizationId || context.organizationId === scope.organizationId) && (!context.unitId || context.unitId === scope.unitId);
  }

  async assignRole(context: ApplicationContext, command: AssignRoleCommand): Promise<UserRole> {
    const scope = command.scope;
    const role = await this.d.roles.getById(command.roleId);
    if (!role) throw new NotFoundError("role", command.roleId);
    const privilegedRole = role.architecturalRole !== undefined && PRIVILEGED_ARCHITECTURAL_ROLES.has(role.architecturalRole);
    const attributes = { roleId: command.roleId, targetUserId: command.userId, scope, architecturalRole: role.architecturalRole };

    // Platform-wide assignments, and any assignment of a platform-level role, are a separate privilege boundary.
    if (scope.level === "platform") {
      if (context.scope !== "platform") {
        await this.k.refuse(context, "role.assign.platform", "user-role", command.userId, "platform-assignment-outside-platform", new AuthorizationError("platform role assignment requires platform context"));
      }
      await this.k.authorize(context, "role.assign.platform", "user-role", command.userId, attributes);
    } else {
      const tenantId = this.k.tenantId(context);
      if (privilegedRole) {
        await this.k.refuse(context, "role.assign", "user-role", command.userId, "privileged-role-below-platform", new AuthorizationError("platform-level roles can only be assigned at platform scope"));
      }
      await this.k.requireTenancy(context, scope.tenantId === tenantId, "role.assign", "user-role", "role assignment tenant does not match request tenancy");
      await this.k.requireTenancy(context, this.contextCoversScope(context as Extract<ApplicationContext, { scope: "tenant" }>, scope), "role.assign", "user-role", "role assignment is outside the acting organization or unit");
    }

    // The specific platform permission does not replace the general assignment permission; both gates must pass.
    await this.k.authorize(context, "role.assign", "user-role", command.userId, attributes);

    const user = scope.level === "platform" ? await this.d.users.getById(command.userId) : await this.d.users.getInTenant(this.k.tenantId(context), command.userId);
    if (!user) throw new NotFoundError("user", command.userId);
    const tenantFilter = scope.level === "platform" ? user.tenantId : scope.tenantId;
    const organization = scope.level === "organization" || scope.level === "unit" ? await this.d.organizations.getInTenant(tenantFilter, scope.organizationId) : null;
    const unit = scope.level === "unit" ? await this.d.units.getInTenant(tenantFilter, scope.unitId) : null;
    if ((scope.level === "organization" || scope.level === "unit") && !organization) throw new NotFoundError("organization", scope.organizationId);
    if (scope.level === "unit" && !unit) throw new NotFoundError("unit", scope.unitId);

    const entity = createUserRole(command, user, organization ?? undefined, unit ?? undefined);
    const auditTenantId = scope.level === "platform" ? user.tenantId : this.k.tenantId(context);
    await this.k.commit(context, auditTenantId, { save: () => this.d.userRoles.save(entity), action: "role.assigned", resource: "user-role", resourceId: entity.userId, eventType: "role.assigned", payload: { userId: entity.userId, roleId: entity.roleId, scope: scope.level } });
    return entity;
  }
}
