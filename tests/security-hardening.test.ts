import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HealCoreApplication, platformContext, tenantContext, SequenceIdGenerator, FixedClock,
  InMemoryAuditSink, InMemoryEventPublisher, InMemoryRepository, InMemoryUserRoleRepository, InMemoryIdentityProvider,
  InMemoryUnitOfWork, AuthorizationError, DomainInvariantError, NotFoundError, ValidationError,
  AuthorizationService, AuthorizationRequest, AuditSink, requireId, requireName, createTenant, UnlimitedEntitlementsForTestsOnly
} from "../src/index.js";

class Policy implements AuthorizationService {
  readonly requests: AuthorizationRequest[] = [];
  mode: "allow" | "deny" | "throw" = "allow";
  async can(request: AuthorizationRequest): Promise<boolean> {
    this.requests.push(request);
    if (this.mode === "throw") throw new Error("policy backend down");
    return this.mode === "allow";
  }
}

function world(options: { failAuditOn?: (action: string) => boolean } = {}) {
  const policy = new Policy();
  const repos = {
    tenants: new InMemoryRepository<any>(), organizations: new InMemoryRepository<any>(), units: new InMemoryRepository<any>(),
    users: new InMemoryRepository<any>(), professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(),
    roles: new InMemoryRepository<any>(), userRoles: new InMemoryUserRoleRepository()
  };
  const realAudit = new InMemoryAuditSink();
  const events = new InMemoryEventPublisher();
  const audit: AuditSink & { snapshot: () => readonly any[]; captureState: () => unknown; restoreState: (s: unknown) => void } = {
    async append(entry) {
      if (options.failAuditOn?.(entry.action)) throw new Error("audit backend down");
      await realAudit.append(entry);
    },
    snapshot: () => realAudit.snapshot(), captureState: () => realAudit.captureState(), restoreState: s => realAudit.restoreState(s)
  };
  const identities = new InMemoryIdentityProvider();
  for (const id of ["identity-a", "identity-b", "identity-c"]) identities.register({ id, subject: "s-" + id });
  const app = new HealCoreApplication({
    ids: new SequenceIdGenerator("t"), clock: new FixedClock("2026-11-23T00:00:00.000Z"),
    authorization: policy, audit, events, identities, entitlements: new UnlimitedEntitlementsForTestsOnly(),
    unitOfWork: new InMemoryUnitOfWork([audit, events, ...Object.values(repos)]), ...repos
  });
  return { app, policy, repos, audit, events };
}

async function seed() {
  const w = world();
  const root = platformContext({ actorUserId: "root" });
  const tenantA = await w.app.createTenant(root, { name: "Tenant A" });
  const tenantB = await w.app.createTenant(root, { name: "Tenant B" });
  const adminA = tenantContext({ tenantId: tenantA.id, actorUserId: "admin-a" });
  const adminB = tenantContext({ tenantId: tenantB.id, actorUserId: "admin-b" });
  const orgA1 = await w.app.createOrganization(adminA, { tenantId: tenantA.id, name: "Org A1" });
  const orgA2 = await w.app.createOrganization(adminA, { tenantId: tenantA.id, name: "Org A2" });
  const orgB = await w.app.createOrganization(adminB, { tenantId: tenantB.id, name: "Org B" });
  const ctxA1 = tenantContext({ tenantId: tenantA.id, organizationId: orgA1.id, actorUserId: "org-admin-a1" });
  const ctxA2 = tenantContext({ tenantId: tenantA.id, organizationId: orgA2.id, actorUserId: "org-admin-a2" });
  const ctxB = tenantContext({ tenantId: tenantB.id, organizationId: orgB.id, actorUserId: "org-admin-b" });
  const userA = await w.app.createUser(adminA, { tenantId: tenantA.id, identityId: "identity-a", displayName: "User A" });
  const userB = await w.app.createUser(adminB, { tenantId: tenantB.id, identityId: "identity-b", displayName: "User B" });
  const proleA = await w.app.createRole(adminA, { name: "Staff", architecturalRole: "professional" });
  return { ...w, root, tenantA, tenantB, adminA, adminB, orgA1, orgA2, orgB, ctxA1, ctxA2, ctxB, userA, userB, proleA };
}

test("P1: a tenant context cannot create platform-level roles; platform context can", async () => {
  const s = await seed();
  for (const architecturalRole of ["platform-admin", "technical-operator"] as const) {
    await assert.rejects(() => s.app.createRole(s.adminA, { name: "x", architecturalRole }), AuthorizationError);
  }
  const ok = await s.app.createRole(s.root, { name: "Platform admin", architecturalRole: "platform-admin" });
  assert.equal(ok.architecturalRole, "platform-admin");
});

