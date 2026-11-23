import { randomUUID } from "node:crypto";
import { EntityId } from "../../shared/ids.js";
import { Clock, IdGenerator } from "../contracts/application.js";

/** Unguessable identifiers (UUID v4) for production use; sequential ids would make cross-tenant guessing trivial. */
export class RandomIdGenerator implements IdGenerator {
  next(): EntityId { return randomUUID(); }
}
export class SystemClock implements Clock {
  now(): string { return new Date().toISOString(); }
}
