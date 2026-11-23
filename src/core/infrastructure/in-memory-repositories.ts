import { EntityId } from "../../shared/ids.js";
import { Repository } from "../contracts/core.js";
import { Tenant, Organization, Unit, User, Professional, Subject } from "../domain/entities.js";
import { Role, UserRole } from "../domain/access.js";

export interface Snapshottable { captureState(): unknown; restoreState(state: unknown): void; }

export class InMemoryRepository<T extends { readonly id: EntityId }> implements Repository<T>, Snapshottable {
  private items = new Map<EntityId, T>();
  async getById(id: EntityId): Promise<T | null> { return this.items.get(id) ?? null; }
  async getInTenant(tenantId: string, id: EntityId): Promise<T | null> {
    const item = this.items.get(id);
    return item && (item as { tenantId?: string }).tenantId === tenantId ? item : null;
  }
  async countInTenant(tenantId: string): Promise<number> { return (await this.listInTenant(tenantId)).length; }
  async listInTenant(tenantId: string): Promise<T[]> {
    return [...this.items.values()].filter(item => (item as { tenantId?: string }).tenantId === tenantId);
  }
  async save(entity: T): Promise<void> { this.items.set(entity.id, entity); }
  captureState(): unknown { return new Map(this.items); }
  restoreState(state: unknown): void { this.items = new Map(state as Map<EntityId, T>); }
}

export function userRoleKey(entity: UserRole): string {
  const s = entity.scope;
  const scopeKey = s.level === "platform" ? "platform"
    : s.level === "tenant" ? `tenant/${s.tenantId}`
    : s.level === "organization" ? `organization/${s.tenantId}/${s.organizationId}`
    : `unit/${s.tenantId}/${s.organizationId}/${s.unitId}`;
  return `${entity.userId}|${entity.roleId}|${scopeKey}`;
}

/** Keyed by user, role AND scope, so a role held at several scopes is never overwritten. */
export class InMemoryUserRoleRepository implements Repository<UserRole, string>, Snapshottable {
  private items = new Map<string, UserRole>();
  async getById(id: string): Promise<UserRole | null> { return this.items.get(id) ?? null; }
  async save(entity: UserRole): Promise<void> { this.items.set(userRoleKey(entity), entity); }
  async listForUser(userId: string): Promise<readonly UserRole[]> { return [...this.items.values()].filter(r => r.userId === userId); }
  captureState(): unknown { return new Map(this.items); }
  restoreState(state: unknown): void { this.items = new Map(state as Map<string, UserRole>); }
}

export class InMemoryIdentityProvider {
  private readonly known = new Map<string, { id: string; subject: string }>();
  register(identity: { id: string; subject: string }): void { this.known.set(identity.id, identity); }
  async resolve(identityId: string) { return this.known.get(identityId) ?? null; }
}

export type CoreInMemoryRepositories = {
  tenants: Repository<Tenant>; organizations: Repository<Organization>; units: Repository<Unit>;
  users: Repository<User>; professionals: Repository<Professional>; subjects: Repository<Subject>;
  roles: Repository<Role>; userRoles: Repository<UserRole>;
};
