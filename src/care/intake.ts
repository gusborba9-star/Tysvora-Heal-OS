import { EntityId } from "../shared/ids.js";
import { ApplicationKernel, KernelDependencies } from "../core/application/kernel.js";
import { ApplicationContext, NotFoundError, tenantContext } from "../core/application/shared.js";
import { EntitlementGate, UsageService } from "../core/application/entitlements.js";
import { DomainInvariantError } from "../core/domain/errors.js";
import { Subject } from "../core/domain/entities.js";
import { ProgramEnrollment, FactKind } from "../program/domain.js";
import { ProgramApplication, TenantStore } from "../program/application.js";
import {
  Channel, ContactPurpose, ConsentRecord, ContactBinding, LegalBasis, createConsent, revokeConsent, createContactBinding, contactKey
} from "./consent.js";
import { PatientDemand, createDemand } from "./demand.js";
import { ChannelProvider, ChannelConnectionRepository, InboundMessage } from "./channel.js";

export interface IntakeDependencies extends KernelDependencies {
  readonly entitlements: EntitlementGate;
  readonly consents: TenantStore<ConsentRecord>;
  readonly bindings: TenantStore<ContactBinding>;
  readonly demands: TenantStore<PatientDemand>;
  readonly facts: TenantStore<{ readonly id: string; readonly enrollmentId: string; readonly reference?: string; readonly kind: string }>;
  readonly enrollments: TenantStore<ProgramEnrollment>;
  readonly subjects: { getInTenant(tenantId: string, id: string): Promise<Subject | null> };
  readonly users: { getInTenant(tenantId: string, id: string): Promise<{ readonly id: string } | null> };
  readonly connections: ChannelConnectionRepository;
  readonly programs: ProgramApplication;
  readonly usage: UsageService;
}

export type InboundOutcome =
  | { readonly status: "stored"; readonly demand: PatientDemand; readonly duplicate: boolean }
  | { readonly status: "ignored"; readonly reason: "unknown-account" | "connection-disabled" };

/** Consent, contact bindings and patient demand intake. Inbound messages are always kept; outbound contact needs consent. */
export class IntakeApplication {
  private readonly k: ApplicationKernel;
  constructor(private readonly d: IntakeDependencies) { this.k = new ApplicationKernel(d); }

  private scope(context: ApplicationContext) { return { tenantId: this.k.tenantId(context), organizationId: this.k.organizationId(context) }; }

  private async subjectInOrganization(context: ApplicationContext, action: string, subjectId: EntityId): Promise<Subject> {
    const { tenantId, organizationId } = this.scope(context);
    const subject = await this.d.subjects.getInTenant(tenantId, subjectId);
    if (!subject) throw new NotFoundError("subject", subjectId);
    if (subject.organizationId !== organizationId) await this.k.refuse(context, action, "subject", subjectId, "outside-organization", new NotFoundError("subject", subjectId));
    return subject;
  }

  // ----- Consent -----

  /** Idempotent: granting what is already granted returns the existing record. */
  async grantConsent(context: ApplicationContext, command: { subjectId: EntityId; channel: Channel; purpose: ContactPurpose; legalBasis: LegalBasis; evidence: string }): Promise<ConsentRecord> {
    const { tenantId } = this.scope(context);
    await this.k.authorize(context, "consent.record", "consent", command.subjectId);
    await this.subjectInOrganization(context, "consent.record", command.subjectId);
    const entity = createConsent({ id: this.d.ids.next(), tenantId, subjectId: command.subjectId, channel: command.channel, purpose: command.purpose, legalBasis: command.legalBasis, grantedAt: this.d.clock.now(), grantedBy: context.actorUserId, evidence: command.evidence });
    const findGranted = async () => (await this.d.consents.listInTenant(tenantId)).find(c => c.subjectId === entity.subjectId && c.channel === entity.channel && c.purpose === entity.purpose && c.status === "granted");
    const created = await this.k.commit(context, tenantId, { save: () => this.d.consents.save(entity), action: "consent.granted", resource: "consent", resourceId: entity.id, eventType: "consent.granted", payload: { consentId: entity.id, channel: entity.channel, purpose: entity.purpose }, skipIf: async () => (await findGranted()) !== undefined });
    return created ? entity : (await findGranted())!;
  }

