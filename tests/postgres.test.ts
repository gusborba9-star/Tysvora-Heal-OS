// Runs only when TYSVORA_TEST_DATABASE_URL points at a migrated Postgres (CI starts one; locally see docs/core/POSTGRES.md).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {
  HealCoreApplication, ProgramApplication, platformContext, tenantContext, RandomIdGenerator, SystemClock, InMemoryIdentityProvider,
  PostgresDatabase, PostgresUnitOfWork, PgTenantsRepository, PgOrganizationRepository, PgUnitRepository, PgUserRepository, PgProfessionalRepository,
  PgSubjectRepository, PgRoleRepository, PgUserRoleRepository, PgAuditSink, PgEventPublisher, PgProgramDefinitionRepository, PgProgramEnrollmentRepository,
  PgProgramFactRepository, PgPendencyRepository, PgEntitlementSource, PgUsageMeter, RbacAuthorizationService, EntitlementService, EntitlementError, UsageService,
  PlanDefinition, EventPublisher, ContinuityRule, ContinuityPolicy
} from "../src/index.js";

const URL = process.env.TYSVORA_TEST_DATABASE_URL;
const skip = URL ? false : "TYSVORA_TEST_DATABASE_URL not set";
// The application connects as the restricted role; row level security applies to it exactly as in production.
const pool = new pg.Pool({ connectionString: URL, max: 12, options: "-c role=tysvora_app" });
after(async () => { await pool.end(); });

const RULES: ContinuityRule[] = [{ id: "missed", signal: "missed-appointments", threshold: 1, windowDays: 30 }];
const CONTINUITY: ContinuityPolicy = { minSignals: 1, pendency: { priority: "high", slaHours: 24, queue: "care" } };
const PLAN: PlanDefinition = { id: "pg-test-plan", limits: { organizations: 3, subjects: 50, enrollments: 50 }, quotas: { "whatsapp.messages": 10 }, features: ["program-engine", "sentinela"] };

function build(opts: { events?: (real: PgEventPublisher) => EventPublisher } = {}) {
  const db = new PostgresDatabase(pool);
  const repos = {
    tenants: new PgTenantsRepository(db), organizations: new PgOrganizationRepository(db), units: new PgUnitRepository(db), users: new PgUserRepository(db),
    professionals: new PgProfessionalRepository(db), subjects: new PgSubjectRepository(db), roles: new PgRoleRepository(db), userRoles: new PgUserRoleRepository(db)
  };
  const prog = { definitions: new PgProgramDefinitionRepository(db), enrollments: new PgProgramEnrollmentRepository(db), facts: new PgProgramFactRepository(db), pendencies: new PgPendencyRepository(db) };
  const audit = new PgAuditSink(db), realEvents = new PgEventPublisher(db), meter = new PgUsageMeter(db), source = new PgEntitlementSource(db);
  const unitOfWork = new PostgresUnitOfWork(db), clock = new SystemClock(), entitlements = new EntitlementService(source);
  const authorization = new RbacAuthorizationService({ roles: repos.roles, userRoles: repos.userRoles, platformOperators: new Set(["root"]) });
  const identities = new InMemoryIdentityProvider();
  const events = opts.events ? opts.events(realEvents) : realEvents;
  const base = { ids: new RandomIdGenerator(), clock, authorization, audit, events, unitOfWork, entitlements };
  return {
    db, repos, prog, audit, realEvents, meter, source, identities,
    core: new HealCoreApplication({ ...base, identities, ...repos }),
    programs: new ProgramApplication({ ...base, ...prog, subjects: repos.subjects, users: repos.users }),
    usage: new UsageService({ entitlements, meter, unitOfWork, clock })
  };
}
type W = ReturnType<typeof build>;
let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

