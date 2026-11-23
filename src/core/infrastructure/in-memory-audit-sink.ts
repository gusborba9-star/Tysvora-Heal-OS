import { AuditEntry } from "../domain/audit.js";
import { AuditSink } from "../contracts/application.js";
import { Snapshottable } from "./in-memory-repositories.js";
export class InMemoryAuditSink implements AuditSink, Snapshottable {
  private entries: AuditEntry[] = [];
  async append(entry: AuditEntry): Promise<void> { this.entries.push(entry); }
  snapshot(): readonly AuditEntry[] { return [...this.entries]; }
  captureState(): unknown { return [...this.entries]; }
  restoreState(state: unknown): void { this.entries = [...(state as AuditEntry[])]; }
}
