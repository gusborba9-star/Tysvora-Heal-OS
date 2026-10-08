import { EntityId, requireNonEmpty } from "../../shared/ids.js";
import { DomainInvariantError } from "./errors.js";
import { Organization, Unit, User } from "./entities.js";

export type ArchitecturalRole = "platform-admin"|"tenant-admin"|"municipal-management"|"unit-management"|"professional"|"patient-user"|"technical-operator";
export interface Role { readonly id: EntityId; readonly name: string; readonly architecturalRole?: ArchitecturalRole; }
export interface Permission { readonly id: EntityId; readonly code: string; }
export interface RolePermission { readonly roleId: EntityId; readonly permissionId: EntityId; }
export type RoleAssignmentScope =
  | { readonly level:"platform" }
  | { readonly level:"tenant"; readonly tenantId:EntityId }
  | { readonly level:"organization"; readonly tenantId:EntityId; readonly organizationId:EntityId }
  | { readonly level:"unit"; readonly tenantId:EntityId; readonly organizationId:EntityId; readonly unitId:EntityId };
export interface UserRole { readonly userId:EntityId; readonly roleId:EntityId; readonly scope:RoleAssignmentScope; }

export function createRole(input:Role):Role {
  return { id:requireNonEmpty(input.id,"role.id"), name:requireNonEmpty(input.name,"role.name"), architecturalRole:input.architecturalRole };
}
export function createPermission(input:Permission):Permission {
  return { id:requireNonEmpty(input.id,"permission.id"), code:requireNonEmpty(input.code,"permission.code") };
}
export function createRolePermission(input:RolePermission):RolePermission {
  return { roleId:requireNonEmpty(input.roleId,"rolePermission.roleId"), permissionId:requireNonEmpty(input.permissionId,"rolePermission.permissionId") };
}

export function createUserRole(input:UserRole, user:User, organization?:Organization, unit?:Unit):UserRole {
  if (input.userId !== user.id) throw new DomainInvariantError("userRole.userId must match its user");
  validateScope(input.scope, user, organization, unit);
  return { userId: user.id, roleId: requireNonEmpty(input.roleId,"userRole.roleId"), scope: input.scope };
}

function validateScope(scope:RoleAssignmentScope, user:User, organization?:Organization, unit?:Unit):void {
  if (scope.level === "platform") return;

  if (scope.level === "tenant") {
    if (scope.tenantId !== user.tenantId) throw new DomainInvariantError("tenant role scope must match user tenant");
    return;
  }

  if (!organization) throw new DomainInvariantError("organization role scope requires an organization");
  if (scope.tenantId !== user.tenantId || scope.tenantId !== organization.tenantId) {
    throw new DomainInvariantError("organization role scope must match user and organization tenant");
  }
  if (scope.organizationId !== organization.id) {
    throw new DomainInvariantError("organization role scope must match its organization");
  }

  if (scope.level === "unit") {
    if (!unit) throw new DomainInvariantError("unit role scope requires a unit");
    if (unit.tenantId !== user.tenantId || unit.tenantId !== organization.tenantId) {
      throw new DomainInvariantError("unit role scope must match user and organization tenant");
    }
    if (unit.organizationId !== organization.id || scope.unitId !== unit.id) {
      throw new DomainInvariantError("unit role scope must match its unit and organization");
    }
  }
}
