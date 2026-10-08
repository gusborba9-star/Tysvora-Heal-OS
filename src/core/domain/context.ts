import { EntityId, requireNonEmpty } from "../../shared/ids.js";

export interface TenancyContext { readonly tenantId:EntityId; readonly organizationId?:EntityId; readonly unitId?:EntityId; readonly actorUserId?:EntityId; readonly correlationId?:string; }
export function createTenancyContext(input:TenancyContext):TenancyContext { return { tenantId:requireNonEmpty(input.tenantId,"context.tenantId"), organizationId:input.organizationId?requireNonEmpty(input.organizationId,"context.organizationId"):undefined, unitId:input.unitId?requireNonEmpty(input.unitId,"context.unitId"):undefined, actorUserId:input.actorUserId?requireNonEmpty(input.actorUserId,"context.actorUserId"):undefined, correlationId:input.correlationId?requireNonEmpty(input.correlationId,"context.correlationId"):undefined }; }
export interface RequestContext extends TenancyContext {}
export function createRequestContext(input:RequestContext):RequestContext { return createTenancyContext(input); }

export type ConfigurationScope =
  | { readonly level:"platform" }
  | { readonly level:"tenant"; readonly tenantId:EntityId }
  | { readonly level:"organization"; readonly tenantId:EntityId; readonly organizationId:EntityId }
  | { readonly level:"unit"; readonly tenantId:EntityId; readonly organizationId:EntityId; readonly unitId:EntityId }
  | { readonly level:"module"; readonly tenantId:EntityId; readonly moduleId:EntityId };
export interface Configuration { readonly key:string; readonly value:unknown; readonly scope:ConfigurationScope; }
export function createConfiguration(input:Configuration):Configuration { validateConfigScope(input.scope); return { key:requireNonEmpty(input.key,"configuration.key"), value:input.value, scope:input.scope }; }
function validateConfigScope(scope:ConfigurationScope):void { if(scope.level==="tenant") requireNonEmpty(scope.tenantId,"configuration.scope.tenantId"); if(scope.level==="organization"){requireNonEmpty(scope.tenantId,"configuration.scope.tenantId");requireNonEmpty(scope.organizationId,"configuration.scope.organizationId");} if(scope.level==="unit"){requireNonEmpty(scope.tenantId,"configuration.scope.tenantId");requireNonEmpty(scope.organizationId,"configuration.scope.organizationId");requireNonEmpty(scope.unitId,"configuration.scope.unitId");} if(scope.level==="module"){requireNonEmpty(scope.tenantId,"configuration.scope.tenantId");requireNonEmpty(scope.moduleId,"configuration.scope.moduleId");} }
