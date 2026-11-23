import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HealCoreApplication, ProgramApplication, platformContext, tenantContext, SequenceIdGenerator, FixedClock,
  InMemoryAuditSink, InMemoryEventPublisher, InMemoryRepository, InMemoryUserRoleRepository, InMemoryIdentityProvider,
  InMemoryUnitOfWork, AuthorizationError, DomainInvariantError, NotFoundError, AuthorizationService, AuthorizationRequest,
  AuditSink, assessContinuity, ContinuityRule, ContinuityPolicy, ProgramDefinition, ProgramEnrollment, ProgramFact, ApplicationContext, Pendency, UnlimitedEntitlementsForTestsOnly
} from "../src/index.js";

const NOW = "2026-11-23T12:00:00.000Z";
const daysAgo = (n: number) => new Date(Date.parse(NOW) - n * 86400_000).toISOString();
const hoursAgo = (n: number) => new Date(Date.parse(NOW) - n * 3600_000).toISOString();

class Policy implements AuthorizationService {
  denied = new Set<string>();
  async can(r: AuthorizationRequest): Promise<boolean> { return !this.denied.has(r.action); }
}

const DIABETES_RULES: ContinuityRule[] = [
  { id: "missed-visits", signal: "missed-appointments", threshold: 2, windowDays: 90 },
  { id: "hba1c-overdue", signal: "overdue-exam", graceDays: 7, windowDays: 180 },
  { id: "demand-unanswered", signal: "unanswered-demand", responseHours: 48, windowDays: 30 }
];
const POLICY: ContinuityPolicy = { minSignals: 2, pendency: { priority: "high", slaHours: 48, queue: "care-coordination" } };

async function world(opts: { failAuditOn?: (action: string) => boolean } = {}) {
  const policy = new Policy();
  const core = {
    tenants: new InMemoryRepository<any>(), organizations: new InMemoryRepository<any>(), units: new InMemoryRepository<any>(),
    users: new InMemoryRepository<any>(), professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(),
    roles: new InMemoryRepository<any>(), userRoles: new InMemoryUserRoleRepository()
  };
  const prog = {
    definitions: new InMemoryRepository<ProgramDefinition>(), enrollments: new InMemoryRepository<ProgramEnrollment>(),
    facts: new InMemoryRepository<ProgramFact>(), pendencies: new InMemoryRepository<Pendency>()
  };
  const realAudit = new InMemoryAuditSink();
  const audit: AuditSink & { snapshot: () => readonly any[]; captureState: () => unknown; restoreState: (s: unknown) => void } = {
    async append(e) { if (opts.failAuditOn?.(e.action)) throw new Error("audit down"); await realAudit.append(e); },
    snapshot: () => realAudit.snapshot(), captureState: () => realAudit.captureState(), restoreState: s => realAudit.restoreState(s)
  };
  const events = new InMemoryEventPublisher();
  const identities = new InMemoryIdentityProvider();
  for (const i of ["i1", "i2", "i3", "i4"]) identities.register({ id: i, subject: "s-" + i });
  const ids = new SequenceIdGenerator("w");
  const clock = new FixedClock(NOW);
  const unitOfWork = new InMemoryUnitOfWork([audit, events, ...Object.values(core), ...Object.values(prog)]);
  const base = { ids, clock, authorization: policy, audit, events, unitOfWork, entitlements: new UnlimitedEntitlementsForTestsOnly() };
  const coreApp = new HealCoreApplication({ ...base, identities, ...core });
  const app = new ProgramApplication({ ...base, ...prog, subjects: core.subjects, users: core.users });

  const root = platformContext({ actorUserId: "root" });
  const tenantA = await coreApp.createTenant(root, { name: "Tenant A" });
  const tenantB = await coreApp.createTenant(root, { name: "Tenant B" });
  const adminA = tenantContext({ tenantId: tenantA.id });
  const adminB = tenantContext({ tenantId: tenantB.id });
  const orgA = await coreApp.createOrganization(adminA, { tenantId: tenantA.id, name: "UBS Centro" });
  const orgA2 = await coreApp.createOrganization(adminA, { tenantId: tenantA.id, name: "UBS Norte" });
  const orgB = await coreApp.createOrganization(adminB, { tenantId: tenantB.id, name: "Clinica B" });
  const u = (t: typeof tenantA, ctx: ApplicationContext, identityId: string, name: string) => coreApp.createUser(ctx, { tenantId: t.id, identityId, displayName: name });
  const author = await u(tenantA, adminA, "i1", "Author");
  const approver = await u(tenantA, adminA, "i2", "Approver");
  const nurse = await u(tenantA, adminA, "i3", "Nurse");
  const foreignUser = await u(tenantB, adminB, "i4", "Foreign");
  const ctx = (userId: string, org = orgA.id, tenant = tenantA.id) => tenantContext({ tenantId: tenant, organizationId: org, actorUserId: userId });
  const authorCtx = ctx(author.id), approverCtx = ctx(approver.id), nurseCtx = ctx(nurse.id);
  const subject = await coreApp.createSubject(authorCtx, { tenantId: tenantA.id, organizationId: orgA.id, displayName: "Maria Souza" });
  const subject2 = await coreApp.createSubject(authorCtx, { tenantId: tenantA.id, organizationId: orgA.id, displayName: "Joao Lima" });
  return { app, coreApp, policy, audit, events, prog, core, tenantA, tenantB, orgA, orgA2, orgB, author, approver, nurse, foreignUser, ctx, authorCtx, approverCtx, nurseCtx, subject, subject2 };
}

