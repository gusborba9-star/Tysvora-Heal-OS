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
