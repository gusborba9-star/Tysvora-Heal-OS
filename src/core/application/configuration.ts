import { EntityId, requireNonEmpty } from "../../shared/ids.js";
import { Configuration, ConfigurationJsonValue, ConfigurationScope, createConfiguration, sameConfigurationScope } from "../domain/context.js";
import { DomainInvariantError } from "../domain/errors.js";
import { createAuditEntry } from "../domain/audit.js";
import { createDomainEvent } from "../domain/event.js";
import { ConfigurationRepository, OrganizationRepository, UnitRepository, AuditSink, IdGenerator, Clock } from "../contracts/application.js";
import { EventPublisher } from "../contracts/core.js";
import { ApplicationContext, AuthorizationService, AuthorizationError, ApplicationError, NotFoundError } from "./core.js";

export interface CreateConfigurationCommand { readonly key:string; readonly value:ConfigurationJsonValue; readonly scope:ConfigurationScope; }
export interface ReadConfigurationCommand { readonly id:EntityId; readonly scope:ConfigurationScope; }
export interface ReadConfigurationByKeyCommand { readonly key:string; readonly scope:ConfigurationScope; }
export interface UpdateConfigurationCommand { readonly id:EntityId; readonly scope:ConfigurationScope; readonly value:ConfigurationJsonValue; }
export interface ConfigurationApplicationDependencies {
  readonly ids:IdGenerator; readonly clock:Clock; readonly authorization:AuthorizationService; readonly audit:AuditSink;
  readonly events:EventPublisher; readonly configurations:ConfigurationRepository; readonly organizations:OrganizationRepository; readonly units:UnitRepository;
}
export class ConfigurationApplication {
  constructor(private readonly d:ConfigurationApplicationDependencies) {}
  private rejectPlatform(scope:ConfigurationScope):void {
    if(scope.level==="platform") throw new ApplicationError("platform configuration is not supported by this execution");
  }
  private validateContextScope(context:ApplicationContext,scope:ConfigurationScope):EntityId {
    this.rejectPlatform(scope);
    if(context.scope!=="tenant") throw new ApplicationError("tenant context is required for configuration operations");
    const tenantId=requireNonEmpty(context.tenantId,"context.tenantId");
    if(scope.tenantId!==tenantId) throw new DomainInvariantError("configuration scope is outside request tenancy");
    if(context.unitId) {
      if(scope.level!=="unit" || scope.unitId!==context.unitId || scope.organizationId!==context.organizationId) throw new DomainInvariantError("configuration scope exceeds request unit scope");
    } else if(context.organizationId) {
      if(scope.level==="tenant" || scope.level==="module") throw new DomainInvariantError("configuration scope exceeds request organization scope");
      if((scope.level==="organization" || scope.level==="unit") && scope.organizationId!==context.organizationId) throw new DomainInvariantError("configuration scope is outside request organization");
    }
    return tenantId;
  }
  private resource(scope:ConfigurationScope):string {
    switch(scope.level) {
      case "platform": return "configuration:platform";
      case "tenant": return "configuration:tenant:"+scope.tenantId;
      case "organization": return "configuration:organization:"+scope.tenantId+":"+scope.organizationId;
      case "unit": return "configuration:unit:"+scope.tenantId+":"+scope.organizationId+":"+scope.unitId;
      case "module": return "configuration:module:"+scope.tenantId+":"+scope.moduleId;
    }
  }
  private async authorize(context:ApplicationContext,action:string,scope:ConfigurationScope,resourceId?:EntityId):Promise<void> {
    const resource=this.resource(scope);
    const allowed=await this.d.authorization.can({actorUserId:context.actorUserId,action,resource,resourceId,context});
    if(!allowed) throw new AuthorizationError(action+" on "+resource+" is not authorized");
  }
  private async validateTarget(scope:ConfigurationScope):Promise<void> {
    if(scope.level==="organization" || scope.level==="unit") {
      const organization=await this.d.organizations.getById(scope.organizationId);
      if(!organization) throw new NotFoundError("organization",scope.organizationId);
      if(organization.tenantId!==scope.tenantId) throw new DomainInvariantError("configuration organization does not belong to scope tenant");
    }
    if(scope.level==="unit") {
      const unit=await this.d.units.getById(scope.unitId);
      if(!unit) throw new NotFoundError("unit",scope.unitId);
      if(unit.tenantId!==scope.tenantId || unit.organizationId!==scope.organizationId) throw new DomainInvariantError("configuration unit does not belong to scope organization and tenant");
    }
  }
  private async record(context:ApplicationContext,tenantId:EntityId,action:string,configuration:Configuration):Promise<void> {
    await this.d.audit.append(createAuditEntry({id:this.d.ids.next(),tenantId,actorId:context.actorUserId,action:"configuration."+action,resource:"configuration",resourceId:configuration.id,timestamp:this.d.clock.now(),correlationId:context.correlationId,result:"success",metadata:{key:configuration.key,scope:configuration.scope.level}}));
    await this.d.events.publish(createDomainEvent({eventId:this.d.ids.next(),eventType:"configuration."+action,version:1,occurredAt:this.d.clock.now(),tenantId,actorId:context.actorUserId,source:"heal-core.configuration",correlationId:context.correlationId,payload:{configurationId:configuration.id,key:configuration.key,scope:configuration.scope.level}}));
  }
  async create(context:ApplicationContext,command:CreateConfigurationCommand):Promise<Configuration> {
    const tenantId=this.validateContextScope(context,command.scope);
    await this.authorize(context,"configuration.create",command.scope,command.key);
    await this.validateTarget(command.scope);
    if(await this.d.configurations.getByKeyAndScope(command.key,command.scope)) throw new ApplicationError("configuration key already exists in this scope");
    const entity=createConfiguration({id:this.d.ids.next(),key:command.key,value:command.value,scope:command.scope});
    if(await this.d.configurations.getById(entity.id)) throw new ApplicationError("configuration identity already exists");
    await this.d.configurations.save(entity);
    await this.record(context,tenantId,"created",entity);
    return entity;
  }
  async getById(context:ApplicationContext,command:ReadConfigurationCommand):Promise<Configuration> {
    const tenantId=this.validateContextScope(context,command.scope);
    await this.authorize(context,"configuration.read",command.scope,command.id);
    await this.validateTarget(command.scope);
    const entity=await this.d.configurations.getById(command.id);
    if(!entity || !sameConfigurationScope(entity.scope,command.scope) || entity.scope.tenantId!==tenantId) throw new NotFoundError("configuration",command.id);
    return entity;
  }
  async getByKey(context:ApplicationContext,command:ReadConfigurationByKeyCommand):Promise<Configuration> {
    const tenantId=this.validateContextScope(context,command.scope);
    const key=requireNonEmpty(command.key,"configuration.key");
    await this.authorize(context,"configuration.read",command.scope,key);
    await this.validateTarget(command.scope);
    const entity=await this.d.configurations.getByKeyAndScope(key,command.scope);
    if(!entity || !sameConfigurationScope(entity.scope,command.scope) || entity.scope.tenantId!==tenantId) throw new NotFoundError("configuration",key);
    return entity;
  }
  async update(context:ApplicationContext,command:UpdateConfigurationCommand):Promise<Configuration> {
    const tenantId=this.validateContextScope(context,command.scope);
    await this.authorize(context,"configuration.update",command.scope,command.id);
    await this.validateTarget(command.scope);
    const current=await this.d.configurations.getById(command.id);
    if(!current || !sameConfigurationScope(current.scope,command.scope) || current.scope.tenantId!==tenantId) throw new NotFoundError("configuration",command.id);
    const updated=createConfiguration({id:current.id,key:current.key,value:command.value,scope:current.scope});
    await this.d.configurations.save(updated);
    await this.record(context,tenantId,"updated",updated);
    return updated;
  }
}
