import { EntityId } from "../../shared/ids.js";
import { Repository } from "../contracts/core.js";
import { Tenant, Organization, Unit, User, Professional, Subject } from "../domain/entities.js";
import { Role, UserRole } from "../domain/access.js";

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
export type CoreInMemoryRepositories = {
  tenants: Repository<Tenant>; organizations: Repository<Organization>; units: Repository<Unit>;
  users: Repository<User>; professionals: Repository<Professional>; subjects: Repository<Subject>;
  roles: Repository<Role>; userRoles: Repository<UserRole>;
};