  async revokeConsent(context: ApplicationContext, consentId: EntityId): Promise<ConsentRecord> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "consent.revoke", "consent", consentId);
    const current = await this.d.consents.getInTenant(tenantId, consentId);
    if (!current) throw new NotFoundError("consent", consentId);
    const subject = await this.d.subjects.getInTenant(tenantId, current.subjectId);
    if (!subject || subject.organizationId !== organizationId) await this.k.refuse(context, "consent.revoke", "consent", consentId, "outside-organization", new NotFoundError("consent", consentId));
    const next = revokeConsent(current, this.d.clock.now(), context.actorUserId);
    await this.k.commit(context, tenantId, { save: () => this.d.consents.save(next), action: "consent.revoked", resource: "consent", resourceId: next.id, eventType: "consent.revoked", payload: { consentId: next.id, channel: next.channel, purpose: next.purpose } });
    return next;
  }

  /** Outbound gate: may the institution contact this person on this channel for this purpose right now? Revocation takes effect immediately. */
  async canContact(tenantId: EntityId, subjectId: EntityId, channel: Channel, purpose: ContactPurpose): Promise<boolean> {
    return (await this.d.consents.listInTenant(tenantId)).some(c => c.subjectId === subjectId && c.channel === channel && c.purpose === purpose && c.status === "granted");
  }

  // ----- Contact bindings -----

  async bindContact(context: ApplicationContext, command: { subjectId: EntityId; channel: Channel; address: string; verification: "none" | "staff" | "code" }): Promise<ContactBinding> {
    const { tenantId } = this.scope(context);
    await this.k.authorize(context, "contact.bind", "contact", command.subjectId);
    await this.subjectInOrganization(context, "contact.bind", command.subjectId);
    const entity = createContactBinding({ id: this.d.ids.next(), tenantId, subjectId: command.subjectId, channel: command.channel, address: command.address, verification: command.verification, createdAt: this.d.clock.now(), createdBy: context.actorUserId });
    const findSame = async () => (await this.d.bindings.listInTenant(tenantId)).find(b => b.status === "active" && b.subjectId === entity.subjectId && b.channel === entity.channel && b.addressKey === entity.addressKey);
    const created = await this.k.commit(context, tenantId, { save: () => this.d.bindings.save(entity), action: "contact.bound", resource: "contact", resourceId: entity.id, eventType: "contact.bound", payload: { bindingId: entity.id, channel: entity.channel }, skipIf: async () => (await findSame()) !== undefined });
    return created ? entity : (await findSame())!;
  }

  // ----- Inbound -----

  /**
   * Webhook entry point: authenticity first, then every message is stored once. Never throws for a message that fails to match:
   * the person wrote to us, so it is kept for a human. Returns one outcome per message so the caller can answer the provider.
   */
  async receiveWebhook(provider: ChannelProvider, rawBody: string, headers: Readonly<Record<string, string | undefined>>): Promise<readonly InboundOutcome[] | "unauthentic"> {
    if (!provider.verify(rawBody, headers)) return "unauthentic";
    const outcomes: InboundOutcome[] = [];
    for (const message of provider.parse(rawBody)) outcomes.push(await this.receive(message));
    return outcomes;
  }

  async receive(message: InboundMessage): Promise<InboundOutcome> {
    const connection = await this.d.connections.findByAccount(message.channel, message.accountId);
    if (!connection) return { status: "ignored", reason: "unknown-account" };
    if (connection.status !== "active") return { status: "ignored", reason: "connection-disabled" };
    const { tenantId, organizationId } = connection;
    const context = tenantContext({ tenantId, organizationId, actorUserId: connection.serviceUserId });
    // The integration identity must belong to the connection's own tenant (defense in depth next to the database's composite key).
    if (!(await this.d.users.getInTenant(tenantId, connection.serviceUserId))) {
      await this.k.refuse(context, "demand.receive", "demand", undefined, "service-user-outside-tenant", new NotFoundError("user", connection.serviceUserId));
    }
    await this.k.authorize(context, "demand.receive", "demand");

    const now = this.d.clock.now();
    const receivedAt = Date.parse(message.receivedAt) > Date.parse(now) ? now : message.receivedAt;
    const key = contactKey(message.channel, message.from);
    const matches = (await this.d.bindings.listInTenant(tenantId)).filter(b => b.status === "active" && b.channel === message.channel && b.addressKey === key && b.verification !== "none");
    // A shared phone (family) matches several people: never guess, a human decides.
    const subjectIds = [...new Set(matches.map(b => b.subjectId))];
    const subjectId = subjectIds.length === 1 ? subjectIds[0] : undefined;

    const demand = createDemand({ id: this.d.ids.next(), tenantId, organizationId, subjectId, channel: message.channel, externalId: message.externalId, fromAddress: message.from, kind: message.kind, text: message.text, receivedAt, linkedBy: subjectId ? "auto" : undefined });
    const findExisting = async () => (await this.d.demands.listInTenant(tenantId)).find(x => x.channel === demand.channel && x.externalId === demand.externalId);
    const created = await this.k.commit(context, tenantId, { save: () => this.d.demands.save(demand), action: "demand.received", resource: "demand", resourceId: demand.id, eventType: "demand.received", payload: { demandId: demand.id, channel: demand.channel, linked: subjectId !== undefined }, skipIf: async () => (await findExisting()) !== undefined });
    const stored = created ? demand : (await findExisting())!;
    // Inbound volume is metered for cost visibility but never refused: a person's message is not dropped for a quota.
    if (created) await this.d.usage.record(tenantId, "whatsapp.messages", 1).catch(() => undefined);
    // Re-run on duplicates too: if a previous attempt stopped after storing the message, the facts are completed now (idempotent).
    if (stored.subjectId) await this.ensureFacts(context, stored, "demand.opened");
    return { status: "stored", demand: stored, duplicate: !created };
  }

  /** Records `kind` for the demand on every active enrollment of its person, once each. */
  private async ensureFacts(context: ApplicationContext, demand: PatientDemand, kind: FactKind & ("demand.opened" | "demand.answered")): Promise<void> {
    const { tenantId } = this.scope(context);
    const enrollments = (await this.d.enrollments.listInTenant(tenantId)).filter(e => e.subjectId === demand.subjectId && e.status === "active");
    if (enrollments.length === 0) return;
    for (const e of enrollments) {
      const occurredAt = kind === "demand.opened" ? demand.receivedAt : (demand.answeredAt ?? this.d.clock.now());
      await this.d.programs.recordFactForIntake(context, { enrollmentId: e.id, kind, occurredAt, reference: demand.id, source: demand.channel });
    }
  }

  // ----- Staff work on demands -----

  async listDemands(context: ApplicationContext, filter: { onlyUnlinked?: boolean; onlyOpen?: boolean } = {}): Promise<readonly PatientDemand[]> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "demand.list", "demand");
    return (await this.d.demands.listInTenant(tenantId))
      .filter(x => x.organizationId === organizationId && (!filter.onlyUnlinked || !x.subjectId) && (!filter.onlyOpen || x.status === "new"))
      .sort((a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt));
  }

  /** Human triage of a message that could not be matched automatically. */
  async linkDemand(context: ApplicationContext, command: { demandId: EntityId; subjectId: EntityId }): Promise<PatientDemand> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "demand.triage", "demand", command.demandId);
    const current = await this.d.demands.getInTenant(tenantId, command.demandId);
    if (!current || current.organizationId !== organizationId) throw new NotFoundError("demand", command.demandId);
    if (current.subjectId) throw new DomainInvariantError("demand is already linked to a person");
    await this.subjectInOrganization(context, "demand.triage", command.subjectId);
    const next: PatientDemand = { ...current, subjectId: command.subjectId, linkedBy: context.actorUserId };
    await this.k.commit(context, tenantId, { save: () => this.d.demands.save(next), action: "demand.linked", resource: "demand", resourceId: next.id, eventType: "demand.linked", payload: { demandId: next.id } });
    await this.ensureFacts(context, next, "demand.opened");
    return next;
  }

  /** Marks a demand answered; clears the unanswered-demand signal for the person's programs. */
  async answerDemand(context: ApplicationContext, demandId: EntityId): Promise<PatientDemand> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "demand.answer", "demand", demandId);
    const current = await this.d.demands.getInTenant(tenantId, demandId);
    if (!current || current.organizationId !== organizationId) throw new NotFoundError("demand", demandId);
    if (!current.subjectId) throw new DomainInvariantError("link the demand to a person before answering it");
    // Already answered: still make sure its fact exists (a previous attempt may have stopped between the two writes).
    if (current.status === "answered") { await this.ensureFacts(context, current, "demand.answered"); return current; }
    const next: PatientDemand = { ...current, status: "answered", answeredAt: this.d.clock.now(), answeredBy: context.actorUserId };
    await this.k.commit(context, tenantId, { save: () => this.d.demands.save(next), action: "demand.answered", resource: "demand", resourceId: next.id, eventType: "demand.answered", payload: { demandId: next.id } });
    await this.ensureFacts(context, next, "demand.answered");
    return next;
  }
}