async function diabetes(w: Awaited<ReturnType<typeof world>>) {
  const draft = await w.app.createProgram(w.authorCtx, { key: "diabetes", name: "Diabetes tipo 2", rules: DIABETES_RULES, continuity: POLICY });
  return w.app.approveProgram(w.approverCtx, draft.id);
}

test("diabetes end to end: missed visits + overdue exam + unanswered demand open one explained pendency", async () => {
  const w = await world();
  const def = await diabetes(w);
  const enrollment = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  assert.equal(enrollment.programVersion, 1);
  assert.equal(enrollment.definitionId, def.id);
  await w.app.recordFact(w.nurseCtx, { enrollmentId: enrollment.id, kind: "appointment.missed", occurredAt: daysAgo(40), source: "agenda" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: enrollment.id, kind: "appointment.missed", occurredAt: daysAgo(10), source: "agenda" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: enrollment.id, kind: "exam.due", occurredAt: daysAgo(60), dueAt: daysAgo(30), reference: "hba1c", source: "plan" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: enrollment.id, kind: "demand.opened", occurredAt: daysAgo(3), reference: "d1", source: "patient-app" });

  const first = await w.app.evaluateContinuity(w.nurseCtx, enrollment.id);
  assert.equal(first.created, true);
  assert.equal(first.assessment.signals.length, 3);
  assert.equal(first.assessment.ruleSetVersion, "diabetes@v1");
  const p = first.pendency!;
  assert.equal(p.priority, "high");
  assert.equal(p.queue, "care-coordination");
  assert.equal(p.state, "open");
  assert.equal(p.dueAt, new Date(Date.parse(NOW) + 48 * 3600_000).toISOString());
  assert.equal(p.origin.source, "sentinela");
  assert.equal(p.origin.evidenceFactIds.length, 4);
  assert.match(p.origin.explanation, /not a clinical assessment/);

  const second = await w.app.evaluateContinuity(w.nurseCtx, enrollment.id);
  assert.equal(second.created, false);
  assert.equal(second.pendency!.id, p.id);
  assert.equal((await w.prog.pendencies.listInTenant(w.tenantA.id)).length, 1);
});

test("a single signal does not open a pendency; attending the visit clears the missed-visit signal", async () => {
  const w = await world();
  await diabetes(w);
  const e = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(20), source: "agenda" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(15), source: "agenda" });
  assert.equal((await w.app.evaluateContinuity(w.nurseCtx, e.id)).assessment.signals.length, 1);
  assert.equal((await w.app.evaluateContinuity(w.nurseCtx, e.id)).pendency, null);
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.attended", occurredAt: daysAgo(5), source: "agenda" });
  assert.equal((await w.app.evaluateContinuity(w.nurseCtx, e.id)).assessment.signals.length, 0);
});

test("an exam completed after it was due clears the overdue signal; an answered demand clears the demand signal", async () => {
  const w = await world();
  const def = await diabetes(w);
  const e = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  const due = await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "exam.due", occurredAt: daysAgo(60), dueAt: daysAgo(30), reference: "hba1c", source: "plan" });
  const opened = await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "demand.opened", occurredAt: daysAgo(3), reference: "d1", source: "patient-app" });
  const facts = [due, opened];
  assert.equal(assessContinuity(def, e, facts, NOW).signals.length, 2);
  const done = { ...due, id: "f-done", kind: "exam.completed" as const, occurredAt: daysAgo(2), dueAt: undefined };
  const answered = { ...opened, id: "f-ans", kind: "demand.answered" as const, occurredAt: daysAgo(2) };
  assert.equal(assessContinuity(def, e, [...facts, done, answered], NOW).signals.length, 0);
  assert.deepEqual(assessContinuity(def, e, facts, NOW), assessContinuity(def, e, [...facts], NOW), "deterministic");
});

