import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  HealCoreApplication, ProgramApplication, IntakeApplication, platformContext, tenantContext, SequenceIdGenerator, MutableClock,
  InMemoryAuditSink, InMemoryEventPublisher, InMemoryRepository, InMemoryUserRoleRepository, InMemoryIdentityProvider, InMemoryUnitOfWork, InMemoryUsageMeter,
  InMemoryChannelConnections, RbacAuthorizationService, EntitlementService, UsageService, WhatsAppCloudProvider, verifyHmacSha256,
  AuthorizationError, DomainInvariantError, NotFoundError, EntitlementSource, PlanDefinition, ArchitecturalRole, normalizePhone, contactKey, sanitizeDemandText,
  ContinuityRule, ContinuityPolicy
} from "../src/index.js";

const START = "2026-11-23T12:00:00.000Z";
const SECRET = "app-secret-for-tests";
const RULES: ContinuityRule[] = [{ id: "demand", signal: "unanswered-demand", responseHours: 24, windowDays: 30 }];
const POLICY: ContinuityPolicy = { minSignals: 1, pendency: { priority: "high", slaHours: 24, queue: "inbox" } };
const PLAN: PlanDefinition = { id: "p", limits: {}, quotas: { "whatsapp.messages": 2 }, features: ["program-engine", "sentinela"] };
class Plans implements EntitlementSource { async planFor() { return PLAN; } async overridesFor() { return {}; } }

async function world() {
  const clock = new MutableClock(START);
  const core = { tenants: new InMemoryRepository<any>(), organizations: new InMemoryRepository<any>(), units: new InMemoryRepository<any>(), users: new InMemoryRepository<any>(), professionals: new InMemoryRepository<any>(), subjects: new InMemoryRepository<any>(), roles: new InMemoryRepository<any>(), userRoles: new InMemoryUserRoleRepository() };
  const prog = { definitions: new InMemoryRepository<any>(), enrollments: new InMemoryRepository<any>(), facts: new InMemoryRepository<any>(), pendencies: new InMemoryRepository<any>() };
  const care = { consents: new InMemoryRepository<any>(), bindings: new InMemoryRepository<any>(), demands: new InMemoryRepository<any>() };
  const audit = new InMemoryAuditSink(), events = new InMemoryEventPublisher(), meter = new InMemoryUsageMeter(), connections = new InMemoryChannelConnections();
  const identities = new InMemoryIdentityProvider();
  for (let i = 1; i <= 12; i++) identities.register({ id: "i" + i, subject: "i" + i });
  const unitOfWork = new InMemoryUnitOfWork([audit, events, meter, ...Object.values(core), ...Object.values(prog), ...Object.values(care)]);
  const authorization = new RbacAuthorizationService({ roles: core.roles, userRoles: core.userRoles, platformOperators: new Set(["root"]) });
  const entitlements = new EntitlementService(new Plans());
  const base = { ids: new SequenceIdGenerator("c"), clock, authorization, audit, events, unitOfWork, entitlements };
  const coreApp = new HealCoreApplication({ ...base, identities, ...core });
  const programs = new ProgramApplication({ ...base, ...prog, subjects: core.subjects, users: core.users });
  const usage = new UsageService({ entitlements, meter, unitOfWork, clock });
  const intake = new IntakeApplication({ ...base, ...care, facts: prog.facts, enrollments: prog.enrollments, subjects: core.subjects, users: core.users, connections, programs, usage });

  const root = platformContext({ actorUserId: "root" });
  const tenant = await coreApp.createTenant(root, { name: "T" });
  const rootIn = tenantContext({ tenantId: tenant.id, actorUserId: "root" });
  const org = await coreApp.createOrganization(rootIn, { tenantId: tenant.id, name: "UBS" });
  const org2 = await coreApp.createOrganization(rootIn, { tenantId: tenant.id, name: "UBS 2" });
  let n = 0;
  const staff = async (arch: ArchitecturalRole, orgId = org.id) => {
    const u = await coreApp.createUser(rootIn, { tenantId: tenant.id, identityId: "i" + ++n, displayName: arch + n });
    const r = await coreApp.createRole(root, { name: arch + "-" + n, architecturalRole: arch });
    await coreApp.assignRole(rootIn, { userId: u.id, roleId: r.id, scope: { level: "organization", tenantId: tenant.id, organizationId: orgId } });
    return { user: u, ctx: tenantContext({ tenantId: tenant.id, organizationId: orgId, actorUserId: u.id }) };
  };
  const author = await staff("tenant-admin"), approver = await staff("municipal-management"), nurse = await staff("professional"), service = await staff("integration-service");
  const stranger = await staff("professional", org2.id);
  const noRole = await coreApp.createUser(rootIn, { tenantId: tenant.id, identityId: "i" + ++n, displayName: "norole" });
  await connections.save({ id: "cx1", tenantId: tenant.id, organizationId: org.id, channel: "whatsapp", accountId: "PHONE-ID-1", serviceUserId: service.user.id, status: "active" });
  const subject = (name: string) => coreApp.createSubject(nurse.ctx, { tenantId: tenant.id, organizationId: org.id, displayName: name });
  const draft = await programs.createProgram(author.ctx, { key: "dm", name: "DM", rules: RULES, continuity: POLICY });
  await programs.approveProgram(approver.ctx, draft.id);
  const provider = new WhatsAppCloudProvider(SECRET);
  const msg = (id: string, from: string, text = "preciso de ajuda", account = "PHONE-ID-1", ts = Date.parse(START) / 1000 - 60) => ({ channel: "whatsapp" as const, accountId: account, externalId: id, from, receivedAt: new Date(ts * 1000).toISOString(), kind: "text" as const, text });
  return { intake, programs, coreApp, clock, audit, events, care, prog, meter, connections, tenant, org, org2, nurse, approver, service, stranger, noRole, subject, provider, msg, usage };
}
type W = Awaited<ReturnType<typeof world>>;
async function enrolledAndBound(w: W, name = "Maria", phone = "+55 11 98888-7777") {
  const s = await w.subject(name);
  const e = await w.programs.enroll(w.nurse.ctx, { subjectId: s.id, programKey: "dm" });
  await w.intake.bindContact(w.nurse.ctx, { subjectId: s.id, channel: "whatsapp", address: phone, verification: "staff" });
  return { s, e };
}

