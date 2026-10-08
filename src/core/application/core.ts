import { EntityId } from "../../shared/ids.js";
import { Tenant, Organization, Unit, User, Professional, Subject, createTenant, createOrganization, createUnit, createUser, createProfessional, createSubject } from "../domain/entities.js";
import { Role, UserRole, createRole, createUserRole } from "../domain/access.js";
import { createAuditEntry } from "../domain/audit.js";
import { createDomainEvent } from "../domain/event.js";
import { DomainInvariantError } from "../domain/errors.js";
import { EventPublisher } from "../contracts/core.js";
import { TenantRepository, OrganizationRepository, UnitRepository, UserRepository, ProfessionalRepository, SubjectRepository, RoleRepository, UserRoleRepository, AuditSink, IdGenerator, Clock } from "./../contracts/application.js";

export type ApplicationContext =
  | { readonly scope: "platform"; readonly actorUserId?: EntityId; readonly correlationId?: string }
  | { readonly scope: "tenant"; readonly tenantId: EntityId; readonly organizationId?: EntityId; readonly unitId?: EntityId; readonly actorUserId?: EntityId; readonly correlationId?: string };

export type CreateTenantCommand = { readonly name: string };
export type CreateOrganizationCommand = { readonly tenantId: EntityId; readonly name: string };
export type CreateUnitCommand = { readonly tenantId: EntityId; readonly organizationId: EntityId; readonly name: string };
export type CreateUserCommand = { readonly tenantId: EntityId; readonly identityId: EntityId; readonly displayName: string };
export type CreateProfessionalCommand = { readonly tenantId: EntityId; readonly userId: EntityId; readonly organizationId: EntityId };
export type CreateSubjectCommand = { readonly tenantId: EntityId; readonly organizationId: EntityId; readonly displayName: string };
export type CreateRoleCommand = { readonly name: string; readonly architecturalRole?: Role["architecturalRole"] };
export type AssignRoleCommand = { readonly userId: EntityId; readonly roleId: EntityId; readonly scope: UserRole["scope"] };

export interface AuthorizationRequest {
  readonly actorUserId?: EntityId;
  readonly action: string;
  readonly resource: string;
  readonly resourceId?: EntityId;
  readonly context: ApplicationContext;
}
export interface AuthorizationService { can(request: AuthorizationRequest): Promise<boolean>; }

export class ApplicationError extends Error { constructor(message: string) { super(message); this.name = "ApplicationError"; } }
export class AuthorizationError extends ApplicationError { constructor(message = "operation not authorized") { super(message); this.name = "AuthorizationError"; } }
export class NotFoundError extends ApplicationError { constructor(resource: string, id: string) { super(resource + " not found: " + id); this.name = "NotFoundError"; } }

export interface CoreApplicationDependencies {
  readonly ids: IdGenerator;
  readonly clock: Clock;
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

export function platformContext(input: { actorUserId?: EntityId; correlationId?: string } = {}): ApplicationContext {
  return { scope: "platform", actorUserId: input.actorUserId, correlationId: input.correlationId };
}
export function tenantContext(input: Omit<Extract<ApplicationContext, {scope:"tenant"}>, "scope">): ApplicationContext {
  return { scope: "tenant", ...input };
}

export class HealCoreApplication {
  constructor(private readonly d: CoreApplicationDependencies) {}

  private async authorize(context: ApplicationContext, action: string, resource: string, resourceId?: string): Promise<void> {
    const allowed = await this.d.authorization.can({ actorUserId: context.actorUserId, action, resource, resourceId, context });
    if (!allowed) throw new AuthorizationError(action + " on " + resource + " is not authorized");
  }

  private tenantId(context: ApplicationContext): EntityId {
    if (context.scope !== "tenant") throw new ApplicationError("tenant context is required");
    return context.tenantId;
  }

  private organizationId(context: ApplicationContext): EntityId {
    if (context.scope !== "tenant" || !context.organizationId) throw new ApplicationError("organization context is required");
    return context.organizationId;
  }

