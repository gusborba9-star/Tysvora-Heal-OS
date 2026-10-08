import { EntityId, requireNonEmpty } from "../../shared/ids.js";

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

export function createRole(input:Role):Role { return { id:requireNonEmpty(input.id,"role.id"), name:requireNonEmpty(input.name,"role.name"), architecturalRole:input.architecturalRole }; }
export function createPermission(input:Permission):Permission { return { id:requireNonEmpty(input.id,"permission.id"), code:requireNonEmpty(input.code,"permission.code") }; }
export function createRolePermission(input:RolePermission):RolePermission { return { roleId:requireNonEmpty(input.roleId,"rolePermission.roleId"), permissionId:requireNonEmpty(input.permissionId,"rolePermission.permissionId") }; }
export function createUserRole(input:UserRole):UserRole { validateScope(input.scope); return { userId:requireNonEmpty(input.userId,"userRole.userId"), roleId:requireNonEmpty(input.roleId,"userRole.roleId"), scope:input.scope }; }
function validateScope(scope:RoleAssignmentScope):void { if(scope.level==="tenant") requireNonEmpty(scope.tenantId,"userRole.scope.tenantId"); if(scope.level==="organization"){requireNonEmpty(scope.tenantId,"userRole.scope.tenantId");requireNonEmpty(scope.organizationId,"userRole.scope.organizationId");} if(scope.level==="unit"){requireNonEmpty(scope.tenantId,"userRole.scope.tenantId");requireNonEmpty(scope.organizationId,"userRole.scope.organizationId");requireNonEmpty(scope.unitId,"userRole.scope.unitId");} }
