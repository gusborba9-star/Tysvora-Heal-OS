import { EntityId } from "../../shared/ids.js";
import { Repository } from "../contracts/core.js";
import { Tenant, Organization, Unit, User, Professional, Subject } from "../domain/entities.js";
import { Role, UserRole } from "../domain/access.js";
import { Configuration, ConfigurationScope, configurationScopeKey, createConfiguration, sameConfigurationScope } from "../domain/context.js";
import { ConfigurationRepository } from "../contracts/application.js";

export class InMemoryRepository<T extends { readonly id: EntityId }> implements Repository<T> {
  private readonly items = new Map<EntityId, T>();
  async getById(id: EntityId): Promise<T | null> { return this.items.get(id) ?? null; }
  async save(entity: T): Promise<void> { this.items.set(entity.id, entity); }
}
export class InMemoryUserRoleRepository implements Repository<UserRole, string> {
  private readonly items = new Map<string, UserRole>();
  async getById(id: string): Promise<UserRole | null> { return this.items.get(id) ?? null; }
  async save(entity: UserRole): Promise<void> { this.items.set(entity.userId + ":" + entity.roleId, entity); }
}
export class InMemoryConfigurationRepository implements ConfigurationRepository {
  private readonly items = new Map<EntityId, Configuration>();

  async getById(id:EntityId):Promise<Configuration|null> {
    const entity=this.items.get(id);
    return entity ? createConfiguration(entity) : null;
  }

  async getByKeyAndScope(key:string,scope:ConfigurationScope):Promise<Configuration|null> {
    const target=configurationScopeKey(scope);
    for(const item of this.items.values()) {
      if(item.key===key && configurationScopeKey(item.scope)===target) return createConfiguration(item);
    }
    return null;
  }

  async save(entity:Configuration):Promise<void> {
    const existing=this.items.get(entity.id);
    if(existing && (existing.key!==entity.key || !sameConfigurationScope(existing.scope,entity.scope))) {
      throw new Error("configuration identity cannot change key or scope");
    }
    this.items.set(entity.id,createConfiguration(entity));
  }

  snapshot():readonly Configuration[] {
    return [...this.items.values()].map(entity=>createConfiguration(entity));
  }
}
export type CoreInMemoryRepositories = {
  tenants: Repository<Tenant>; organizations: Repository<Organization>; units: Repository<Unit>;
  users: Repository<User>; professionals: Repository<Professional>; subjects: Repository<Subject>;
  roles: Repository<Role>; userRoles: Repository<UserRole>;
};
