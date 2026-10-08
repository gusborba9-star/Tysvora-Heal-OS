import {
  HealCoreApplication, platformContext, tenantContext, SequenceIdGenerator, FixedClock,
  InMemoryAuditSink, InMemoryEventPublisher, InMemoryRepository, InMemoryUserRoleRepository,
  AuthorizationService, AuthorizationRequest, AuthorizationError, DomainInvariantError,
  createTenant, createOrganization, createUnit, createUser, createRole, createUserRole
} from "../src/index.js";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error("Assertion failed: " + message); }
async function rejects(factory: () => Promise<unknown>, ErrorType: Function, message: string): Promise<void> {
  try { await factory(); throw new Error("Expected rejection: " + message); }
  catch (error) { if (!(error instanceof ErrorType)) throw error; }
}
class Policy implements AuthorizationService {
  readonly requests: AuthorizationRequest[] = [];
  constructor(private readonly allowedActions: Set<string>) {}
  async can(request: AuthorizationRequest): Promise<boolean> {
    this.requests.push(request);
    return this.allowedActions.has(request.action);
  }
}
const allowed = new Set(["tenant.create", "organization.create", "unit.create", "user.create", "role.create", "role.assign", "role.assign.platform"]);
const policy = new Policy(allowed);
const tenants = new InMemoryRepository<any>(), organizations = new InMemoryRepository<any>(), units = new InMemoryRepository<any>();
const users = new InMemoryRepository<any>(), roles = new InMemoryRepository<any>(), userRoles = new InMemoryUserRoleRepository();
const audit = new InMemoryAuditSink(), events = new InMemoryEventPublisher();
const app = new HealCoreApplication({
  ids: new SequenceIdGenerator("04b"), clock: new FixedClock("2026-10-08T00:00:00.000Z"),
  authorization: policy, audit, events, tenants, organizations, units,
  users, professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(),
  roles, userRoles
});
const platform = platformContext({ actorUserId: "platform-actor", correlationId: "platform-corr" });
const tenantA = await app.createTenant(platform, { name: "Tenant A" });
const tenantB = await app.createTenant(platform, { name: "Tenant B" });
const tenantCtx = tenantContext({ tenantId: tenantA.id, actorUserId: "tenant-admin", correlationId: "tenant-corr" });
const orgA = await app.createOrganization(tenantCtx, { tenantId: tenantA.id, name: "Org A" });
const orgCtx = tenantContext({ tenantId: tenantA.id, organizationId: orgA.id, actorUserId: "tenant-admin" });
const unitA = await app.createUnit(orgCtx, { tenantId: tenantA.id, organizationId: orgA.id, name: "Unit A" });
const userA = await app.createUser(orgCtx, { tenantId: tenantA.id, identityId: "identity-a", displayName: "User A" });
const role = await app.createRole(orgCtx, { name: "Test role" });
const platformRole = createRole({ id: "platform-role", name: "Platform role" });
await roles.save(platformRole);

const beforeAudit = audit.snapshot().length, beforeEvents = events.snapshot().length;
await rejects(() => app.assignRole(tenantCtx, { userId: userA.id, roleId: platformRole.id, scope: { level: "platform" } }), AuthorizationError, "tenant context cannot assign platform role");
assert((await userRoles.getById(userA.id + ":" + platformRole.id)) === null, "denied platform assignment was not persisted");
assert(audit.snapshot().length === beforeAudit, "denied platform assignment created no success audit");
assert(events.snapshot().length === beforeEvents, "denied platform assignment published no success event");
assert(!policy.requests.some(r => r.action === "role.assign.platform" && r.context.scope === "tenant"), "tenant cannot invoke the platform authorization path");