async function tenantWithAdmin(w: W, name: string, plan = PLAN) {
  await w.source.definePlan(plan);
  const root = platformContext({ actorUserId: "root" });
  const tenant = await w.core.createTenant(root, { name });
  await w.source.assignPlan(tenant.id, plan.id);
  const identityId = uid("idn"); w.identities.register({ id: identityId, subject: identityId });
  const rootIn = tenantContext({ tenantId: tenant.id, actorUserId: "root" });
  const admin = await w.core.createUser(rootIn, { tenantId: tenant.id, identityId, displayName: name + " admin" });
  const role = await w.core.createRole(root, { name: uid("Tenant admin"), architecturalRole: "tenant-admin" });
  await w.core.assignRole(rootIn, { userId: admin.id, roleId: role.id, scope: { level: "tenant", tenantId: tenant.id } });
  return { tenant, admin, ctx: tenantContext({ tenantId: tenant.id, actorUserId: admin.id }) };
}
const count = async (w: W, table: string, tenantId: string) => (await w.db.withScope({ tenantId }, q => q.query<{ n: string }>(`select count(*)::text n from heal.${table} where tenant_id = $1`, [tenantId]))).rows[0]!.n;

test("postgres: full care flow persists and is consistent (state, audit, events)", { skip }, async () => {
  const w = build();
  const t = await tenantWithAdmin(w, "Clinica");
  const org = await w.core.createOrganization(t.ctx, { tenantId: t.tenant.id, name: "UBS" });
  const octx = tenantContext({ tenantId: t.tenant.id, organizationId: org.id, actorUserId: t.admin.id });
  const author = t.admin;
  const idn = uid("idn"); w.identities.register({ id: idn, subject: idn });
  const approver = await w.core.createUser(t.ctx, { tenantId: t.tenant.id, identityId: idn, displayName: "Approver" });
  const role = await w.core.createRole(t.ctx, { name: uid("Admin2"), architecturalRole: "tenant-admin" });
  await w.core.assignRole(t.ctx, { userId: approver.id, roleId: role.id, scope: { level: "tenant", tenantId: t.tenant.id } });
  const subject = await w.core.createSubject(octx, { tenantId: t.tenant.id, organizationId: org.id, displayName: "Maria" });
  const draft = await w.programs.createProgram(octx, { key: "diabetes", name: "Diabetes", rules: RULES, continuity: CONTINUITY });
  const approved = await w.programs.approveProgram(tenantContext({ tenantId: t.tenant.id, organizationId: org.id, actorUserId: approver.id }), draft.id);
  assert.equal(approved.status, "approved");
  const enrollment = await w.programs.enroll(octx, { subjectId: subject.id, programKey: "diabetes" });
  await w.programs.recordFact(octx, { enrollmentId: enrollment.id, kind: "appointment.missed", occurredAt: new Date(Date.now() - 86400_000).toISOString(), source: "test" });
  // The fact itself triggered Sentinela: the pendency already exists, so explicit evaluations only find it.
  const first = await w.programs.evaluateContinuity(octx, enrollment.id);
  assert.equal(first.created, false);
  assert.equal((await w.programs.listPendencies(octx)).length, 1);
  // Evaluating concurrently never duplicates the pendency (application check inside the tenant lock + partial unique index).
  const rest = await Promise.all(Array.from({ length: 8 }, () => w.programs.evaluateContinuity(octx, enrollment.id)));
  assert.ok(rest.every(r => r.created === false));
  assert.equal((await w.programs.listPendencies(octx)).length, 1);
  assert.equal(author.tenantId, t.tenant.id);
  // Every successful write left exactly one audit entry and one outbox event.
  const audits = (await w.audit.list(t.tenant.id)).filter(a => a.result === "success");
  const events = await w.realEvents.listForTenant(t.tenant.id);
  assert.equal(events.length, audits.length, "one event per audited write");
  assert.ok(events.every(e => e.tenantId === t.tenant.id));
});

test("postgres: the unit of work is atomic, a failing event publish leaves no state and no audit", { skip }, async () => {
  const w = build({ events: real => ({ async publish(e) { if (e.eventType === "organization.created") throw new Error("broker down"); await real.publish(e); } }) });
  const t = await tenantWithAdmin(w, "Atomic");
  await assert.rejects(() => w.core.createOrganization(t.ctx, { tenantId: t.tenant.id, name: "Ghost" }), /broker down/);
  assert.equal(await count(w, "organizations", t.tenant.id), "0");
  assert.ok(!(await w.audit.list(t.tenant.id)).some(a => a.action === "organization.created"));
});

