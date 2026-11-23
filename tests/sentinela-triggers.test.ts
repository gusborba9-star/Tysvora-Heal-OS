import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HealCoreApplication, ProgramApplication, platformContext, tenantContext, SequenceIdGenerator, MutableClock,
  InMemoryAuditSink, InMemoryEventPublisher, InMemoryRepository, InMemoryUserRoleRepository, InMemoryIdentityProvider, InMemoryUnitOfWork,
  AuthorizationService, AuthorizationRequest, AuthorizationError, EntitlementService, EntitlementSource, PlanDefinition, TenantOverrides, ContinuityRule, ContinuityPolicy
} from "../src/index.js";

const START = "2026-11-23T12:00:00.000Z";
const day = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86400_000).toISOString();
const RULES: ContinuityRule[] = [
  { id: "missed", signal: "missed-appointments", threshold: 1, windowDays: 90 },
  { id: "exam", signal: "overdue-exam", graceDays: 1, windowDays: 365 }
];
const POLICY: ContinuityPolicy = { minSignals: 1, pendency: { priority: "high", slaHours: 24, queue: "care" } };

class Policy implements AuthorizationService {
  denied = new Set<string>();
  async can(r: AuthorizationRequest) { return !this.denied.has(r.action); }
}
class Plans implements EntitlementSource {
  plan: PlanDefinition | null = { id: "p", limits: {}, quotas: {}, features: ["program-engine", "sentinela"] };
  async planFor() { return this.plan; }
  async overridesFor(): Promise<TenantOverrides> { return {}; }
}

async function world() {
  const clock = new MutableClock(START), policy = new Policy(), plans = new Plans();
  const core = { tenants: new InMemoryRepository<any>(), organizations: new InMemoryRepository<any>(), units: new InMemoryRepository<any>(), users: new InMemoryRepository<any>(), professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(), roles: new InMemoryRepository<any>(), userRoles: new InMemoryUserRoleRepository() };
  const prog = { definitions: new InMemoryRepository<any>(), enrollments: new InMemoryRepository<any>(), facts: new InMemoryRepository<any>(), pendencies: new InMemoryRepository<any>() };
  const audit = new InMemoryAuditSink(), events = new InMemoryEventPublisher(), identities = new InMemoryIdentityProvider();
  for (const i of ["i1", "i2", "i3"]) identities.register({ id: i, subject: i });
  const unitOfWork = new InMemoryUnitOfWork([audit, events, ...Object.values(core), ...Object.values(prog)]);
  const base = { ids: new SequenceIdGenerator("s"), clock, authorization: policy, audit, events, unitOfWork, entitlements: new EntitlementService(plans) };
  const coreApp = new HealCoreApplication({ ...base, identities, ...core });
  const app = new ProgramApplication({ ...base, ...prog, subjects: core.subjects, users: core.users });
  const tenant = await coreApp.createTenant(platformContext({ actorUserId: "root" }), { name: "T" });
  const admin = tenantContext({ tenantId: tenant.id });
  const org = await coreApp.createOrganization(admin, { tenantId: tenant.id, name: "Org" });
  const other = await coreApp.createOrganization(admin, { tenantId: tenant.id, name: "Other org" });
  const author = await coreApp.createUser(admin, { tenantId: tenant.id, identityId: "i1", displayName: "Author" });
  const approver = await coreApp.createUser(admin, { tenantId: tenant.id, identityId: "i2", displayName: "Approver" });
  const nurse = await coreApp.createUser(admin, { tenantId: tenant.id, identityId: "i3", displayName: "Nurse" });
  const ctx = (userId: string, orgId = org.id) => tenantContext({ tenantId: tenant.id, organizationId: orgId, actorUserId: userId });
  const nurseCtx = ctx(nurse.id);
  const draft = await app.createProgram(ctx(author.id), { key: "dm", name: "DM", rules: RULES, continuity: POLICY });
  await app.approveProgram(ctx(approver.id), draft.id);
  const mkSubject = (name: string) => coreApp.createSubject(nurseCtx, { tenantId: tenant.id, organizationId: org.id, displayName: name });
  return { app, clock, policy, plans, audit, prog, tenant, org, other, nurseCtx, ctx, author, mkSubject, coreApp };
}

test("a recorded fact re-evaluates its enrollment: the pendency opens without anyone asking", async () => {
  const w = await world();
  const e = await w.app.enroll(w.nurseCtx, { subjectId: (await w.mkSubject("Ana")).id, programKey: "dm" });
  assert.equal((await w.app.listPendencies(w.nurseCtx)).length, 0);
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.attended", occurredAt: day(START, -5), source: "agenda" });
  assert.equal((await w.app.listPendencies(w.nurseCtx)).length, 0, "no signal, no pendency");
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: day(START, -1), source: "agenda" });
  const open = await w.app.listPendencies(w.nurseCtx);
  assert.equal(open.length, 1);
  assert.equal(open[0]!.origin.source, "sentinela");
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: day(START, -1), source: "agenda" });
  assert.equal((await w.app.listPendencies(w.nurseCtx)).length, 1, "more facts never duplicate the open pendency");
});