test("P1: platform-level roles cannot be assigned below platform scope", async () => {
  const s = await seed();
  const privileged = await s.app.createRole(s.root, { name: "Platform admin", architecturalRole: "platform-admin" });
  await assert.rejects(() => s.app.assignRole(s.adminA, { userId: s.userA.id, roleId: privileged.id, scope: { level: "tenant", tenantId: s.tenantA.id } }), AuthorizationError);
  const granted = await s.app.assignRole(s.root, { userId: s.userA.id, roleId: privileged.id, scope: { level: "platform" } });
  assert.equal(granted.scope.level, "platform");
});

test("P2: an organization-level actor cannot assign roles outside its organization or tenant-wide", async () => {
  const s = await seed();
  await assert.rejects(() => s.app.assignRole(s.ctxA1, { userId: s.userA.id, roleId: s.proleA.id, scope: { level: "organization", tenantId: s.tenantA.id, organizationId: s.orgA2.id } }), DomainInvariantError);
  await assert.rejects(() => s.app.assignRole(s.ctxA1, { userId: s.userA.id, roleId: s.proleA.id, scope: { level: "tenant", tenantId: s.tenantA.id } }), DomainInvariantError);
  const own = await s.app.assignRole(s.ctxA1, { userId: s.userA.id, roleId: s.proleA.id, scope: { level: "organization", tenantId: s.tenantA.id, organizationId: s.orgA1.id } });
  assert.equal(own.scope.level, "organization");
});

test("P2: a unit-level actor cannot grant organization-wide scope", async () => {
  const s = await seed();
  const unit = await s.app.createUnit(s.ctxA1, { tenantId: s.tenantA.id, organizationId: s.orgA1.id, name: "Unit" });
  const unitCtx = tenantContext({ tenantId: s.tenantA.id, organizationId: s.orgA1.id, unitId: unit.id, actorUserId: "unit-admin" });
  await assert.rejects(() => s.app.assignRole(unitCtx, { userId: s.userA.id, roleId: s.proleA.id, scope: { level: "organization", tenantId: s.tenantA.id, organizationId: s.orgA1.id } }), DomainInvariantError);
});

test("P3: the policy receives the target role, user and scope of an assignment", async () => {
  const s = await seed();
  s.policy.requests.length = 0;
  await s.app.assignRole(s.adminA, { userId: s.userA.id, roleId: s.proleA.id, scope: { level: "tenant", tenantId: s.tenantA.id } });
  const req = s.policy.requests.find(r => r.action === "role.assign");
  if (!req) throw new Error("role.assign was not requested");
  assert.equal(req.resourceId, s.userA.id);
  assert.equal(req.attributes?.roleId, s.proleA.id);
  assert.equal(req.attributes?.architecturalRole, "professional");
  assert.deepEqual(req.attributes?.scope, { level: "tenant", tenantId: s.tenantA.id });
});

test("P4: a foreign tenant is indistinguishable from a missing one", async () => {
  const s = await seed();
  const foreign = await s.app.getTenant(s.adminA, s.tenantB.id).catch(e => e);
  const missing = await s.app.getTenant(s.adminA, "does-not-exist").catch(e => e);
  assert.ok(foreign instanceof NotFoundError && missing instanceof NotFoundError);
  assert.equal(foreign.constructor, missing.constructor);
  assert.equal(foreign.message.replace(s.tenantB.id, "X"), missing.message.replace("does-not-exist", "X"));
});

test("P5: refused attempts (policy denial, policy error, tenancy violation) are audited as failures", async () => {
  const s = await seed();
  const before = s.audit.snapshot().length;
  s.policy.mode = "deny";
  await assert.rejects(() => s.app.createOrganization(s.adminA, { tenantId: s.tenantA.id, name: "Denied" }), AuthorizationError);
  s.policy.mode = "throw";
  await assert.rejects(() => s.app.createOrganization(s.adminA, { tenantId: s.tenantA.id, name: "Errored" }), AuthorizationError);
  s.policy.mode = "allow";
  await assert.rejects(() => s.app.createOrganization(s.adminA, { tenantId: s.tenantB.id, name: "Cross" }), DomainInvariantError);
  const added = s.audit.snapshot().slice(before);
  assert.equal(added.length, 3);
  assert.ok(added.every(e => e.result === "failure" && e.tenantId === s.tenantA.id && e.actorId === "admin-a"));
  assert.deepEqual(added.map(e => e.metadata?.reason), ["policy-denied", "policy-error", "outside-tenancy"]);
});

test("P5: a failing policy backend fails closed", async () => {
  const s = await seed();
  s.policy.mode = "throw";
  await assert.rejects(() => s.app.createUser(s.adminA, { tenantId: s.tenantA.id, identityId: "identity-c", displayName: "C" }), AuthorizationError);
});