const platformGrantPolicy = new Policy(new Set(["role.assign.platform", "role.assign"]));
const platformAudit = new InMemoryAuditSink(), platformEvents = new InMemoryEventPublisher();
const platformApp = new HealCoreApplication({
  ids: new SequenceIdGenerator("platform-grant"), clock: new FixedClock("2026-10-08T00:00:00.000Z"),
  authorization: platformGrantPolicy, audit: platformAudit, events: platformEvents, tenants, organizations, units,
  users, professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(), roles, userRoles: new InMemoryUserRoleRepository()
});
const granted = await platformApp.assignRole(platform, { userId: userA.id, roleId: platformRole.id, scope: { level: "platform" } });
assert(granted.scope.level === "platform", "platform context succeeds when specific and generic authorization are granted");
assert(platformGrantPolicy.requests.some(r => r.action === "role.assign.platform"), "specific platform authorization was checked");
assert(platformGrantPolicy.requests.some(r => r.action === "role.assign"), "generic authorization was also checked");
assert(platformAudit.snapshot().length === 1 && platformEvents.snapshot().length === 1, "successful platform assignment audits and publishes event");

const deniedSpecificPolicy = new Policy(new Set(["role.assign"]));
const deniedSpecificAudit = new InMemoryAuditSink(), deniedSpecificEvents = new InMemoryEventPublisher();
const deniedSpecificApp = new HealCoreApplication({
  ids: new SequenceIdGenerator("platform-denied"), clock: new FixedClock("2026-10-08T00:00:00.000Z"),
  authorization: deniedSpecificPolicy, audit: deniedSpecificAudit, events: deniedSpecificEvents, tenants, organizations, units,
  users, professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(), roles, userRoles: new InMemoryUserRoleRepository()
});
await rejects(() => deniedSpecificApp.assignRole(platform, { userId: userA.id, roleId: platformRole.id, scope: { level: "platform" } }), AuthorizationError, "platform assignment denied without specific authorization");
assert(deniedSpecificAudit.snapshot().length === 0 && deniedSpecificEvents.snapshot().length === 0, "specific authorization denial has no success side effects");

for (const scope of [
  { level: "tenant" as const, tenantId: tenantA.id },
  { level: "organization" as const, tenantId: tenantA.id, organizationId: orgA.id },
  { level: "unit" as const, tenantId: tenantA.id, organizationId: orgA.id, unitId: unitA.id }
]) {
  const result = await app.assignRole(orgCtx, { userId: userA.id, roleId: role.id, scope });
  assert(result.scope.level === scope.level, "valid " + scope.level + " assignment still works");
}
await rejects(() => app.assignRole(orgCtx, { userId: userA.id, roleId: role.id, scope: { level: "tenant", tenantId: tenantB.id } }), DomainInvariantError, "cross-tenant role assignment remains rejected");
const orgB = createOrganization({ id: "org-b", tenantId: tenantB.id, name: "Org B" }, tenantB);
const unitB = createUnit({ id: "unit-b", tenantId: tenantB.id, organizationId: orgB.id, name: "Unit B" }, orgB);
const userB = createUser({ id: "user-b", tenantId: tenantB.id, identityId: "identity-b", displayName: "User B" }, tenantB);
await organizations.save(orgB); await units.save(unitB); await users.save(userB);
await rejects(() => app.assignRole(orgCtx, { userId: userB.id, roleId: role.id, scope: { level: "tenant", tenantId: tenantA.id } }), DomainInvariantError, "UserRole tenant invariant remains enforced");
await rejects(async () => { createUserRole({ userId: userA.id, roleId: role.id, scope: { level: "organization", tenantId: tenantA.id, organizationId: orgB.id } }, userA, orgB); }, DomainInvariantError, "03A organization tenancy invariant remains enforced");
await rejects(async () => { createUserRole({ userId: userA.id, roleId: role.id, scope: { level: "unit", tenantId: tenantA.id, organizationId: orgA.id, unitId: unitB.id } }, userA, orgA, unitB); }, DomainInvariantError, "03A unit tenancy invariant remains enforced");

console.log("PASS platform role assignment authorization and tenancy invariants");
