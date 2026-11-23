import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HealCoreApplication, ProgramApplication, platformContext, tenantContext, SequenceIdGenerator, FixedClock,
  InMemoryAuditSink, InMemoryEventPublisher, InMemoryRepository, InMemoryUserRoleRepository, InMemoryIdentityProvider,
  InMemoryUnitOfWork, InMemoryUsageMeter, RbacAuthorizationService, EntitlementService, EntitlementError, UsageService,
  AuthorizationError, DomainInvariantError, NotFoundError, ApplicationContext, EntitlementSource, PlanDefinition, TenantOverrides,
  ContinuityRule, ContinuityPolicy, DEFAULT_ROLE_PERMISSIONS, ALL_ACTIONS
} from "../src/index.js";

const RULES: ContinuityRule[] = [{ id: "r1", signal: "missed-appointments", threshold: 1, windowDays: 30 }];
const CONTINUITY: ContinuityPolicy = { minSignals: 1, pendency: { priority: "normal", slaHours: 24, queue: "q" } };

class Plans implements EntitlementSource {
  plans = new Map<string, PlanDefinition>();
  overrides = new Map<string, TenantOverrides>();
  async planFor(t: string) { return this.plans.get(t) ?? null; }
  async overridesFor(t: string) { return this.overrides.get(t) ?? {}; }
}

async function world(nowIso = "2026-11-23T12:00:00.000Z") {
  const repos = {
    tenants: new InMemoryRepository<any>(), organizations: new InMemoryRepository<any>(), units: new InMemoryRepository<any>(),
    users: new InMemoryRepository<any>(), professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(),
    roles: new InMemoryRepository<any>(), userRoles: new InMemoryUserRoleRepository()
  };
  const prog = { definitions: new InMemoryRepository<any>(), enrollments: new InMemoryRepository<any>(), facts: new InMemoryRepository<any>(), pendencies: new InMemoryRepository<any>() };
  const audit = new InMemoryAuditSink(), events = new InMemoryEventPublisher(), meter = new InMemoryUsageMeter();
  const identities = new InMemoryIdentityProvider();
  for (const i of ["i1", "i2", "i3", "i4", "i5"]) identities.register({ id: i, subject: "s" + i });
  const plans = new Plans();
  const entitlements = new EntitlementService(plans);
  const clock = new FixedClock(nowIso);
  const unitOfWork = new InMemoryUnitOfWork([audit, events, meter, ...Object.values(repos), ...Object.values(prog)]);
  const authorization = new RbacAuthorizationService({ roles: repos.roles, userRoles: repos.userRoles, platformOperators: new Set(["root"]) });
  const base = { ids: new SequenceIdGenerator("r"), clock, authorization, audit, events, unitOfWork, entitlements };
  const core = new HealCoreApplication({ ...base, identities, ...repos });
  const programs = new ProgramApplication({ ...base, ...prog, subjects: repos.subjects, users: repos.users });
  const usage = new UsageService({ entitlements, meter, unitOfWork, clock });
  return { core, programs, usage, repos, prog, audit, plans, meter };
}

const PRO_PLAN: PlanDefinition = { id: "test-plan", limits: { organizations: 5, subjects: 5, enrollments: 5 }, quotas: { "whatsapp.messages": 10 }, features: ["program-engine", "sentinela"] };

/** Bootstraps a tenant the way production would: operator creates the tenant and its first admin; the admin does the rest. */
async function tenantWithAdmin(w: Awaited<ReturnType<typeof world>>, name: string, identityId: string, plan = PRO_PLAN) {
  const root = platformContext({ actorUserId: "root" });
  const tenant = await w.core.createTenant(root, { name });
  w.plans.plans.set(tenant.id, plan);
  const rootInTenant = tenantContext({ tenantId: tenant.id, actorUserId: "root" });
  const admin = await w.core.createUser(rootInTenant, { tenantId: tenant.id, identityId, displayName: name + " admin" });
  const catalogAdminRole = (await roleByArch(w, "tenant-admin")) ?? await w.core.createRole(root, { name: "Tenant admin", architecturalRole: "tenant-admin" });
  await w.core.assignRole(rootInTenant, { userId: admin.id, roleId: catalogAdminRole.id, scope: { level: "tenant", tenantId: tenant.id } });
  return { tenant, admin, adminCtx: tenantContext({ tenantId: tenant.id, actorUserId: admin.id }), catalogAdminRole };
}
async function roleByArch(w: Awaited<ReturnType<typeof world>>, arch: string) {
  for (const r of [...(w.repos.roles.captureState() as Map<string, any>).values()]) if (r.architecturalRole === arch && !r.tenantId) return r;
  return null;
}