// ---------- consent ----------
test("consent: grant is idempotent, revocation is immediate and keeps history, re-granting is a new record", async () => {
  const w = await world(); const s = await w.subject("Ana");
  const g = { subjectId: s.id, channel: "whatsapp" as const, purpose: "reminders" as const, legalBasis: "consent" as const, evidence: "paper-form-2026-11-23" };
  const a = await w.intake.grantConsent(w.nurse.ctx, g), b = await w.intake.grantConsent(w.nurse.ctx, g);
  assert.equal(a.id, b.id);
  assert.equal(await w.intake.canContact(w.tenant.id, s.id, "whatsapp", "reminders"), true);
  assert.equal(await w.intake.canContact(w.tenant.id, s.id, "whatsapp", "care-contact"), false, "purpose limitation");
  assert.equal(await w.intake.canContact(w.tenant.id, s.id, "sms", "reminders"), false, "channel limitation");
  const r = await w.intake.revokeConsent(w.nurse.ctx, a.id);
  assert.equal(r.status, "revoked"); assert.ok(r.revokedAt);
  assert.equal(await w.intake.canContact(w.tenant.id, s.id, "whatsapp", "reminders"), false);
  await assert.rejects(() => w.intake.revokeConsent(w.nurse.ctx, a.id), DomainInvariantError);
  const again = await w.intake.grantConsent(w.nurse.ctx, g);
  assert.notEqual(again.id, a.id);
  assert.equal((await w.care.consents.listInTenant(w.tenant.id)).length, 2, "history kept");
});