test("postgres: plan limits are race-free across concurrent connections", { skip }, async () => {
  const w = build();
  const t = await tenantWithAdmin(w, "Limits");
  const results = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => w.core.createOrganization(t.ctx, { tenantId: t.tenant.id, name: "Org " + i })));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 3);
  assert.ok(results.filter(r => r.status === "rejected").every((r: any) => r.reason instanceof EntitlementError && r.reason.code === "limit-reached"));
  assert.equal(await count(w, "organizations", t.tenant.id), "3");
});

test("postgres: quotas never overshoot under concurrency and are isolated per tenant", { skip }, async () => {
  const w = build();
  const a = await tenantWithAdmin(w, "QA"), b = await tenantWithAdmin(w, "QB");
  const results = await Promise.allSettled(Array.from({ length: 25 }, () => w.usage.consume(a.tenant.id, "whatsapp.messages", 1)));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 10);
  assert.deepEqual(await w.usage.usage(a.tenant.id, "whatsapp.messages"), { used: 10, quota: 10 });
  assert.deepEqual(await w.usage.usage(b.tenant.id, "whatsapp.messages"), { used: 0, quota: 10 });
});

test("postgres: a tenant without a plan fails closed", { skip }, async () => {
  const w = build();
  const root = platformContext({ actorUserId: "root" });
  const tenant = await w.core.createTenant(root, { name: "Planless" });
  await assert.rejects(() => w.core.createOrganization(tenantContext({ tenantId: tenant.id, actorUserId: "root" }), { tenantId: tenant.id, name: "O" }), (e: any) => e instanceof EntitlementError && e.code === "no-plan");
});

// ---------- Isolation enforced by the database itself (queries below deliberately have NO tenant filter) ----------

test("RLS: an unfiltered query only ever sees the current tenant's rows", { skip }, async () => {
  const w = build();
  const a = await tenantWithAdmin(w, "RA"), b = await tenantWithAdmin(w, "RB");
  await w.core.createOrganization(a.ctx, { tenantId: a.tenant.id, name: "A-org" });
  await w.core.createOrganization(b.ctx, { tenantId: b.tenant.id, name: "B-org" });
  for (const table of ["organizations", "users", "audit_log", "domain_events", "user_roles"]) {
    const rows = await w.db.withScope({ tenantId: a.tenant.id }, q => q.query<{ tenant_id: string | null }>(`select tenant_id from heal.${table}`));
    assert.ok(rows.rows.length > 0, table);
    assert.ok(rows.rows.every(r => r.tenant_id === a.tenant.id), `${table} leaked rows of another tenant`);
  }
  const tenants = await w.db.withScope({ tenantId: a.tenant.id }, q => q.query<{ id: string }>("select id from heal.tenants"));
  assert.deepEqual(tenants.rows.map(r => r.id), [a.tenant.id]);
});

test("RLS: with no tenant scope at all the application role sees and writes nothing", { skip }, async () => {
  const w = build();
  const a = await tenantWithAdmin(w, "RN");
  await w.core.createOrganization(a.ctx, { tenantId: a.tenant.id, name: "x" });
  for (const table of ["tenants", "organizations", "users", "subjects", "audit_log", "domain_events", "roles", "user_roles", "program_definitions", "pendencies", "usage_ledger", "tenant_entitlements"]) {
    const r = await pool.query(`select tenant_id from heal.${table}`.replace("tenant_id", table === "tenants" ? "id as tenant_id" : "tenant_id"));
    // roles may expose platform catalog rows (tenant_id null) by design, never a tenant's own roles
    if (table === "roles") assert.ok(r.rows.every((row: any) => row.tenant_id == null), "roles"); else assert.equal(r.rows.length, 0, table);
  }
  await assert.rejects(() => pool.query("insert into heal.organizations (id, tenant_id, name) values ('x', $1, 'n')", [a.tenant.id]), /row-level security/);
});

