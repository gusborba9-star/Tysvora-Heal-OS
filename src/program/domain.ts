import { EntityId, requireId, requireName, requireNonEmpty } from "../shared/ids.js";
import { DomainInvariantError } from "../core/domain/errors.js";

// ---------- Program definition (declarative, versioned, never rewrites history) ----------

export type ProgramStatus = "draft" | "approved" | "retired";
export type SignalKind = "missed-appointments" | "overdue-exam" | "unanswered-demand";
export type PendencyPriority = "low" | "normal" | "high" | "urgent";

export interface ContinuityRule {
  readonly id: string;
  readonly signal: SignalKind;
  /** missed-appointments: threshold (count). overdue-exam: graceDays. unanswered-demand: responseHours. */
  readonly threshold?: number;
  readonly graceDays?: number;
  readonly responseHours?: number;
  /** Only facts newer than this many days are considered. */
  readonly windowDays: number;
}
export interface PendencyPolicy { readonly priority: PendencyPriority; readonly slaHours: number; readonly queue: string; }
export interface ContinuityPolicy { readonly minSignals: number; readonly pendency: PendencyPolicy; }

export interface ProgramDefinition {
  readonly id: EntityId;
  readonly tenantId: EntityId;
  readonly organizationId: EntityId;
  readonly key: string;
  readonly version: number;
  readonly name: string;
  readonly status: ProgramStatus;
  readonly rules: readonly ContinuityRule[];
  readonly continuity: ContinuityPolicy;
  readonly createdBy?: EntityId;
  readonly approvedBy?: EntityId;
  readonly approvedAt?: string;
}

const SIGNALS: readonly SignalKind[] = ["missed-appointments", "overdue-exam", "unanswered-demand"];
const PRIORITIES: readonly PendencyPriority[] = ["low", "normal", "high", "urgent"];

function positiveInt(value: unknown, field: string, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > max) {
    throw new DomainInvariantError(`${field} must be an integer between 1 and ${max}`);
  }
  return value;
}

export function validateRules(rules: readonly ContinuityRule[]): readonly ContinuityRule[] {
  if (!Array.isArray(rules) || rules.length < 1 || rules.length > 20) throw new DomainInvariantError("program must declare between 1 and 20 rules");
  const seen = new Set<string>();
  return rules.map(rule => {
    const id = requireId(rule.id, "rule.id");
    if (seen.has(id)) throw new DomainInvariantError("duplicate rule id: " + id);
    seen.add(id);
    if (!SIGNALS.includes(rule.signal)) throw new DomainInvariantError("unknown signal: " + String(rule.signal));
    const base = { id, signal: rule.signal, windowDays: positiveInt(rule.windowDays, "rule.windowDays", 730) };
    if (rule.signal === "missed-appointments") return { ...base, threshold: positiveInt(rule.threshold, "rule.threshold", 50) };
    if (rule.signal === "overdue-exam") return { ...base, graceDays: positiveInt(rule.graceDays, "rule.graceDays", 365) };
    return { ...base, responseHours: positiveInt(rule.responseHours, "rule.responseHours", 24 * 90) };
  });
}

export function validateContinuity(policy: ContinuityPolicy, ruleCount: number): ContinuityPolicy {
  const minSignals = positiveInt(policy.minSignals, "continuity.minSignals", 20);
  if (minSignals > ruleCount) throw new DomainInvariantError("continuity.minSignals cannot exceed the number of rules");
  if (!PRIORITIES.includes(policy.pendency.priority)) throw new DomainInvariantError("unknown pendency priority");
  return {
    minSignals,
    pendency: {
      priority: policy.pendency.priority,
      slaHours: positiveInt(policy.pendency.slaHours, "pendency.slaHours", 24 * 90),
      queue: requireId(policy.pendency.queue, "pendency.queue")
    }
  };
}

export function createProgramDefinition(input: Omit<ProgramDefinition, "status" | "approvedAt" | "approvedBy">): ProgramDefinition {
  const rules = validateRules(input.rules);
  return {
    id: requireId(input.id, "program.id"), tenantId: requireId(input.tenantId, "program.tenantId"),
    organizationId: requireId(input.organizationId, "program.organizationId"),
    key: requireId(input.key, "program.key"), version: positiveInt(input.version, "program.version", 10_000),
    name: requireName(input.name, "program.name"), status: "draft", rules,
    continuity: validateContinuity(input.continuity, rules.length), createdBy: input.createdBy
  };
}

export function approveProgramDefinition(def: ProgramDefinition, approverId: EntityId, at: string): ProgramDefinition {
  if (def.status !== "draft") throw new DomainInvariantError("only draft program versions can be approved");
  if (def.createdBy && def.createdBy === approverId) throw new DomainInvariantError("a program version cannot be approved by its author");
  return { ...def, status: "approved", approvedBy: requireId(approverId, "approver"), approvedAt: at };
}

// ---------- Enrollment and facts ----------

export interface ProgramEnrollment {
  readonly id: EntityId; readonly tenantId: EntityId; readonly organizationId: EntityId; readonly subjectId: EntityId;
  readonly programKey: string; readonly definitionId: EntityId; readonly programVersion: number;
  readonly status: "active" | "closed"; readonly enrolledAt: string;
}

export type FactKind = "appointment.attended" | "appointment.missed" | "exam.due" | "exam.completed" | "demand.opened" | "demand.answered";
export interface ProgramFact {
  readonly id: EntityId; readonly tenantId: EntityId; readonly enrollmentId: EntityId;
  readonly kind: FactKind; readonly occurredAt: string;
  /** Exam code or demand id the fact refers to. */
  readonly reference?: string;
  /** Required for exam.due. */
  readonly dueAt?: string;
  /** Provenance: where the fact came from (e.g. "ehr-import", "patient-app", "professional"). */
  readonly source: string;
}
export const FACT_KINDS: readonly FactKind[] = ["appointment.attended", "appointment.missed", "exam.due", "exam.completed", "demand.opened", "demand.answered"];

export function createProgramFact(input: ProgramFact, nowIso: string): ProgramFact {
  if (!FACT_KINDS.includes(input.kind)) throw new DomainInvariantError("unknown fact kind: " + String(input.kind));
  const occurred = Date.parse(input.occurredAt);
  if (Number.isNaN(occurred)) throw new DomainInvariantError("fact.occurredAt must be a valid timestamp");
  if (occurred > Date.parse(nowIso) + 24 * 3600_000) throw new DomainInvariantError("fact.occurredAt cannot be in the future");
  const needsRef = input.kind.startsWith("exam.") || input.kind.startsWith("demand.");
  if (needsRef && !input.reference) throw new DomainInvariantError(`${input.kind} requires a reference`);
  if (input.kind === "exam.due" && (!input.dueAt || Number.isNaN(Date.parse(input.dueAt)))) throw new DomainInvariantError("exam.due requires a valid dueAt");
  return {
    id: requireId(input.id, "fact.id"), tenantId: requireId(input.tenantId, "fact.tenantId"),
    enrollmentId: requireId(input.enrollmentId, "fact.enrollmentId"), kind: input.kind, occurredAt: input.occurredAt,
    reference: input.reference ? requireId(input.reference, "fact.reference") : undefined,
    dueAt: input.dueAt, source: requireNonEmpty(input.source, "fact.source")
  };
}
