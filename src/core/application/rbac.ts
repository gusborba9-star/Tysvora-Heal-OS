import { EntityId } from "../../shared/ids.js";
import { Role, RoleAssignmentScope, UserRole } from "../domain/access.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../domain/permissions.js";
import { RoleRepository, UserRoleRepository } from "../contracts/application.js";
import { ApplicationContext, AuthorizationRequest, AuthorizationService } from "./shared.js";

/** Optional extra grants per role (beyond the defaults of its architectural role). */
export interface RolePermissionSource { grantsFor(roleId: EntityId): Promise<readonly string[]>; }

export interface RbacOptions {
  readonly roles: RoleRepository;
  readonly userRoles: UserRoleRepository;
  readonly grants?: RolePermissionSource;
  /**
   * Break-glass platform operators, configured out of band (environment/secret manager), never created at runtime.
   * They bootstrap the first platform administrator; every action they take is still audited with their id.
   */
  readonly platformOperators?: ReadonlySet<EntityId>;
}

/** The only tenant-level actions break-glass operators may take: enough to create the first administrators of a tenant. */
const OPERATOR_PROVISIONING_ACTIONS: ReadonlySet<string> = new Set(["tenant.read", "organization.create", "unit.create", "user.create", "role.create", "role.assign"]);

function scopeCovers(scope: RoleAssignmentScope, context: ApplicationContext): boolean {
  if (scope.level === "platform") return true;
  if (context.scope !== "tenant" || context.tenantId !== scope.tenantId) return false;
  if (scope.level === "tenant") return true;
  if (context.organizationId !== scope.organizationId) return false;
  if (scope.level === "organization") return true;
  return context.unitId === scope.unitId;
}

/** Deny-by-default role-based policy with scope coverage and a no-privilege-escalation rule for role assignment. */
export class RbacAuthorizationService implements AuthorizationService {
  constructor(private readonly o: RbacOptions) {}

  private async permissionsOf(role: Role): Promise<Set<string>> {
    const base = role.architecturalRole ? DEFAULT_ROLE_PERMISSIONS[role.architecturalRole] : [];
    return new Set([...base, ...(await this.o.grants?.grantsFor(role.id) ?? [])]);
  }

  async effectivePermissions(actorUserId: EntityId, context: ApplicationContext): Promise<ReadonlySet<string>> {
    const assignments: readonly UserRole[] = await this.o.userRoles.listForUser(actorUserId);
    const result = new Set<string>();
    for (const assignment of assignments) {
      if (!scopeCovers(assignment.scope, context)) continue;
      const role = await this.o.roles.getById(assignment.roleId);
      if (!role) continue;
      if (role.tenantId && (context.scope !== "tenant" || context.tenantId !== role.tenantId)) continue;
      for (const permission of await this.permissionsOf(role)) result.add(permission);
    }
    return result;
  }

  async can(request: AuthorizationRequest): Promise<boolean> {
    const actor = request.actorUserId;
    if (!actor) return false;
    if (this.o.platformOperators?.has(actor) && (request.context.scope === "platform" || OPERATOR_PROVISIONING_ACTIONS.has(request.action))) return true;
    const permissions = await this.effectivePermissions(actor, request.context);
    if (!permissions.has(request.action)) return false;

    // No privilege escalation: nobody can hand out a role holding permissions they do not hold themselves.
    if (request.action === "role.assign" || request.action === "role.assign.platform") {
      const roleId = request.attributes?.roleId;
      if (typeof roleId !== "string") return false;
      const target = await this.o.roles.getById(roleId);
      if (!target) return false;
      for (const permission of await this.permissionsOf(target)) if (!permissions.has(permission)) return false;
    }
    return true;
  }
}