test("consent: validation, permission and organization boundaries", async () => {
  const w = await world(); const s = await w.subject("Bia");
  const base = { subjectId: s.id, channel: "whatsapp" as const, purpose: "reminders" as const, legalBasis: "consent" as const, evidence: "form" };
  await assert.rejects(() => w.intake.grantConsent(w.nurse.ctx, { ...base, evidence: "  " }));
  await assert.rejects(() => w.intake.grantConsent(w.nurse.ctx, { ...base, channel: "pigeon" as any }), DomainInvariantError);
  await assert.rejects(() => w.intake.grantConsent(w.nurse.ctx, { ...base, purpose: "marketing" as any }), DomainInvariantError);
  await assert.rejects(() => w.intake.grantConsent(w.nurse.ctx, { ...base, legalBasis: "whatever" as any }), DomainInvariantError);
  await assert.rejects(() => w.intake.grantConsent(w.service.ctx, base), AuthorizationError, "the integration identity cannot grant consent");
  await assert.rejects(() => w.intake.grantConsent(w.stranger.ctx, base), NotFoundError, "staff of another organization cannot even see the person");
  assert.ok(w.audit.snapshot().some(a => a.action === "consent.record.denied" && (a.metadata as any)?.reason === "outside-organization"));
  assert.equal((await w.care.consents.listInTenant(w.tenant.id)).length, 0);
});

// ---------- addresses ----------
test("addresses: phones normalize, hostile input is rejected, Brazilian mobiles match with or without the ninth digit", () => {
  assert.equal(normalizePhone("+55 (11) 98888-7777"), "+5511988887777");
  for (const bad of ["", "abc", "12", "+0123456789", "5511988887777'; drop table", "+55 11 9888-77778888888"]) assert.throws(() => normalizePhone(bad), DomainInvariantError);
  assert.equal(contactKey("whatsapp", "5511988887777"), contactKey("whatsapp", "551188887777"));
  assert.notEqual(contactKey("whatsapp", "5511988887777"), contactKey("whatsapp", "5511988887778"));
  assert.equal(contactKey("email", " Ana@Example.com "), "ana@example.com");
});

// ---------- webhook authenticity ----------
const sign = (body: string, secret = SECRET) => "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
const payload = (id = "wamid.A", from = "5511988887777", phoneId = "PHONE-ID-1", extra: any = {}) => JSON.stringify({ entry: [{ changes: [{ value: { metadata: { phone_number_id: phoneId }, messages: [{ id, from, timestamp: String(Date.parse(START) / 1000 - 30), type: "text", text: { body: "oi" }, ...extra }] } }] }] });

test("webhook: only a correctly signed body is accepted (constant-time, exact body, strict header)", async () => {
  const w = await world(); const body = payload();
  assert.equal(verifyHmacSha256(body, sign(body), SECRET), true);
  for (const bad of [undefined, "", "sha256=", "sha256=zz", sign(body, "other-secret"), sign(body + " "), "sha1=" + sign(body).slice(7), sign(body).toUpperCase(), sign(body) + "00"]) {
    assert.equal(verifyHmacSha256(body, bad as any, SECRET), bad === sign(body).toUpperCase() ? false : false, String(bad));
  }
  assert.equal(verifyHmacSha256(body, sign(body, ""), ""), false, "a signature made with an empty secret (forgeable by anyone) never validates");
  assert.equal(await w.intake.receiveWebhook(w.provider, body, {}), "unauthentic");
  assert.equal(await w.intake.receiveWebhook(w.provider, body, { "x-hub-signature-256": sign(body, "x") }), "unauthentic");
  assert.equal((await w.care.demands.listInTenant(w.tenant.id)).length, 0, "nothing stored for an unauthentic call");
  const ok = await w.intake.receiveWebhook(w.provider, body, { "x-hub-signature-256": sign(body) });
  assert.ok(Array.isArray(ok) && ok.length === 1);
});