test("program versions: enrollments stay pinned to the version they joined; new versions need their own approval", async () => {
  const w = await world();
  await diabetes(w);
  const e1 = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  const v2draft = await w.app.createProgram(w.authorCtx, { key: "diabetes", name: "Diabetes tipo 2 (revisado)", rules: DIABETES_RULES, continuity: { ...POLICY, minSignals: 1 } }, 2);
  assert.equal((await w.app.enroll(w.nurseCtx, { subjectId: w.subject2.id, programKey: "diabetes" })).programVersion, 1, "unapproved v2 is not used");
  await w.app.approveProgram(w.approverCtx, v2draft.id);
  const stored = await w.prog.enrollments.getInTenant(w.tenantA.id, e1.id);
  assert.equal(stored?.programVersion, 1);
  // Historic enrollment keeps being judged by v1 rules (minSignals 2) even though v2 (minSignals 1) is now approved.
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e1.id, kind: "appointment.missed", occurredAt: daysAgo(20), source: "a" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e1.id, kind: "appointment.missed", occurredAt: daysAgo(10), source: "a" });
  const judged = await w.app.evaluateContinuity(w.nurseCtx, e1.id);
  assert.equal(judged.assessment.ruleSetVersion, "diabetes@v1");
  assert.equal(judged.pendency, null);
  await assert.rejects(() => w.app.createProgram(w.authorCtx, { key: "diabetes", name: "dup", rules: DIABETES_RULES, continuity: POLICY }, 2), DomainInvariantError);
});

test("governance: an author cannot approve their own program; enrolling twice is refused; unapproved programs cannot be used", async () => {
  const w = await world();
  const draft = await w.app.createProgram(w.authorCtx, { key: "tabagismo", name: "Tabagismo", rules: DIABETES_RULES, continuity: POLICY });
  await assert.rejects(() => w.app.approveProgram(w.authorCtx, draft.id), DomainInvariantError);
  await assert.rejects(() => w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "tabagismo" }), NotFoundError);
  await w.app.approveProgram(w.approverCtx, draft.id);
  await assert.rejects(() => w.app.approveProgram(w.approverCtx, draft.id), DomainInvariantError);
  await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "tabagismo" });
  await assert.rejects(() => w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "tabagismo" }), DomainInvariantError);
});

test("the same engine runs a different program (veterinary vaccine return) by configuration only", async () => {
  const w = await world();
  const vet = await w.app.createProgram(w.authorCtx, {
    key: "vacina-retorno", name: "Retorno de vacina",
    rules: [{ id: "vaccine-overdue", signal: "overdue-exam", graceDays: 14, windowDays: 365 }],
    continuity: { minSignals: 1, pendency: { priority: "normal", slaHours: 72, queue: "reception" } }
  });
  await w.app.approveProgram(w.approverCtx, vet.id);
  const e = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "vacina-retorno" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "exam.due", occurredAt: daysAgo(60), dueAt: daysAgo(30), reference: "antirrabica", source: "carteira" });
  const r = await w.app.evaluateContinuity(w.nurseCtx, e.id);
  assert.equal(r.created, true);
  assert.equal(r.pendency!.queue, "reception");
  assert.equal(r.pendency!.priority, "normal");
});

test("definitions are validated: bad thresholds, duplicate rules, unreachable minSignals and hostile names are rejected", async () => {
  const w = await world();
  const bad = (rules: any, continuity: any = POLICY, name = "X") => w.app.createProgram(w.authorCtx, { key: "k" + Math.random().toString(36).slice(2, 8), name, rules, continuity });
  await assert.rejects(() => bad([]), DomainInvariantError);
  await assert.rejects(() => bad([{ id: "a", signal: "missed-appointments", threshold: 0, windowDays: 30 }]), DomainInvariantError);
  await assert.rejects(() => bad([{ id: "a", signal: "missed-appointments", threshold: 1, windowDays: 30 }, { id: "a", signal: "overdue-exam", graceDays: 1, windowDays: 30 }]), DomainInvariantError);
  await assert.rejects(() => bad([{ id: "a", signal: "nonsense", windowDays: 30 }]), DomainInvariantError);
  await assert.rejects(() => bad(DIABETES_RULES, { ...POLICY, minSignals: 4 }), DomainInvariantError);
  await assert.rejects(() => bad(DIABETES_RULES, { ...POLICY, pendency: { ...POLICY.pendency, slaHours: -1 } }), DomainInvariantError);
  await assert.rejects(() => bad(DIABETES_RULES, POLICY, "<script>alert(1)</script>"));
});

