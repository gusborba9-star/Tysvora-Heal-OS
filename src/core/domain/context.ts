import { EntityId, requireNonEmpty } from "../../shared/ids.js";

export interface TenancyContext { readonly tenantId:EntityId; readonly organizationId?:EntityId; readonly unitId?:EntityId; readonly actorUserId?:EntityId; readonly correlationId?:string; }
export function createTenancyContext(input:TenancyContext):TenancyContext {
  return { tenantId:requireNonEmpty(input.tenantId,"context.tenantId"), organizationId:input.organizationId?requireNonEmpty(input.organizationId,"context.organizationId"):undefined, unitId:input.unitId?requireNonEmpty(input.unitId,"context.unitId"):undefined, actorUserId:input.actorUserId?requireNonEmpty(input.actorUserId,"context.actorUserId"):undefined, correlationId:input.correlationId?requireNonEmpty(input.correlationId,"context.correlationId"):undefined };
}
export interface RequestContext extends TenancyContext {}
export function createRequestContext(input:RequestContext):RequestContext { return createTenancyContext(input); }

export type ConfigurationScope =
  | { readonly level:"platform" }
  | { readonly level:"tenant"; readonly tenantId:EntityId }
  | { readonly level:"organization"; readonly tenantId:EntityId; readonly organizationId:EntityId }
  | { readonly level:"unit"; readonly tenantId:EntityId; readonly organizationId:EntityId; readonly unitId:EntityId }
  | { readonly level:"module"; readonly tenantId:EntityId; readonly moduleId:EntityId };
export type ConfigurationJsonValue = string | number | boolean | null | ConfigurationJsonValue[] | { readonly [key:string]:ConfigurationJsonValue };
export interface Configuration { readonly id:EntityId; readonly key:string; readonly value:ConfigurationJsonValue; readonly scope:ConfigurationScope; }
export function createConfiguration(input:Configuration):Configuration {
  const id=requireNonEmpty(input.id,"configuration.id");
  const key=requireNonEmpty(input.key,"configuration.key");
  validateConfigScope(input.scope);
  return {id,key,value:cloneJsonValue(input.value),scope:copyScope(input.scope)};
}
export function configurationScopeKey(scope:ConfigurationScope):string {
  validateConfigScope(scope);
  switch(scope.level) {
    case "platform": return JSON.stringify(["platform"]);
    case "tenant": return JSON.stringify(["tenant", scope.tenantId]);
    case "organization": return JSON.stringify(["organization", scope.tenantId, scope.organizationId]);
    case "unit": return JSON.stringify(["unit", scope.tenantId, scope.organizationId, scope.unitId]);
    case "module": return JSON.stringify(["module", scope.tenantId, scope.moduleId]);
  }
}
export function sameConfigurationScope(a:ConfigurationScope,b:ConfigurationScope):boolean { return configurationScopeKey(a)===configurationScopeKey(b); }
function copyScope(scope:ConfigurationScope):ConfigurationScope {
  switch(scope.level) {
    case "platform": return {level:"platform"};
    case "tenant": return {level:"tenant",tenantId:requireNonEmpty(scope.tenantId,"configuration.scope.tenantId")};
    case "organization": return {level:"organization",tenantId:requireNonEmpty(scope.tenantId,"configuration.scope.tenantId"),organizationId:requireNonEmpty(scope.organizationId,"configuration.scope.organizationId")};
    case "unit": return {level:"unit",tenantId:requireNonEmpty(scope.tenantId,"configuration.scope.tenantId"),organizationId:requireNonEmpty(scope.organizationId,"configuration.scope.organizationId"),unitId:requireNonEmpty(scope.unitId,"configuration.scope.unitId")};
    case "module": return {level:"module",tenantId:requireNonEmpty(scope.tenantId,"configuration.scope.tenantId"),moduleId:requireNonEmpty(scope.moduleId,"configuration.scope.moduleId")};
  }
}
function validateConfigScope(scope:ConfigurationScope):void {
  if(scope.level==="tenant") requireNonEmpty(scope.tenantId,"configuration.scope.tenantId");
  if(scope.level==="organization"){requireNonEmpty(scope.tenantId,"configuration.scope.tenantId");requireNonEmpty(scope.organizationId,"configuration.scope.organizationId");}
  if(scope.level==="unit"){requireNonEmpty(scope.tenantId,"configuration.scope.tenantId");requireNonEmpty(scope.organizationId,"configuration.scope.organizationId");requireNonEmpty(scope.unitId,"configuration.scope.unitId");}
  if(scope.level==="module"){requireNonEmpty(scope.tenantId,"configuration.scope.tenantId");requireNonEmpty(scope.moduleId,"configuration.scope.moduleId");}
}
function cloneJsonValue(value:unknown):ConfigurationJsonValue {
  const seen=new Set<object>();
  const visit=(current:unknown,path:string):ConfigurationJsonValue=>{
    if(current===null || typeof current==="string" || typeof current==="boolean") return current;
    if(typeof current==="number"){if(!Number.isFinite(current)) throw new Error(path+" must contain only finite JSON numbers");return current;}
    if(typeof current!=="object") throw new Error(path+" must be JSON-representable");
    if(seen.has(current as object)) throw new Error(path+" must not contain cycles");
    seen.add(current as object);
    if(Array.isArray(current)){const result=current.map((item,index)=>visit(item,path+"["+index+"]"));seen.delete(current);return result;}
    const prototype=Object.getPrototypeOf(current);
    if(prototype!==Object.prototype && prototype!==null) throw new Error(path+" must contain only plain JSON objects");
    const result:Record<string,ConfigurationJsonValue>={};
    for(const [key,item] of Object.entries(current as Record<string,unknown>)){
      if(item===undefined) throw new Error(path+"."+key+" must not be undefined");
      const cloned=visit(item,path+"."+key);
      Object.defineProperty(result,key,{value:cloned,enumerable:true,configurable:true,writable:true});
    }
    seen.delete(current as object);return result;
  };
  return visit(value,"configuration.value");
}