test("RBAC: deny by default for unknown actors, missing actors and unknown actions", async () => {
  const w = await world();
  const root = platformContext({ actorUserId: "root" });
  const tenant = await w.core.createTenant(root, { name: "T" });
  await assert.rejects(() => w.core.createTenant(platformContext({ actorUserId: "stranger" }), { name: "X" }), AuthorizationError);
  await assert.rejects(() => w.core.createTenant(platformContext(), { name: "X" }), AuthorizationError);
  await assert.rejects(() => w.core.createOrganization(tenantContext({ tenantId: tenant.id, actorUserId: "stranger" }), { tenantId: tenant.id, name: "O" }), AuthorizationError);
  const rbac = new RbacAuthorizationService({ roles: w.repos.roles, userRoles: w.repos.userRoles });
  assert.equal(await rbac.can({ actorUserId: "root", action: "tenant.create", resource: "tenant", context: root }), false, "operators exist only when configured");
});

test("RBAC: break-glass operators are limited to provisioning in tenant contexts", async () => {
  const w = await world();
  const { tenant } = await tenantWithAdmin(w, "T", "i1");
  const rootInTenant = tenantContext({ tenantId: tenant.id, actorUserId: "root" });
  await assert.rejects(() => w.core.createSubject(tenantContext({ tenantId: tenant.id, organizationId: "x", actorUserId: "root" }), { tenantId: tenant.id, organizationId: "x", displayName: "N" }), AuthorizationError);
  await assert.rejects(() => w.programs.listPendencies(tenantContext({ tenantId: tenant.id, organizationId: "x", actorUserId: "root" })), AuthorizationError);
  assert.ok(await w.core.createOrganization(rootInTenant, { tenantId: tenant.id, name: "Org" }));
});

test("RBAC: a tenant admin acts only inside its own tenant", async () => {
  const w = await world();
  const a = await tenantWithAdmin(w, "A", "i1");
  const b = await tenantWithAdmin(w, "B", "i2");
  assert.ok(await w.core.createOrganization(a.adminCtx, { tenantId: a.tenant.id, name: "Org A" }));
  // Using admin A's identity inside tenant B's context grants nothing.
  const crossCtx = tenantContext({ tenantId: b.tenant.id, actorUserId: a.admin.id });
  await assert.rejects(() => w.core.createOrganization(crossCtx, { tenantId: b.tenant.id, name: "Hijack" }), AuthorizationError);
  assert.ok(w.audit.snapshot().some(e => e.result === "failure" && e.actorId === a.admin.id && e.tenantId === b.tenant.id));
});

test("RBAC: scope coverage for organization- and unit-level roles", async () => {
  const w = await world();
  const t = await tenantWithAdmin(w, "A", "i1");
  const org1 = await w.core.createOrganization(t.adminCtx, { tenantId: t.tenant.id, name: "Org 1" });
  const org2 = await w.core.createOrganization(t.adminCtx, { tenantId: t.tenant.id, name: "Org 2" });
  const orgCtx = (id: string, orgId: string) => tenantContext({ tenantId: t.tenant.id, organizationId: orgId, actorUserId: id });
  const unit = await w.core.createUnit(orgCtx(t.admin.id, org1.id), { tenantId: t.tenant.id, organizationId: org1.id, name: "U1" });
  const prof = await w.core.createUser(t.adminCtx, { tenantId: t.tenant.id, identityId: "i3", displayName: "Prof" });
  const profRole = await w.core.createRole(t.adminCtx, { name: "Staff", architecturalRole: "professional" });
  await w.core.assignRole(t.adminCtx, { userId: prof.id, roleId: profRole.id, scope: { level: "organization", tenantId: t.tenant.id, organizationId: org1.id } });
  assert.ok(await w.core.createSubject(orgCtx(prof.id, org1.id), { tenantId: t.tenant.id, organizationId: org1.id, displayName: "Patient" }));
  await assert.rejects(() => w.core.createSubject(orgCtx(prof.id, org2.id), { tenantId: t.tenant.id, organizationId: org2.id, displayName: "Patient 2" }), AuthorizationError, "other organization");
  await assert.rejects(() => w.core.createOrganization(t.adminCtx.scope === "tenant" ? tenantContext({ tenantId: t.tenant.id, actorUserId: prof.id }) : t.adminCtx, { tenantId: t.tenant.id, name: "Org 3" }), AuthorizationError, "professionals cannot create organizations");

  const unitPro = await w.core.createUser(t.adminCtx, { tenantId: t.tenant.id, identityId: "i4", displayName: "Unit pro" });
  await w.core.assignRole(orgCtx(t.admin.id, org1.id), { userId: unitPro.id, roleId: profRole.id, scope: { level: "unit", tenantId: t.tenant.id, organizationId: org1.id, unitId: unit.id } });
  const inUnit = tenantContext({ tenantId: t.tenant.id, organizationId: org1.id, unitId: unit.id, actorUserId: unitPro.id });
  assert.ok(await w.core.createSubject(inUnit, { tenantId: t.tenant.id, organizationId: org1.id, displayName: "Unit patient" }));
  await assert.rejects(() => w.core.createSubject(orgCtx(unitPro.id, org1.id), { tenantId: t.tenant.id, organizationId: org1.id, displayName: "Org-wide attempt" }), AuthorizationError, "unit role does not cover the whole organization");
});

