import { EntityId } from "../../shared/ids.js";
import { Clock, IdGenerator } from "../contracts/application.js";
export class SequenceIdGenerator implements IdGenerator {
  private sequence = 0;
  constructor(private readonly prefix = "id") {}
  next(): EntityId { this.sequence += 1; return this.prefix + "-" + this.sequence; }
}
export class FixedClock implements Clock {
  constructor(private readonly value: string) {}
  now(): string { return this.value; }
}
/** Settable clock for scenarios where time passing is the point (daily sweeps, SLAs). Not for production. */
export class MutableClock implements Clock {
  constructor(private value: string) {}
  now(): string { return this.value; }
  set(value: string): void { if (Number.isNaN(Date.parse(value))) throw new Error("invalid timestamp"); this.value = value; }
  advanceDays(days: number): void { this.value = new Date(Date.parse(this.value) + days * 86400_000).toISOString(); }
}
