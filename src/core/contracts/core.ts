import { DomainEvent } from "../domain/event.js";
import { Identity } from "../domain/entities.js";
export interface Repository<T,TId=string> { getById(id:TId):Promise<T|null>; save(entity:T):Promise<void>; }
/** Repository for tenant-owned entities: lookups always carry the tenant, so a forgotten check cannot leak data. */
export interface TenantScopedRepository<T extends { readonly tenantId: string }, TId=string> extends Repository<T, TId> {
  getInTenant(tenantId: string, id: TId): Promise<T|null>;
  countInTenant(tenantId: string): Promise<number>;
}
export interface EventPublisher { publish<TPayload>(event:DomainEvent<TPayload>):Promise<void>; }
export interface IdentityProvider { resolve(identityId:string):Promise<Identity|null>; }
/** Atomic boundary: state, audit and events of one operation commit together or not at all. */
export interface UnitOfWork { run<T>(work: () => Promise<T>): Promise<T>; }