test("RBAC: no privilege escalation, a manager cannot grant roles stronger than their own", async () => {
  const w = await world();
  const t = await tenantWithAdmin(w, "A", "i1");
  const org = await w.core.createOrganization(t.adminCtx, { tenantId: t.tenant.id, name: "Org" });
  const manager = await w.core.createUser(t.adminCtx, { tenantId: t.tenant.id, identityId: "i3", displayName: "Manager" });
  const target = await w.core.createUser(t.adminCtx, { tenantId: t.tenant.id, identityId: "i4", displayName: "Target" });
  const mgrRole = await w.core.createRole(t.adminCtx, { name: "Unit manager", architecturalRole: "unit-management" });
  const profRole = await w.core.createRole(t.adminCtx, { name: "Staff", architecturalRole: "professional" });
  await w.core.assignRole(t.adminCtx, { userId: manager.id, roleId: mgrRole.id, scope: { level: "organization", tenantId: t.tenant.id, organizationId: org.id } });
  const mgrCtx = tenantContext({ tenantId: t.tenant.id, organizationId: org.id, actorUserId: manager.id });
  const scope = { level: "organization" as const, tenantId: t.tenant.id, organizationId: org.id };
  await assert.rejects(() => w.core.assignRole(mgrCtx, { userId: target.id, roleId: t.catalogAdminRole.id, scope }), AuthorizationError, "cannot hand out tenant-admin");
  assert.ok(await w.core.assignRole(mgrCtx, { userId: target.id, roleId: profRole.id, scope }), "can hand out a weaker role");
});

test("role ownership: a tenant's role is invisible to other tenants and cannot be granted platform-wide", async () => {
  const w = await world();
  const a = await tenantWithAdmin(w, "A", "i1");
  const b = await tenantWithAdmin(w, "B", "i2");
  const roleA = await w.core.createRole(a.adminCtx, { name: "A staff", architecturalRole: "professional" });
  assert.equal(roleA.tenantId, a.tenant.id);
  const userB = await w.core.createUser(b.adminCtx, { tenantId: b.tenant.id, identityId: "i3", displayName: "B user" });
  await assert.rejects(() => w.core.assignRole(b.adminCtx, { userId: userB.id, roleId: roleA.id, scope: { level: "tenant", tenantId: b.tenant.id } }), NotFoundError);
  await assert.rejects(() => w.core.assignRole(platformContext({ actorUserId: "root" }), { userId: userB.id, roleId: roleA.id, scope: { level: "platform" } }), NotFoundError);
  const catalog = await w.core.createRole(platformContext({ actorUserId: "root" }), { name: "Catalog pro", architecturalRole: "professional" });
  assert.equal(catalog.tenantId, undefined);
  assert.ok(await w.core.assignRole(b.adminCtx, { userId: userB.id, roleId: catalog.id, scope: { level: "tenant", tenantId: b.tenant.id } }));
});

test("the default permission catalog has no unknown actions and never grants platform actions below platform-admin", () => {
  const known = new Set<string>(ALL_ACTIONS);
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const p of perms) assert.ok(known.has(p), `${role}: ${p}`);
    if (role !== "platform-admin") for (const p of ["tenant.create", "role.assign.platform"]) assert.ok(!perms.includes(p as any), `${role} must not hold ${p}`);
  }
});

test("entitlements fail closed: a tenant without a plan cannot create anything billable", async () => {
  const w = await world();
  const root = platformContext({ actorUserId: "root" });
  const tenant = await w.core.createTenant(root, { name: "No plan" });
  await assert.rejects(() => w.core.createOrganization(tenantContext({ tenantId: tenant.id, actorUserId: "root" }), { tenantId: tenant.id, name: "O" }), (e: any) => e instanceof EntitlementError && e.code === "no-plan");
  assert.equal(await w.repos.organizations.countInTenant(tenant.id), 0);
});

