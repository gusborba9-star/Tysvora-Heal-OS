import { DomainEvent } from "../domain/event.js";
import { Identity } from "../domain/entities.js";
export interface Repository<T,TId=string> { getById(id:TId):Promise<T|null>; save(entity:T):Promise<void>; }
export interface EventPublisher { publish<TPayload>(event:DomainEvent<TPayload>):Promise<void>; }
export interface IdentityProvider { resolve(identityId:string):Promise<Identity|null>; }
