import { EventPublisher } from "../contracts/core.js";
import { DomainEvent } from "../domain/event.js";
import { Snapshottable } from "./in-memory-repositories.js";
export class InMemoryEventPublisher implements EventPublisher, Snapshottable {
  private events: DomainEvent[] = [];
  async publish<TPayload>(event: DomainEvent<TPayload>): Promise<void> { this.events.push(event); }
  snapshot(): readonly DomainEvent[] { return [...this.events]; }
  captureState(): unknown { return [...this.events]; }
  restoreState(state: unknown): void { this.events = [...(state as DomainEvent[])]; }
}
