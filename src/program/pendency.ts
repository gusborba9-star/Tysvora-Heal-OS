import { EntityId, requireId, requireName, requireNonEmpty } from "../shared/ids.js";
import { DomainInvariantError } from "../core/domain/errors.js";
import { PendencyPriority } from "./domain.js";

export type PendencyState = "open" | "assigned" | "in_progress" | "paused" | "escalated" | "resolved" | "closed";
export type PendencyAction = "assign" | "accept" | "transfer" | "pause" | "resume" | "escalate" | "resolve" | "close" | "reopen";

/** Allowed transitions (Blueprint §31): assignment, acceptance, transfer, justified pause, escalation, closure, reopening. */
export const TRANSITIONS: Readonly<Record<PendencyState, Partial<Record<PendencyAction, PendencyState>>>> = {
  open: { assign: "assigned", escalate: "escalated", close: "closed" },
  assigned: { accept: "in_progress", transfer: "assigned", escalate: "escalated", close: "closed" },
  in_progress: { pause: "paused", resolve: "resolved", transfer: "assigned", escalate: "escalated", close: "closed" },
  paused: { resume: "in_progress", escalate: "escalated", close: "closed" },
  escalated: { assign: "assigned", resolve: "resolved", close: "closed" },
  resolved: { reopen: "open", close: "closed" },
  closed: { reopen: "open" }
};
const NEEDS_REASON: ReadonlySet<PendencyAction> = new Set(["pause", "escalate", "resolve", "close", "reopen", "transfer"]);
const PRIORITY_ORDER: readonly PendencyPriority[] = ["low", "normal", "high", "urgent"];

export interface PendencyHistoryEntry {
  readonly at: string; readonly actorId?: EntityId; readonly action: PendencyAction | "created";
  readonly from?: PendencyState; readonly to: PendencyState; readonly assigneeId?: EntityId; readonly reason?: string;
}
export interface PendencyOrigin {
  readonly source: "sentinela" | "professional" | "patient" | "integration";
  readonly ruleSetVersion?: string; readonly evidenceFactIds: readonly EntityId[]; readonly explanation: string;
}
export interface Pendency {
  readonly id: EntityId; readonly tenantId: EntityId; readonly organizationId: EntityId; readonly subjectId: EntityId;
  readonly enrollmentId?: EntityId; readonly category: string; readonly title: string;
  readonly priority: PendencyPriority; readonly priorityReason: string; readonly queue: string;
  readonly assigneeUserId?: EntityId; readonly state: PendencyState; readonly dueAt: string;
  readonly nextAction: string; readonly dedupKey?: string; readonly origin: PendencyOrigin;
  readonly escalationLevel: number; readonly history: readonly PendencyHistoryEntry[];
  readonly closingReason?: string; readonly version: number;
}

export interface NewPendency {
  readonly id: EntityId; readonly tenantId: EntityId; readonly organizationId: EntityId; readonly subjectId: EntityId;
  readonly enrollmentId?: EntityId; readonly category: string; readonly title: string; readonly priority: PendencyPriority;
  readonly priorityReason: string; readonly queue: string; readonly dueAt: string; readonly nextAction: string;
  readonly dedupKey?: string; readonly origin: PendencyOrigin;
}

export function createPendency(input: NewPendency, now: string, actorId?: EntityId): Pendency {
  if (!PRIORITY_ORDER.includes(input.priority)) throw new DomainInvariantError("unknown pendency priority");
  if (Number.isNaN(Date.parse(input.dueAt))) throw new DomainInvariantError("pendency.dueAt must be a valid timestamp");
  return {
    id: requireId(input.id, "pendency.id"), tenantId: requireId(input.tenantId, "pendency.tenantId"),
    organizationId: requireId(input.organizationId, "pendency.organizationId"), subjectId: requireId(input.subjectId, "pendency.subjectId"),
    enrollmentId: input.enrollmentId ? requireId(input.enrollmentId, "pendency.enrollmentId") : undefined,
    category: requireId(input.category, "pendency.category"), title: requireName(input.title, "pendency.title"),
    priority: input.priority, priorityReason: requireNonEmpty(input.priorityReason, "pendency.priorityReason"),
    queue: requireId(input.queue, "pendency.queue"), state: "open", dueAt: input.dueAt,
    nextAction: requireNonEmpty(input.nextAction, "pendency.nextAction"),
    dedupKey: input.dedupKey ? requireNonEmpty(input.dedupKey, "pendency.dedupKey") : undefined,
    origin: input.origin, escalationLevel: 0, version: 1,
    history: [{ at: now, actorId, action: "created", to: "open" }]
  };
}

export interface TransitionInput { readonly action: PendencyAction; readonly at: string; readonly actorId?: EntityId; readonly assigneeUserId?: EntityId; readonly reason?: string; }

export function transitionPendency(p: Pendency, input: TransitionInput): Pendency {
  const to = TRANSITIONS[p.state][input.action];
  if (!to) throw new DomainInvariantError(`pendency in state ${p.state} cannot ${input.action}`);
  if (NEEDS_REASON.has(input.action) && !input.reason?.trim()) throw new DomainInvariantError(`${input.action} requires a justification`);
  const reason = input.reason ? requireNonEmpty(input.reason, "reason") : undefined;
  const needsAssignee = input.action === "assign" || input.action === "transfer";
  if (needsAssignee && !input.assigneeUserId) throw new DomainInvariantError(`${input.action} requires an assignee`);
  if (input.action === "transfer" && input.assigneeUserId === p.assigneeUserId) throw new DomainInvariantError("transfer must change the assignee");
  let priority = p.priority, escalationLevel = p.escalationLevel;
  if (input.action === "escalate") {
    escalationLevel += 1;
    priority = PRIORITY_ORDER[Math.min(PRIORITY_ORDER.indexOf(p.priority) + 1, PRIORITY_ORDER.length - 1)];
  }
  const assigneeUserId = needsAssignee ? requireId(input.assigneeUserId!, "assignee") : input.action === "reopen" ? undefined : p.assigneeUserId;
  const closing = input.action === "resolve" || input.action === "close" ? reason : input.action === "reopen" ? undefined : p.closingReason;
  return {
    ...p, state: to, priority, escalationLevel, assigneeUserId, closingReason: closing, version: p.version + 1,
    history: [...p.history, { at: input.at, actorId: input.actorId, action: input.action, from: p.state, to, assigneeId: assigneeUserId, reason }]
  };
}

export function isOpenState(state: PendencyState): boolean { return state !== "resolved" && state !== "closed"; }
export function isOverdue(p: Pendency, nowIso: string): boolean { return isOpenState(p.state) && Date.parse(nowIso) > Date.parse(p.dueAt); }
export function priorityRank(priority: PendencyPriority): number { return PRIORITY_ORDER.indexOf(priority); }