test("facts are validated: future dates, unknown kinds, missing references and due dates are rejected", async () => {
  const w = await world();
  await diabetes(w);
  const e = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  const rec = (c: any) => w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, source: "x", occurredAt: daysAgo(1), ...c });
  await assert.rejects(() => rec({ kind: "appointment.missed", occurredAt: new Date(Date.parse(NOW) + 5 * 86400_000).toISOString() }), DomainInvariantError);
  await assert.rejects(() => rec({ kind: "appointment.missed", occurredAt: "not-a-date" }), DomainInvariantError);
  await assert.rejects(() => rec({ kind: "made.up" }), DomainInvariantError);
  await assert.rejects(() => rec({ kind: "exam.due", reference: "hba1c" }), DomainInvariantError);
  await assert.rejects(() => rec({ kind: "demand.opened" }), DomainInvariantError);
});

async function openPendency(w: Awaited<ReturnType<typeof world>>) {
  await diabetes(w);
  const e = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(20), source: "a" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(10), source: "a" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "demand.opened", occurredAt: daysAgo(3), reference: "d1", source: "p" });
  return { enrollment: e, pendency: (await w.app.evaluateContinuity(w.nurseCtx, e.id)).pendency! };
}

test("pendency lifecycle: assign, accept, justified pause, resume, escalate, resolve, reopen, with full history", async () => {
  const w = await world();
  const { pendency: p } = await openPendency(w);
  const act = (ctx: ApplicationContext, action: any, extra: any = {}) => w.app.actOnPendency(ctx, { pendencyId: p.id, action, ...extra });
  await assert.rejects(() => act(w.nurseCtx, "resolve", { reason: "done" }), DomainInvariantError, "cannot resolve before accepting");
  await assert.rejects(() => act(w.nurseCtx, "assign"), DomainInvariantError, "assignee required");
  await act(w.nurseCtx, "assign", { assigneeUserId: w.nurse.id });
  await assert.rejects(() => act(w.approverCtx, "accept"), DomainInvariantError, "only the assignee accepts");
  await act(w.nurseCtx, "accept");
  await assert.rejects(() => act(w.nurseCtx, "pause"), DomainInvariantError, "pause needs a justification");
  await act(w.nurseCtx, "pause", { reason: "waiting for patient call-back" });
  await act(w.nurseCtx, "resume");
  const escalated = await act(w.nurseCtx, "escalate", { reason: "no answer after 3 attempts" });
  assert.equal(escalated.priority, "urgent");
  assert.equal(escalated.escalationLevel, 1);
  await act(w.nurseCtx, "assign", { assigneeUserId: w.approver.id });
  const resolved = await act(ctxFor(w, w.approver.id), "accept").then(() => act(ctxFor(w, w.approver.id), "resolve", { reason: "patient rescheduled, exam booked" }));
  assert.equal(resolved.state, "resolved");
  assert.equal(resolved.closingReason, "patient rescheduled, exam booked");
  const reopened = await act(w.nurseCtx, "reopen", { reason: "patient missed the new visit" });
  assert.equal(reopened.state, "open");
  assert.equal(reopened.assigneeUserId, undefined);
  assert.equal(reopened.closingReason, undefined);
  assert.deepEqual(reopened.history.map(h => h.action), ["created", "assign", "accept", "pause", "resume", "escalate", "assign", "accept", "resolve", "reopen"]);
  assert.equal(reopened.version, 10);
});
function ctxFor(w: Awaited<ReturnType<typeof world>>, userId: string) { return w.ctx(userId); }

test("a resolved pendency can be re-detected: closing allows a new one for the same enrollment", async () => {
  const w = await world();
  const { enrollment, pendency } = await openPendency(w);
  await w.app.actOnPendency(w.nurseCtx, { pendencyId: pendency.id, action: "close", reason: "enrollment duplicated by mistake" });
  const again = await w.app.evaluateContinuity(w.nurseCtx, enrollment.id);
  assert.equal(again.created, true);
  assert.notEqual(again.pendency!.id, pendency.id);
});