test("RLS: writing or overwriting another tenant's data is rejected, nothing changes", { skip }, async () => {
  const w = build();
  const a = await tenantWithAdmin(w, "WA"), b = await tenantWithAdmin(w, "WB");
  const orgB = await w.core.createOrganization(b.ctx, { tenantId: b.tenant.id, name: "B-original" });
  // Insert into B while scoped to A.
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("insert into heal.organizations (id, tenant_id, name) values ($1, $2, 'evil')", [uid("o"), b.tenant.id])), /row-level security/);
  // Update B's row from A's scope: invisible, zero rows touched.
  const upd = await w.db.withScope({ tenantId: a.tenant.id }, q => q.query("update heal.organizations set name = 'pwned' where id = $1", [orgB.id]));
  assert.equal(upd.rowCount, 0);
  // Upsert with B's id claiming tenant A: must be rejected, not silently take over the row.
  await assert.rejects(() => w.repos.organizations.save({ id: orgB.id, tenantId: a.tenant.id, name: "takeover" }));
  assert.equal((await w.repos.organizations.getInTenant(b.tenant.id, orgB.id))?.name, "B-original");
  assert.equal(await w.repos.organizations.getInTenant(a.tenant.id, orgB.id), null);
  // Deleting is not even granted.
  await assert.rejects(() => w.db.withScope({ tenantId: b.tenant.id }, q => q.query("delete from heal.organizations where id = $1", [orgB.id])), /permission denied/);
});

test("RLS: composite foreign keys make cross-tenant references impossible", { skip }, async () => {
  const w = build();
  const a = await tenantWithAdmin(w, "FA"), b = await tenantWithAdmin(w, "FB");
  const orgB = await w.core.createOrganization(b.ctx, { tenantId: b.tenant.id, name: "B" });
  await assert.rejects(() => w.repos.subjects.save({ id: uid("s"), tenantId: a.tenant.id, organizationId: orgB.id, displayName: "cross" }), /foreign key|violates/);
});

test("RLS: audit log and event history are append-only; platform data needs platform mode", { skip }, async () => {
  const w = build();
  const a = await tenantWithAdmin(w, "AP");
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("update heal.audit_log set action = 'forged' where tenant_id = $1", [a.tenant.id])), /permission denied|append-only/);
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("delete from heal.audit_log where tenant_id = $1", [a.tenant.id])), /permission denied|append-only/);
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("delete from heal.domain_events where tenant_id = $1", [a.tenant.id])), /permission denied|append-only/);
  // A tenant cannot change its own plan or define plans, nor create platform-catalog roles.
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("update heal.tenant_entitlements set plan_id = null where tenant_id = $1", [a.tenant.id])).then(r => { if (r.rowCount === 0) throw new Error("row-level security: not updatable"); }), /row-level security|not updatable/);
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("insert into heal.plans (id, doc) values ('hacked', '{}')")), /row-level security/);
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("insert into heal.roles (id, tenant_id, name) values ($1, null, 'catalog')", [uid("r")])), /row-level security/);
  await assert.rejects(() => w.db.withScope({ tenantId: a.tenant.id }, q => q.query("insert into heal.user_roles (user_id, role_id, scope_level, scope_key) values ('u', 'r', 'platform', 'k')")), /row-level security|violates/);
});

test("postgres: audit rows for refusals persist even though the operation rolls back", { skip }, async () => {
  const w = build();
  const a = await tenantWithAdmin(w, "RF");
  const stranger = tenantContext({ tenantId: a.tenant.id, actorUserId: "stranger" });
  await assert.rejects(() => w.core.createOrganization(stranger, { tenantId: a.tenant.id, name: "no" }));
  assert.ok((await w.audit.list(a.tenant.id)).some(e => e.action === "organization.create.denied" && e.result === "failure"));
  assert.equal(await count(w, "organizations", a.tenant.id), "0");
});