test("P6: a failing audit write rolls back state, audit and events together", async () => {
  const w = world({ failAuditOn: action => action === "organization.created" });
  const root = platformContext({ actorUserId: "root" });
  const tenant = await w.app.createTenant(root, { name: "T" });
  const ctx = tenantContext({ tenantId: tenant.id, actorUserId: "a" });
  const auditBefore = w.audit.snapshot().length, eventsBefore = w.events.snapshot().length;
  await assert.rejects(() => w.app.createOrganization(ctx, { tenantId: tenant.id, name: "Org" }), /audit backend down/);
  assert.equal(w.audit.snapshot().length, auditBefore);
  assert.equal(w.events.snapshot().length, eventsBefore);
  assert.equal(await w.repos.organizations.getInTenant(tenant.id, "t-2"), null);
  assert.equal([...(w.repos.organizations.captureState() as Map<string, unknown>).keys()].length, 0);
});

test("P6: concurrent operations stay atomic and serialized", async () => {
  const s = await seed();
  const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => s.app.createOrganization(s.adminA, { tenantId: s.tenantA.id, name: "Org " + i })));
  assert.ok(results.every(r => r.status === "fulfilled"));
  const created = s.audit.snapshot().filter(e => e.action === "organization.created" && e.tenantId === s.tenantA.id);
  assert.equal(created.length, 22);
});

test("P7: a user cannot be created for an unknown identity", async () => {
  const s = await seed();
  await assert.rejects(() => s.app.createUser(s.adminA, { tenantId: s.tenantA.id, identityId: "does-not-exist", displayName: "Ghost" }), NotFoundError);
});

test("P8: tenant-scoped lookups never return another tenant's entity", async () => {
  const s = await seed();
  assert.equal(await s.repos.users.getInTenant(s.tenantA.id, s.userB.id), null);
  assert.equal((await s.repos.users.getInTenant(s.tenantB.id, s.userB.id))?.id, s.userB.id);
  await assert.rejects(() => s.app.assignRole(s.adminA, { userId: s.userB.id, roleId: s.proleA.id, scope: { level: "tenant", tenantId: s.tenantA.id } }), NotFoundError);
  await assert.rejects(() => s.app.createProfessional(s.ctxA1, { tenantId: s.tenantA.id, userId: s.userB.id, organizationId: s.orgA1.id }), NotFoundError);
  await assert.rejects(() => s.app.createSubject(s.ctxA1, { tenantId: s.tenantA.id, organizationId: s.orgB.id, displayName: "x" }), DomainInvariantError);
});

test("P9: names reject empty, invisible, oversized and markup input", () => {
  for (const bad of ["", "   ", "​", "‮evil", "a\u0000b", "x".repeat(201), "<script>alert(1)</script>", "a\nb"]) {
    assert.throws(() => requireName(bad, "name"), ValidationError, JSON.stringify(bad).slice(0, 30));
  }
  assert.equal(requireName("  José da Silva  ", "name"), "José da Silva");
  assert.equal(requireName("Café", "name"), "Café");
});

test("P9: identifiers are strict ASCII tokens", () => {
  for (const bad of ["", " id", "a b", "../etc", "x".repeat(129), "é", "id\n", "-lead"]) assert.throws(() => requireId(bad, "id"));
  assert.equal(requireId("tenant-1.a:b@c", "id"), "tenant-1.a:b@c");
});

test("P9: the reserved platform scope id cannot be a tenant id", () => {
  assert.throws(() => createTenant({ id: "platform.scope", name: "x" }), DomainInvariantError);
});

test("P10: the same role at different scopes does not overwrite earlier assignments", async () => {
  const s = await seed();
  await s.app.assignRole(s.adminA, { userId: s.userA.id, roleId: s.proleA.id, scope: { level: "tenant", tenantId: s.tenantA.id } });
  await s.app.assignRole(s.ctxA1, { userId: s.userA.id, roleId: s.proleA.id, scope: { level: "organization", tenantId: s.tenantA.id, organizationId: s.orgA1.id } });
  assert.equal((await s.repos.userRoles.listForUser(s.userA.id)).length, 2);
});

test("hostile input never reaches storage or audit when validation fails", async () => {
  const s = await seed();
  const before = s.audit.snapshot().filter(e => e.result === "success").length;
  await assert.rejects(() => s.app.createOrganization(s.adminA, { tenantId: s.tenantA.id, name: "<img src=x onerror=alert(1)>" }), ValidationError);
  await assert.rejects(() => s.app.createOrganization(s.adminA, { tenantId: s.tenantA.id, name: "A".repeat(1_000_000) }), ValidationError);
  assert.equal(s.audit.snapshot().filter(e => e.result === "success").length, before);
});

test("production id generator yields unique, valid, unguessable ids", async () => {
  const { RandomIdGenerator, SystemClock } = await import("../src/index.js");
  const gen = new RandomIdGenerator();
  const ids = new Set(Array.from({ length: 1000 }, () => gen.next()));
  assert.equal(ids.size, 1000);
  for (const id of ids) assert.doesNotThrow(() => requireId(id, "id"));
  assert.ok(!Number.isNaN(Date.parse(new SystemClock().now())));
});
