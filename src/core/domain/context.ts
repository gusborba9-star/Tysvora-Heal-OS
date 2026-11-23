import { EntityId, requireNonEmpty, requireId, requireName } from "../../shared/ids.js";

export interface TenancyContext { readonly tenantId:EntityId; readonly organizationId?:EntityId; readonly unitId?:EntityId; readonly actorUserId?:EntityId; readonly correlationId?:string; }
export function createTenancyContext(input:TenancyContext):TenancyContext {
  return {
    tenantId:requireId(input.tenantId,"context.tenantId"),
    organizationId:input.organizationId?requireId(input.organizationId,"context.organizationId"):undefined,
    unitId:input.unitId?requireId(input.unitId,"context.unitId"):undefined,
    actorUserId:input.actorUserId?requireId(input.actorUserId,"context.actorUserId"):undefined,
    correlationId:input.correlationId?requireId(input.correlationId,"context.correlationId"):undefined
  };
}
export interface RequestContext extends TenancyContext {}
export function createRequestContext(input:RequestContext):RequestContext { return createTenancyContext(input); }

export type ConfigurationScope =
  | { readonly level:"platform" }
  | { readonly level:"tenant"; readonly tenantId:EntityId }
  | { readonly level:"organization"; readonly tenantId:EntityId; readonly organizationId:EntityId }
  | { readonly level:"unit"; readonly tenantId:EntityId; readonly organizationId:EntityId; readonly unitId:EntityId }
  | { readonly level:"module"; readonly tenantId:EntityId; readonly moduleId:EntityId };
export interface Configuration { readonly key:string; readonly value:unknown; readonly scope:ConfigurationScope; }
export function createConfiguration(input:Configuration):Configuration {
  validateConfigScope(input.scope);
  return { key:requireNonEmpty(input.key,"configuration.key"), value:input.value, scope:input.scope };
}
function validateConfigScope(scope:ConfigurationScope):void {
  if(scope.level==="tenant") requireId(scope.tenantId,"configuration.scope.tenantId");
  if(scope.level==="organization"){requireId(scope.tenantId,"configuration.scope.tenantId");requireId(scope.organizationId,"configuration.scope.organizationId");}
  if(scope.level==="unit"){requireId(scope.tenantId,"configuration.scope.tenantId");requireId(scope.organizationId,"configuration.scope.organizationId");requireId(scope.unitId,"configuration.scope.unitId");}
  if(scope.level==="module"){requireId(scope.tenantId,"configuration.scope.tenantId");requireId(scope.moduleId,"configuration.scope.moduleId");}
}
