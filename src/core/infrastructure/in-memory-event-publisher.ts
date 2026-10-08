import { EventPublisher } from "../contracts/core.js";
import { DomainEvent } from "../domain/event.js";
export class InMemoryEventPublisher implements EventPublisher { private readonly events:DomainEvent[]=[]; async publish<TPayload>(event:DomainEvent<TPayload>):Promise<void>{this.events.push(event);} snapshot():readonly DomainEvent[]{return [...this.events];} }