test("recording a fact never fails, never duplicates and never leaks denials when evaluation is unavailable", async () => {
  const w = await world();
  const e = await w.app.enroll(w.nurseCtx, { subjectId: (await w.mkSubject("Bia")).id, programKey: "dm" });
  const before = w.audit.snapshot().filter(a => a.action.endsWith(".denied")).length;
  w.plans.plan = { id: "p", limits: {}, quotas: {}, features: ["program-engine"] }; // sentinela off for the plan
  const fact = await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: day(START, -1), source: "agenda" });
  assert.ok(fact.id);
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).length, 1);
  assert.equal((await w.prog.pendencies.listInTenant(w.tenant.id)).length, 0);
  assert.equal(w.audit.snapshot().filter(a => a.action.endsWith(".denied")).length, before, "trigger is internal: no denied-action noise");
  w.plans.plan = null; // no plan at all: the evaluation fails closed, the fact still stands
  assert.ok(await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: day(START, -1), source: "agenda" }));
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).length, 2);
});

test("a professional who may record facts but not evaluate still triggers the evaluation", async () => {
  const w = await world();
  const e = await w.app.enroll(w.nurseCtx, { subjectId: (await w.mkSubject("Caio")).id, programKey: "dm" });
  w.policy.denied.add("sentinela.evaluate");
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "appointment.missed", occurredAt: day(START, -1), source: "agenda" });
  assert.equal((await w.prog.pendencies.listInTenant(w.tenant.id)).length, 1);
  await assert.rejects(() => w.app.evaluateContinuity(w.nurseCtx, e.id), AuthorizationError, "the explicit entry point still requires the permission");
});

test("the daily sweep catches what only time reveals: an exam that becomes overdue with no new fact", async () => {
  const w = await world();
  const e = await w.app.enroll(w.nurseCtx, { subjectId: (await w.mkSubject("Dora")).id, programKey: "dm" });
  await w.app.recordFact(w.nurseCtx, { enrollmentId: e.id, kind: "exam.due", occurredAt: day(START, -10), dueAt: day(START, 5), reference: "hba1c", source: "plan" });
  assert.equal((await w.app.listPendencies(w.nurseCtx)).length, 0, "not overdue yet");
  w.clock.advanceDays(10); // due date + grace passed, nothing was recorded
  const first = await w.app.sweepContinuity(w.nurseCtx);
  assert.deepEqual(first, { evaluated: 1, created: 1, failed: 0, remaining: 0 });
  assert.equal((await w.app.listPendencies(w.nurseCtx)).length, 1);
  const second = await w.app.sweepContinuity(w.nurseCtx);
  assert.deepEqual(second, { evaluated: 1, created: 0, failed: 0, remaining: 0 }, "idempotent");
});

test("the sweep is scoped, bounded, isolated per enrollment, gated by permission and plan", async () => {
  const w = await world();
  const mk = async (n: string) => { const s = await w.mkSubject(n); return w.app.enroll(w.nurseCtx, { subjectId: s.id, programKey: "dm" }); };
  const [a, b, c] = [await mk("A"), await mk("B"), await mk("C")];
  for (const x of [a, b, c]) await w.app.recordFact(w.nurseCtx, { enrollmentId: x.id, kind: "exam.due", occurredAt: day(START, -10), dueAt: day(START, 5), reference: "x", source: "plan" });
  w.clock.advanceDays(10);
  const limited = await w.app.sweepContinuity(w.nurseCtx, { maxEnrollments: 2 });
  assert.deepEqual(limited, { evaluated: 2, created: 2, failed: 0, remaining: 1 }, "bounded per run");
  // One enrollment whose program definition vanished fails alone.
  const broken = (await w.prog.enrollments.getById(c.id))!;
  await w.prog.enrollments.save({ ...broken, definitionId: "gone" });
  const rest = await w.app.sweepContinuity(w.nurseCtx);
  assert.equal(rest.failed, 1);
  assert.equal(rest.evaluated, 2);
  // Another organization of the same tenant is untouched by this organization's sweep.
  assert.deepEqual(await w.app.sweepContinuity(w.ctx(w.author.id, w.other.id)), { evaluated: 0, created: 0, failed: 0, remaining: 0 });
  w.policy.denied.add("sentinela.evaluate");
  await assert.rejects(() => w.app.sweepContinuity(w.nurseCtx), AuthorizationError);
  w.policy.denied.clear(); w.plans.plan = { id: "p", limits: {}, quotas: {}, features: ["program-engine"] };
  await assert.rejects(() => w.app.sweepContinuity(w.nurseCtx), /feature/i);
});