test("webhook: malformed or hostile payloads are tolerated without throwing or storing garbage", async () => {
  const w = await world();
  for (const raw of ["", "not json", "[]", "{}", JSON.stringify({ entry: "x" }), JSON.stringify({ entry: [{ changes: [{ value: { metadata: {}, messages: [{ id: 1 }] } }] }] }), JSON.stringify({ entry: [null, { changes: [null] }] })]) {
    const out = await w.intake.receiveWebhook(w.provider, raw, { "x-hub-signature-256": sign(raw) });
    assert.deepEqual(out, []);
  }
  assert.equal((await w.care.demands.listInTenant(w.tenant.id)).length, 0);
});

// ---------- inbound ----------
test("inbound: a verified sender is linked, the message opens a demand fact, and time turns it into a pendency until answered", async () => {
  const w = await world(); const { s, e } = await enrolledAndBound(w);
  const body = payload("wamid.1", "5511988887777");
  const out = await w.intake.receiveWebhook(w.provider, body, { "x-hub-signature-256": sign(body) });
  const demand = (out as any)[0].demand;
  assert.equal(demand.subjectId, s.id); assert.equal(demand.linkedBy, "auto"); assert.equal(demand.status, "new");
  const facts = await w.prog.facts.listInTenant(w.tenant.id);
  assert.equal(facts.length, 1); assert.equal(facts[0].kind, "demand.opened"); assert.equal(facts[0].reference, demand.id); assert.equal(facts[0].enrollmentId, e.id);
  assert.equal((await w.programs.listPendencies(w.nurse.ctx)).length, 0, "within the response window");
  w.clock.advanceDays(2);
  assert.equal((await w.programs.sweepContinuity(w.nurse.ctx)).created, 1, "the sweep sees the unanswered demand");
  await w.intake.answerDemand(w.nurse.ctx, demand.id);
  const after = await w.programs.evaluateContinuity(w.nurse.ctx, e.id);
  assert.equal(after.assessment.signals.length, 0, "answering clears the signal");
  assert.equal((await w.intake.answerDemand(w.nurse.ctx, demand.id)).status, "answered", "answering twice is harmless");
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).filter(f => f.kind === "demand.answered").length, 1);
});

test("inbound: the Brazilian ninth-digit variant still finds the person", async () => {
  const w = await world(); const { s } = await enrolledAndBound(w, "Caio", "+55 11 98888-7777");
  const r = await w.intake.receive(w.msg("wamid.9", "551188887777"));
  assert.equal((r as any).demand.subjectId, s.id);
});

test("inbound: redelivery is idempotent, even when 12 copies arrive at once", async () => {
  const w = await world(); await enrolledAndBound(w);
  const results = await Promise.all(Array.from({ length: 12 }, () => w.intake.receive(w.msg("wamid.dup", "5511988887777"))));
  assert.equal((await w.care.demands.listInTenant(w.tenant.id)).length, 1);
  assert.equal(results.filter(r => r.status === "stored" && !r.duplicate).length, 1);
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).length, 1, "one fact, not twelve");
  assert.equal(await w.usage.usage(w.tenant.id, "whatsapp.messages").then(u => u.used), 1, "metered once");
});

test("inbound: if a first attempt stopped after storing the message, the retry completes the missing fact", async () => {
  const w = await world(); const { s } = await enrolledAndBound(w);
  const first = await w.intake.receive(w.msg("wamid.r", "5511988887777"));
  const demandId = (first as any).demand.id;
  // Simulate the crash window: the demand exists but its fact was lost.
  for (const f of await w.prog.facts.listInTenant(w.tenant.id)) (w.prog.facts as any).items?.delete?.(f.id);
  (w.prog.facts as any).restoreState(new Map());
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).length, 0);
  const retry = await w.intake.receive(w.msg("wamid.r", "5511988887777"));
  assert.equal((retry as any).duplicate, true);
  const facts = await w.prog.facts.listInTenant(w.tenant.id);
  assert.equal(facts.length, 1); assert.equal(facts[0].reference, demandId);
  assert.equal((await w.care.demands.listInTenant(w.tenant.id)).length, 1);
  assert.ok(s.id);
});

