import { EntityId } from "../shared/ids.js";
import { ProgramDefinition, ProgramEnrollment, ProgramFact, ContinuityRule } from "./domain.js";

const DAY = 24 * 3600_000, HOUR = 3600_000;

export interface Signal {
  readonly ruleId: string; readonly signal: ContinuityRule["signal"];
  readonly evidenceFactIds: readonly EntityId[]; readonly detail: string;
}
export interface ContinuityAssessment {
  readonly enrollmentId: EntityId; readonly evaluatedAt: string;
  /** Rule set that produced the result, "<program key>@v<version>". */
  readonly ruleSetVersion: string;
  readonly signals: readonly Signal[]; readonly continuityBreak: boolean;
  readonly explanation: string; readonly limitations: string;
}

const LIMITATIONS = "Rule-based continuity signal over recorded facts only; it is not a clinical assessment and does not replace professional judgement.";

function evaluateRule(rule: ContinuityRule, facts: readonly ProgramFact[], now: number): Signal | null {
  const since = now - rule.windowDays * DAY;
  const time = (f: ProgramFact) => Date.parse(f.occurredAt);
  if (rule.signal === "missed-appointments") {
    const lastAttended = Math.max(-Infinity, ...facts.filter(f => f.kind === "appointment.attended").map(time));
    const missed = facts.filter(f => f.kind === "appointment.missed" && time(f) >= since && time(f) > lastAttended);
    return missed.length >= (rule.threshold ?? 1)
      ? { ruleId: rule.id, signal: rule.signal, evidenceFactIds: missed.map(f => f.id), detail: `${missed.length} missed appointment(s) without a later attended one (threshold ${rule.threshold})` }
      : null;
  }
  if (rule.signal === "overdue-exam") {
    const overdue = facts.filter(f => f.kind === "exam.due" && f.dueAt && Date.parse(f.dueAt) >= since
      && Date.parse(f.dueAt) + (rule.graceDays ?? 0) * DAY < now
      && !facts.some(c => c.kind === "exam.completed" && c.reference === f.reference && time(c) >= time(f)));
    return overdue.length > 0
      ? { ruleId: rule.id, signal: rule.signal, evidenceFactIds: overdue.map(f => f.id), detail: `${overdue.length} exam(s) past due by more than ${rule.graceDays} day(s): ${overdue.map(f => f.reference).join(", ")}` }
      : null;
  }
  const unanswered = facts.filter(f => f.kind === "demand.opened" && time(f) >= since
    && now - time(f) > (rule.responseHours ?? 0) * HOUR
    && !facts.some(a => a.kind === "demand.answered" && a.reference === f.reference && time(a) >= time(f)));
  return unanswered.length > 0
    ? { ruleId: rule.id, signal: rule.signal, evidenceFactIds: unanswered.map(f => f.id), detail: `${unanswered.length} patient demand(s) unanswered for more than ${rule.responseHours} hour(s)` }
    : null;
}

/** Pure and deterministic: the same definition, facts and clock always yield the same assessment. */
export function assessContinuity(def: ProgramDefinition, enrollment: ProgramEnrollment, facts: readonly ProgramFact[], nowIso: string): ContinuityAssessment {
  const now = Date.parse(nowIso);
  const own = facts.filter(f => f.enrollmentId === enrollment.id && f.tenantId === enrollment.tenantId);
  const signals = def.rules.map(rule => evaluateRule(rule, own, now)).filter((s): s is Signal => s !== null);
  const continuityBreak = signals.length >= def.continuity.minSignals;
  return {
    enrollmentId: enrollment.id, evaluatedAt: nowIso, ruleSetVersion: `${def.key}@v${def.version}`, signals, continuityBreak,
    explanation: continuityBreak
      ? `${signals.length} of ${def.rules.length} continuity rules fired (minimum ${def.continuity.minSignals}): ${signals.map(s => s.detail).join("; ")}.`
      : `${signals.length} of ${def.rules.length} continuity rules fired (minimum ${def.continuity.minSignals}).`,
    limitations: LIMITATIONS
  };
}