test("central lists open pendencies most urgent first, overdue flagged, and only for the acting organization", async () => {
  const w = await world();
  const { pendency } = await openPendency(w);
  const list = await w.app.listPendencies(w.nurseCtx);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, pendency.id);
  assert.equal(list[0].overdue, false);
  assert.equal((await w.app.listPendencies(w.nurseCtx, { queue: "other" })).length, 0);
  assert.equal((await w.app.listPendencies(w.ctx(w.nurse.id, w.orgA2.id))).length, 0, "another organization of the same tenant sees nothing");
  const lateClock = new FixedClock("2026-11-30T12:00:00.000Z");
  const lateApp = new ProgramApplication({ ids: new SequenceIdGenerator("late"), clock: lateClock, authorization: w.policy, audit: w.audit, events: w.events, unitOfWork: new InMemoryUnitOfWork([]), entitlements: new UnlimitedEntitlementsForTestsOnly(), ...w.prog, subjects: w.core.subjects, users: w.core.users });
  assert.equal((await lateApp.listPendencies(w.nurseCtx))[0].overdue, true);
});

test("isolation: other tenants and other organizations cannot read, act on, enroll into or reference foreign data", async () => {
  const w = await world();
  const { enrollment, pendency } = await openPendency(w);
  const otherTenant = w.ctx(w.foreignUser.id, w.orgB.id, w.tenantB.id);
  const otherOrg = w.ctx(w.nurse.id, w.orgA2.id);
  for (const c of [otherTenant, otherOrg]) {
    await assert.rejects(() => w.app.actOnPendency(c, { pendencyId: pendency.id, action: "close", reason: "attack" }), NotFoundError);
    await assert.rejects(() => w.app.evaluateContinuity(c, enrollment.id), NotFoundError);
    await assert.rejects(() => w.app.recordFact(c, { enrollmentId: enrollment.id, kind: "appointment.attended", occurredAt: daysAgo(1), source: "x" }), NotFoundError);
    await assert.rejects(() => w.app.enroll(c, { subjectId: w.subject.id, programKey: "diabetes" }), NotFoundError);
  }
  await assert.rejects(() => w.app.actOnPendency(w.nurseCtx, { pendencyId: pendency.id, action: "assign", assigneeUserId: w.foreignUser.id }), NotFoundError, "assignee must belong to the tenant");
  const stored = await w.prog.pendencies.getInTenant(w.tenantA.id, pendency.id);
  assert.equal(stored?.state, "open", "attacks left the pendency untouched");
  assert.ok(w.audit.snapshot().some(e => e.result === "failure" && e.metadata?.reason === "outside-organization"), "cross-organization attempts are audited");
});

test("authorization is enforced and audited on every program operation; contexts without an organization are refused", async () => {
  const w = await world();
  await diabetes(w);
  w.policy.denied.add("program.enroll");
  await assert.rejects(() => w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" }), AuthorizationError);
  assert.ok(w.audit.snapshot().some(e => e.action === "program.enroll.denied" && e.result === "failure"));
  w.policy.denied.clear();
  await assert.rejects(() => w.app.listPendencies(tenantContext({ tenantId: w.tenantA.id })));
  await assert.rejects(() => w.app.listPendencies(platformContext({ actorUserId: "root" })));
});

test("atomicity: if audit fails when the pendency is created, nothing about it persists", async () => {
  const w = await world({ failAuditOn: a => a === "pendency.created" });
  await diabetes(w);
  const e = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(20), source: "a" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(10), source: "a" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "demand.opened", occurredAt: daysAgo(3), reference: "d1", source: "p" });
  const eventsBefore = w.events.snapshot().length;
  await assert.rejects(() => w.app.evaluateContinuity(w.nurseCtx, e.id), /audit down/);
  assert.equal((await w.prog.pendencies.listInTenant(w.tenantA.id)).length, 0);
  assert.equal(w.events.snapshot().length, eventsBefore);
});

test("concurrent evaluations never duplicate the pendency", async () => {
  const w = await world();
  await diabetes(w);
  const e = await w.app.enroll(w.nurseCtx, { subjectId: w.subject.id, programKey: "diabetes" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(20), source: "a" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: daysAgo(10), source: "a" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "demand.opened", occurredAt: daysAgo(3), reference: "d1", source: "p" });
  await Promise.all(Array.from({ length: 10 }, () => w.app.evaluateContinuity(w.nurseCtx, e.id)));
  assert.equal((await w.prog.pendencies.listInTenant(w.tenantA.id)).length, 1);
});