test("plan limits are enforced and race-free; overrides raise them", async () => {
  const w = await world();
  const t = await tenantWithAdmin(w, "A", "i1");
  const results = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => w.core.createOrganization(t.adminCtx, { tenantId: t.tenant.id, name: "Org " + i })));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 5);
  assert.ok(results.filter(r => r.status === "rejected").every((r: any) => r.reason instanceof EntitlementError && r.reason.code === "limit-reached"));
  assert.equal(await w.repos.organizations.countInTenant(t.tenant.id), 5);
  w.plans.overrides.set(t.tenant.id, { limits: { organizations: 7 } });
  assert.ok(await w.core.createOrganization(t.adminCtx, { tenantId: t.tenant.id, name: "Org 6" }));
});

test("feature flags gate modules; per-tenant overrides win over the plan", async () => {
  const w = await world();
  const t = await tenantWithAdmin(w, "A", "i1", { ...PRO_PLAN, features: [] });
  const org = await w.core.createOrganization(t.adminCtx, { tenantId: t.tenant.id, name: "Org" });
  const octx = tenantContext({ tenantId: t.tenant.id, organizationId: org.id, actorUserId: t.admin.id });
  const draft = () => w.programs.createProgram(octx, { key: "p" + Math.random().toString(36).slice(2, 7), name: "P", rules: RULES, continuity: CONTINUITY });
  await assert.rejects(draft, (e: any) => e instanceof EntitlementError && e.code === "feature-disabled");
  w.plans.overrides.set(t.tenant.id, { enableFeatures: ["program-engine"] });
  assert.ok(await draft());
  w.plans.overrides.set(t.tenant.id, { enableFeatures: ["program-engine"], disableFeatures: ["program-engine"] });
  await assert.rejects(draft, EntitlementError);
});

test("usage quotas: per tenant, per month, never overshot under concurrency", async () => {
  const w = await world();
  const a = await tenantWithAdmin(w, "A", "i1");
  const b = await tenantWithAdmin(w, "B", "i2");
  const results = await Promise.allSettled(Array.from({ length: 25 }, () => w.usage.consume(a.tenant.id, "whatsapp.messages", 1)));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 10);
  assert.deepEqual(await w.usage.usage(a.tenant.id, "whatsapp.messages"), { used: 10, quota: 10 });
  assert.deepEqual(await w.usage.usage(b.tenant.id, "whatsapp.messages"), { used: 0, quota: 10 }, "other tenants are unaffected");
  await assert.rejects(() => w.usage.consume(a.tenant.id, "whatsapp.messages", 1), (e: any) => e.code === "quota-exceeded");
  for (const bad of [0, -1, 1.5, 2_000_000]) await assert.rejects(() => w.usage.consume(a.tenant.id, "whatsapp.messages", bad));
});

test("usage quotas reset each calendar month and unmetered resources are unlimited", async () => {
  const w = await world("2026-11-30T23:00:00.000Z");
  const a = await tenantWithAdmin(w, "A", "i1");
  await w.usage.consume(a.tenant.id, "whatsapp.messages", 10);
  await assert.rejects(() => w.usage.consume(a.tenant.id, "whatsapp.messages", 1), EntitlementError);
  const december = new UsageService({ entitlements: new EntitlementService(w.plans), meter: w.meter, unitOfWork: new InMemoryUnitOfWork([w.meter]), clock: new FixedClock("2026-12-01T00:30:00.000Z") });
  await december.consume(a.tenant.id, "whatsapp.messages", 10);
  await december.consume(a.tenant.id, "ai.calls", 999_999);
});

test("the sentinela feature is gated separately from the program engine", async () => {
  const w = await world();
  const t = await tenantWithAdmin(w, "A", "i1", { ...PRO_PLAN, features: ["program-engine"] });
  const org = await w.core.createOrganization(t.adminCtx, { tenantId: t.tenant.id, name: "Org" });
  const octx = tenantContext({ tenantId: t.tenant.id, organizationId: org.id, actorUserId: t.admin.id });
  await assert.rejects(() => w.programs.evaluateContinuity(octx, "any-enrollment"), (e: any) => e instanceof EntitlementError && e.code === "feature-disabled");
  w.plans.overrides.set(t.tenant.id, { enableFeatures: ["sentinela"] });
  await assert.rejects(() => w.programs.evaluateContinuity(octx, "any-enrollment"), (e: any) => !(e instanceof EntitlementError), "past the gate, it fails on the missing enrollment instead");
});