test("inbound: unknown, unverified and shared numbers are kept unlinked for a human, never guessed", async () => {
  const w = await world();
  const a = await w.subject("Pai"), b = await w.subject("Filho"), c = await w.subject("Vizinha");
  for (const x of [a, b]) await w.intake.bindContact(w.nurse.ctx, { subjectId: x.id, channel: "whatsapp", address: "+5511977776666", verification: "staff" });
  await w.intake.bindContact(w.nurse.ctx, { subjectId: c.id, channel: "whatsapp", address: "+5511966665555", verification: "none" });
  const shared = await w.intake.receive(w.msg("m1", "5511977776666")), unverified = await w.intake.receive(w.msg("m2", "5511966665555")), unknown = await w.intake.receive(w.msg("m3", "5521955554444"));
  for (const r of [shared, unverified, unknown]) { assert.equal(r.status, "stored"); assert.equal((r as any).demand.subjectId, undefined); }
  assert.equal((await w.intake.listDemands(w.nurse.ctx, { onlyUnlinked: true })).length, 3);
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).length, 0);
  await assert.rejects(() => w.intake.answerDemand(w.nurse.ctx, (shared as any).demand.id), DomainInvariantError, "must be linked first");
  const e = await w.programs.enroll(w.nurse.ctx, { subjectId: a.id, programKey: "dm" });
  const linked = await w.intake.linkDemand(w.nurse.ctx, { demandId: (shared as any).demand.id, subjectId: a.id });
  assert.equal(linked.subjectId, a.id); assert.equal(linked.linkedBy, w.nurse.user.id);
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).filter(f => f.enrollmentId === e.id).length, 1);
  await assert.rejects(() => w.intake.linkDemand(w.nurse.ctx, { demandId: linked.id, subjectId: b.id }), DomainInvariantError, "already linked");
  await assert.rejects(() => w.intake.linkDemand(w.nurse.ctx, { demandId: (unknown as any).demand.id, subjectId: "nobody" }), NotFoundError);
});

test("inbound: content is bounded and cleaned, timestamps cannot be in the future, non-text is kept as a marker", async () => {
  const w = await world();
  const r1 = await w.intake.receive({ ...w.msg("t1", "5521900000001", "oi\u0000‮ mundo​\n<script>alert(1)</script>" + "x".repeat(9000)), receivedAt: "2099-01-01T00:00:00.000Z" });
  const d1 = (r1 as any).demand;
  assert.ok(d1.text.length <= 4096); assert.ok(!/[\u0000‮​]/.test(d1.text)); assert.ok(d1.text.includes("<script>"), "stored verbatim as data, never interpreted");
  assert.ok(Date.parse(d1.receivedAt) <= Date.parse(START), "future timestamps are clamped");
  const r2 = await w.intake.receive({ ...w.msg("t2", "5521900000002"), kind: "unsupported", text: "ignored" });
  assert.equal((r2 as any).demand.kind, "unsupported"); assert.equal((r2 as any).demand.text, "");
  assert.equal(sanitizeDemandText(null as any), "");
});

test("inbound: an unknown account or a disabled connection is ignored; a service identity without the permission fails closed", async () => {
  const w = await world();
  assert.deepEqual(await w.intake.receive(w.msg("x1", "5511900000000", "oi", "OTHER-ACCOUNT")), { status: "ignored", reason: "unknown-account" });
  await w.connections.save({ id: "cx1", tenantId: w.tenant.id, organizationId: w.org.id, channel: "whatsapp", accountId: "PHONE-ID-1", serviceUserId: w.service.user.id, status: "disabled" });
  assert.deepEqual(await w.intake.receive(w.msg("x2", "5511900000000")), { status: "ignored", reason: "connection-disabled" });
  await w.connections.save({ id: "cx1", tenantId: w.tenant.id, organizationId: w.org.id, channel: "whatsapp", accountId: "PHONE-ID-1", serviceUserId: w.noRole.id, status: "active" });
  await assert.rejects(() => w.intake.receive(w.msg("x3", "5511900000000")), AuthorizationError);
  await w.connections.save({ id: "cx1", tenantId: w.tenant.id, organizationId: w.org.id, channel: "whatsapp", accountId: "PHONE-ID-1", serviceUserId: w.nurse.user.id, status: "active" });
  await assert.rejects(() => w.intake.receive(w.msg("x4", "5511900000000")), AuthorizationError, "a professional identity is not an integration identity");
  assert.equal((await w.care.demands.listInTenant(w.tenant.id)).length, 0);
});

