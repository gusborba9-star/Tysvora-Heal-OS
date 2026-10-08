import { AuditEntry } from "../domain/audit.js";
import { AuditSink } from "../contracts/application.js";
export class InMemoryAuditSink implements AuditSink {
  private readonly entries: AuditEntry[] = [];
  async append(entry: AuditEntry): Promise<void> { this.entries.push(entry); }
  snapshot(): readonly AuditEntry[] { return [...this.entries]; }
}
