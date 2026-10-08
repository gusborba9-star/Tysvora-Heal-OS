import {
  HealCoreApplication, platformContext, tenantContext, SequenceIdGenerator, FixedClock,
  InMemoryAuditSink, InMemoryEventPublisher, InMemoryRepository, InMemoryUserRoleRepository,
  AuthorizationService, AuthorizationRequest, DomainInvariantError, NotFoundError, AuthorizationError
} from "../src/index.js";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error("Assertion failed: " + message); }
async function rejects(factory: () => Promise<unknown>, ErrorType: Function, message: string): Promise<void> {
  try { await factory(); throw new Error("Expected rejection: " + message); }
  catch (error) { if (!(error instanceof ErrorType)) throw error; }
}
class AllowAuthorization implements AuthorizationService { async can(_: AuthorizationRequest): Promise<boolean> { return true; } }
class DenyAuthorization implements AuthorizationService { async can(_: AuthorizationRequest): Promise<boolean> { return false; } }

const repos = {
  tenants: new InMemoryRepository<any>(), organizations: new InMemoryRepository<any>(), units: new InMemoryRepository<any>(),
  users: new InMemoryRepository<any>(), professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(),
  roles: new InMemoryRepository<any>(), userRoles: new InMemoryUserRoleRepository()
};
const audit = new InMemoryAuditSink();
const events = new InMemoryEventPublisher();
const app = new HealCoreApplication({
  ids: new SequenceIdGenerator("id"), clock: new FixedClock("2026-10-08T00:00:00.000Z"),
  authorization: new AllowAuthorization(), audit, events, ...repos
});

const platform = platformContext({ actorUserId: "platform-actor", correlationId: "corr-1" });
const tenant = await app.createTenant(platform, { name: "Tenant A" });
const tenantB = await app.createTenant(platform, { name: "Tenant B" });
const tenantAdmin = tenantContext({ tenantId: tenant.id, actorUserId: "admin", correlationId: "corr-2" });
const org = await app.createOrganization(tenantAdmin, { tenantId: tenant.id, name: "Org A" });
const orgContext = tenantContext({ tenantId: tenant.id, organizationId: org.id, actorUserId: "admin", correlationId: "corr-3" });
const unit = await app.createUnit(orgContext, { tenantId: tenant.id, organizationId: org.id, name: "Unit A" });
const user = await app.createUser(orgContext, { tenantId: tenant.id, identityId: "identity-a", displayName: "User A" });
const professional = await app.createProfessional(orgContext, { tenantId: tenant.id, userId: user.id, organizationId: org.id });
const subject = await app.createSubject(orgContext, { tenantId: tenant.id, organizationId: org.id, displayName: "Subject A" });
const role = await app.createRole(orgContext, { name: "Professional", architecturalRole: "professional" });
const assignment = await app.assignRole(orgContext, { userId: user.id, roleId: role.id, scope: { level: "unit", tenantId: tenant.id, organizationId: org.id, unitId: unit.id } });

assert(professional.organizationId === org.id, "professional created");
assert(subject.organizationId === org.id, "subject created");
assert(assignment.userId === user.id, "role assignment created");
assert(audit.snapshot().length === 9, "audit entry per relevant operation");
assert(events.snapshot().length === 9, "event per relevant operation");

await rejects(() => app.createOrganization(tenantAdmin, { tenantId: tenantB.id, name: "Cross Tenant" }), DomainInvariantError, "cross-tenant organization");
await rejects(() => app.createUnit(orgContext, { tenantId: tenant.id, organizationId: "other-org", name: "Cross Organization" }), DomainInvariantError, "cross-organization unit");
await rejects(() => app.getTenant(orgContext, tenantB.id), DomainInvariantError, "cross-tenant read");
await rejects(() => app.assignRole(orgContext, { userId: "missing-user", roleId: role.id, scope: { level: "tenant", tenantId: tenant.id } }), NotFoundError, "missing user");

const denied = new HealCoreApplication({
  ids: new SequenceIdGenerator("deny"), clock: new FixedClock("2026-10-08T00:00:00.000Z"),
  authorization: new DenyAuthorization(), audit: new InMemoryAuditSink(), events: new InMemoryEventPublisher(), ...repos
});
await rejects(() => denied.createUser(orgContext, { tenantId: tenant.id, identityId: "identity-denied", displayName: "Denied" }), AuthorizationError, "authorization denial");

console.log("PASS application services");