  private async audit(context: ApplicationContext, tenantId: EntityId, action: string, resource: string, resourceId: EntityId): Promise<void> {
    await this.d.audit.append(createAuditEntry({
      id: this.d.ids.next(), tenantId, actorId: context.actorUserId, action, resource, resourceId,
      timestamp: this.d.clock.now(), correlationId: context.correlationId, result: "success"
    }));
  }

  private async event(context: ApplicationContext, tenantId: EntityId, eventType: string, payload: unknown): Promise<void> {
    await this.d.events.publish(createDomainEvent({
      eventId: this.d.ids.next(), eventType, version: 1, occurredAt: this.d.clock.now(),
      tenantId, actorId: context.actorUserId, source: "heal-core.application",
      correlationId: context.correlationId, payload
    }));
  }

  async createTenant(context: ApplicationContext, command: CreateTenantCommand): Promise<Tenant> {
    if (context.scope !== "platform") throw new ApplicationError("tenant creation requires platform context");
    await this.authorize(context, "tenant.create", "tenant");
    const entity = createTenant({ id: this.d.ids.next(), name: command.name });
    await this.d.tenants.save(entity);
    await this.audit(context, entity.id, "tenant.created", "tenant", entity.id);
    await this.event(context, entity.id, "tenant.created", { tenantId: entity.id });
    return entity;
  }

  async getTenant(context: ApplicationContext, id: EntityId): Promise<Tenant> {
    await this.authorize(context, "tenant.read", "tenant", id);
    const entity = await this.d.tenants.getById(id);
    if (!entity) throw new NotFoundError("tenant", id);
    if (context.scope === "tenant" && context.tenantId !== entity.id) throw new DomainInvariantError("tenant is outside request tenancy");
    return entity;
  }

  async createOrganization(context: ApplicationContext, command: CreateOrganizationCommand): Promise<Organization> {
    const tenantId = this.tenantId(context);
    if (command.tenantId !== tenantId) throw new DomainInvariantError("organization tenant does not match request tenancy");
    await this.authorize(context, "organization.create", "organization");
    const tenant = await this.d.tenants.getById(command.tenantId);
    if (!tenant) throw new NotFoundError("tenant", command.tenantId);
    const entity = createOrganization({ id: this.d.ids.next(), tenantId: command.tenantId, name: command.name }, tenant);
    await this.d.organizations.save(entity);
    await this.audit(context, tenantId, "organization.created", "organization", entity.id);
    await this.event(context, tenantId, "organization.created", { organizationId: entity.id });
    return entity;
  }

  async createUnit(context: ApplicationContext, command: CreateUnitCommand): Promise<Unit> {
    const tenantId = this.tenantId(context);
    if (command.tenantId !== tenantId || this.organizationId(context) !== command.organizationId) throw new DomainInvariantError("unit is outside request tenancy");
    await this.authorize(context, "unit.create", "unit");
    const organization = await this.d.organizations.getById(command.organizationId);
    if (!organization) throw new NotFoundError("organization", command.organizationId);
    const entity = createUnit({ id: this.d.ids.next(), tenantId: command.tenantId, organizationId: command.organizationId, name: command.name }, organization);
    await this.d.units.save(entity);
    await this.audit(context, tenantId, "unit.created", "unit", entity.id);
    await this.event(context, tenantId, "unit.created", { unitId: entity.id });
    return entity;
  }

  async createUser(context: ApplicationContext, command: CreateUserCommand): Promise<User> {
    const tenantId = this.tenantId(context);
    if (command.tenantId !== tenantId) throw new DomainInvariantError("user tenant does not match request tenancy");
    await this.authorize(context, "user.create", "user");
    const tenant = await this.d.tenants.getById(tenantId);
    if (!tenant) throw new NotFoundError("tenant", tenantId);
    const entity = createUser({ id: this.d.ids.next(), tenantId, identityId: command.identityId, displayName: command.displayName }, tenant);
    await this.d.users.save(entity);
    await this.audit(context, tenantId, "user.created", "user", entity.id);
    await this.event(context, tenantId, "user.created", { userId: entity.id });
    return entity;
  }