test("inbound volume is metered but never blocked by the quota (a person's message is not dropped)", async () => {
  const w = await world();
  for (let i = 0; i < 5; i++) assert.equal((await w.intake.receive(w.msg("q" + i, "5521900000099"))).status, "stored");
  assert.deepEqual(await w.usage.usage(w.tenant.id, "whatsapp.messages"), { used: 5, quota: 2 });
  await assert.rejects(() => w.usage.consume(w.tenant.id, "whatsapp.messages", 1), /quota/i, "outbound sending is the gated side");
  await assert.rejects(() => w.usage.record(w.tenant.id, "whatsapp.messages", 0));
});

test("staff only see and work on their own organization's demands", async () => {
  const w = await world(); await enrolledAndBound(w);
  const r = await w.intake.receive(w.msg("o1", "5511988887777"));
  const id = (r as any).demand.id;
  assert.equal((await w.intake.listDemands(w.nurse.ctx)).length, 1);
  assert.equal((await w.intake.listDemands(w.stranger.ctx)).length, 0);
  await assert.rejects(() => w.intake.answerDemand(w.stranger.ctx, id), NotFoundError);
  assert.equal((await w.care.demands.getInTenant(w.tenant.id, id)).status, "new", "a refused answer changes nothing");
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).filter(f => f.kind === "demand.answered").length, 0);
  await assert.rejects(() => w.intake.linkDemand(w.stranger.ctx, { demandId: id, subjectId: "x" }), NotFoundError);
  await assert.rejects(() => w.intake.listDemands(w.service.ctx), AuthorizationError);
});

test("answering: if a previous attempt stopped before the answered fact was written, repeating the call completes it", async () => {
  const w = await world(); const { e } = await enrolledAndBound(w);
  const r = await w.intake.receive(w.msg("a1", "5511988887777"));
  const id = (r as any).demand.id;
  const current = (await w.care.demands.getInTenant(w.tenant.id, id))!;
  await w.care.demands.save({ ...current, status: "answered", answeredAt: START, answeredBy: w.nurse.user.id }); // crash window: answered, no fact
  assert.equal((await w.prog.facts.listInTenant(w.tenant.id)).filter(f => f.kind === "demand.answered").length, 0);
  await w.intake.answerDemand(w.nurse.ctx, id);
  const facts = (await w.prog.facts.listInTenant(w.tenant.id)).filter(f => f.kind === "demand.answered");
  assert.equal(facts.length, 1); assert.equal(facts[0].enrollmentId, e.id);
});

test("the integration identity must belong to the connection's own tenant", async () => {
  const w = await world();
  const foreign = await w.coreApp.createTenant(platformContext({ actorUserId: "root" }), { name: "Other tenant" });
  const foreignUser = await w.coreApp.createUser(tenantContext({ tenantId: foreign.id, actorUserId: "root" }), { tenantId: foreign.id, identityId: "i12", displayName: "foreign svc" });
  await w.connections.save({ id: "cx1", tenantId: w.tenant.id, organizationId: w.org.id, channel: "whatsapp", accountId: "PHONE-ID-1", serviceUserId: foreignUser.id, status: "active" });
  await assert.rejects(() => w.intake.receive(w.msg("f1", "5511900000000")), NotFoundError);
  assert.equal((await w.care.demands.listInTenant(w.tenant.id)).length, 0);
  assert.ok(w.audit.snapshot().some(a => a.action === "demand.receive.denied" && (a.metadata as any)?.reason === "service-user-outside-tenant"));
});
