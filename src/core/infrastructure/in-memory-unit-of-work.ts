import { UnitOfWork } from "../contracts/core.js";
import { Snapshottable } from "./in-memory-repositories.js";

/**
 * In-memory atomicity: runs are serialized and every participant is restored to its pre-run state if
 * the work throws. A real persistence layer must replace this with a database transaction (or an outbox).
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private readonly participants: readonly Snapshottable[]) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      const before = this.participants.map(p => p.captureState());
      try {
        return await work();
      } catch (error) {
        this.participants.forEach((p, i) => p.restoreState(before[i]));
        throw error;
      }
    });
    this.tail = result.catch(() => undefined);
    return result;
  }
}