  async createProfessional(context: ApplicationContext, command: CreateProfessionalCommand): Promise<Professional> {
    const tenantId = this.tenantId(context);
    if (command.tenantId !== tenantId || this.organizationId(context) !== command.organizationId) throw new DomainInvariantError("professional is outside request tenancy");
    await this.authorize(context, "professional.create", "professional");
    const user = await this.d.users.getById(command.userId);
    const organization = await this.d.organizations.getById(command.organizationId);
    if (!user) throw new NotFoundError("user", command.userId);
    if (!organization) throw new NotFoundError("organization", command.organizationId);
    const entity = createProfessional({ id: this.d.ids.next(), tenantId, userId: command.userId, organizationId: command.organizationId }, user, organization);
    await this.d.professionals.save(entity);
    await this.audit(context, tenantId, "professional.created", "professional", entity.id);
    await this.event(context, tenantId, "professional.created", { professionalId: entity.id });
    return entity;
  }

  async createSubject(context: ApplicationContext, command: CreateSubjectCommand): Promise<Subject> {
    const tenantId = this.tenantId(context);
    if (command.tenantId !== tenantId || this.organizationId(context) !== command.organizationId) throw new DomainInvariantError("subject is outside request tenancy");
    await this.authorize(context, "subject.create", "subject");
    const organization = await this.d.organizations.getById(command.organizationId);
    if (!organization) throw new NotFoundError("organization", command.organizationId);
    const entity = createSubject({ id: this.d.ids.next(), tenantId, organizationId: command.organizationId, displayName: command.displayName }, organization);
    await this.d.subjects.save(entity);
    await this.audit(context, tenantId, "subject.created", "subject", entity.id);
    await this.event(context, tenantId, "subject.created", { subjectId: entity.id });
    return entity;
  }

  async createRole(context: ApplicationContext, command: CreateRoleCommand): Promise<Role> {
    const tenantId = this.tenantId(context);
    await this.authorize(context, "role.create", "role");
    const entity = createRole({ id: this.d.ids.next(), name: command.name, architecturalRole: command.architecturalRole });
    await this.d.roles.save(entity);
    await this.audit(context, tenantId, "role.created", "role", entity.id);
    await this.event(context, tenantId, "role.created", { roleId: entity.id });
    return entity;
  }

  async assignRole(context: ApplicationContext, command: AssignRoleCommand): Promise<UserRole> {
    // Platform-wide assignments are a separate privilege boundary. Reject tenant
    // contexts before generic authorization, reads, persistence, audit or events.
    if (command.scope.level === "platform") {
      if (context.scope !== "platform") {
        throw new AuthorizationError("platform role assignment requires platform context");
      }
      await this.authorize(context, "role.assign.platform", "user-role");
    } else {
      const tenantId = this.tenantId(context);
      if (command.scope.tenantId !== tenantId) {
        throw new DomainInvariantError("role assignment tenant does not match request tenancy");
      }
    }

    // The specific platform permission does not replace the general assignment
    // permission; both gates must pass for a platform-wide assignment.
    await this.authorize(context, "role.assign", "user-role");
    const user = await this.d.users.getById(command.userId);
    const role = await this.d.roles.getById(command.roleId);
    if (!user) throw new NotFoundError("user", command.userId);
    if (!role) throw new NotFoundError("role", command.roleId);

    const organization = command.scope.level === "organization" || command.scope.level === "unit"
      ? await this.d.organizations.getById(command.scope.organizationId) : null;
    const unit = command.scope.level === "unit" ? await this.d.units.getById(command.scope.unitId) : null;
    if ((command.scope.level === "organization" || command.scope.level === "unit") && !organization) throw new NotFoundError("organization", command.scope.organizationId);
    if (command.scope.level === "unit" && !unit) throw new NotFoundError("unit", command.scope.unitId);

    const entity = createUserRole(command, user, organization ?? undefined, unit ?? undefined);
    const auditTenantId = command.scope.level === "platform" ? user.tenantId : this.tenantId(context);
    await this.d.userRoles.save(entity);
    await this.audit(context, auditTenantId, "role.assigned", "user-role", entity.userId);
    await this.event(context, auditTenantId, "role.assigned", { userId: entity.userId, roleId: entity.roleId, scope: command.scope.level });
    return entity;
  }
}
