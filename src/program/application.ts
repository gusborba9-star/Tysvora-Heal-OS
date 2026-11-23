import { EntityId } from "../shared/ids.js";
import { ApplicationKernel, KernelDependencies } from "../core/application/kernel.js";
import { ApplicationContext, NotFoundError } from "../core/application/shared.js";
import { DomainInvariantError } from "../core/domain/errors.js";
import { Subject, User } from "../core/domain/entities.js";
import {
  ProgramDefinition, ProgramEnrollment, ProgramFact, ContinuityRule, ContinuityPolicy, FactKind,
  createProgramDefinition, approveProgramDefinition, createProgramFact
} from "./domain.js";
import { Pendency, PendencyAction, createPendency, transitionPendency, isOpenState, isOverdue, priorityRank } from "./pendency.js";
import { ContinuityAssessment, assessContinuity } from "./sentinela.js";

export interface TenantStore<T extends { readonly id: string }> {
  getInTenant(tenantId: string, id: string): Promise<T | null>;
  listInTenant(tenantId: string): Promise<T[]>;
  save(entity: T): Promise<void>;
}
export interface ProgramApplicationDependencies extends KernelDependencies {
  readonly definitions: TenantStore<ProgramDefinition>;
  readonly enrollments: TenantStore<ProgramEnrollment>;
  readonly facts: TenantStore<ProgramFact>;
  readonly pendencies: TenantStore<Pendency>;
  readonly subjects: { getInTenant(tenantId: string, id: string): Promise<Subject | null> };
  readonly users: { getInTenant(tenantId: string, id: string): Promise<User | null> };
}

export interface CreateProgramCommand {
  readonly key: string; readonly name: string; readonly rules: readonly ContinuityRule[]; readonly continuity: ContinuityPolicy;
}
export interface RecordFactCommand {
  readonly enrollmentId: EntityId; readonly kind: FactKind; readonly occurredAt: string;
  readonly reference?: string; readonly dueAt?: string; readonly source: string;
}
export interface PendencyActionCommand { readonly pendencyId: EntityId; readonly action: PendencyAction; readonly assigneeUserId?: EntityId; readonly reason?: string; }
export interface EvaluationResult { readonly assessment: ContinuityAssessment; readonly pendency: Pendency | null; readonly created: boolean; }

/** Program Engine + Sentinela + Central de Pendências, all tenant- and organization-scoped. */
export class ProgramApplication {
  private readonly k: ApplicationKernel;
  constructor(private readonly d: ProgramApplicationDependencies) { this.k = new ApplicationKernel(d); }

  /** Acting scope: always a tenant context with an organization; every record must belong to that organization. */
  private scope(context: ApplicationContext): { tenantId: EntityId; organizationId: EntityId } {
    return { tenantId: this.k.tenantId(context), organizationId: this.k.organizationId(context) };
  }

  private async inOrganization<T extends { organizationId: string }>(context: ApplicationContext, action: string, resource: string, id: string, entity: T | null): Promise<T> {
    const { organizationId } = this.scope(context);
    if (!entity) throw new NotFoundError(resource, id);
    if (entity.organizationId !== organizationId) {
      await this.k.refuse(context, action, resource, id, "outside-organization", new NotFoundError(resource, id));
    }
    return entity;
  }

  // ----- Program definitions -----

  async createProgram(context: ApplicationContext, command: CreateProgramCommand, version = 1): Promise<ProgramDefinition> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "program.create", "program");
    const entity = createProgramDefinition({ id: this.d.ids.next(), tenantId, organizationId, key: command.key, version, name: command.name, rules: command.rules, continuity: command.continuity, createdBy: context.actorUserId });
    const existing = (await this.d.definitions.listInTenant(tenantId)).filter(x => x.organizationId === organizationId && x.key === entity.key);
    if (existing.some(x => x.version === entity.version)) throw new DomainInvariantError("program key and version already exist");
    await this.k.commit(context, tenantId, { save: () => this.d.definitions.save(entity), action: "program.created", resource: "program", resourceId: entity.id, eventType: "program.created", payload: { programId: entity.id, key: entity.key, version: entity.version } });
    return entity;
  }

  /** Four-eyes: the approver must be a different actor than the author. */
  async approveProgram(context: ApplicationContext, programId: EntityId): Promise<ProgramDefinition> {
    const { tenantId } = this.scope(context);
    await this.k.authorize(context, "program.approve", "program", programId);
    const def = await this.inOrganization(context, "program.approve", "program", programId, await this.d.definitions.getInTenant(tenantId, programId));
    if (!context.actorUserId) throw new DomainInvariantError("approval requires an identified actor");
    const approved = approveProgramDefinition(def, context.actorUserId, this.d.clock.now());
    await this.k.commit(context, tenantId, { save: () => this.d.definitions.save(approved), action: "program.approved", resource: "program", resourceId: approved.id, eventType: "program.approved", payload: { programId: approved.id, version: approved.version } });
    return approved;
  }

  private async latestApproved(tenantId: EntityId, organizationId: EntityId, key: string): Promise<ProgramDefinition | null> {
    const all = (await this.d.definitions.listInTenant(tenantId)).filter(x => x.organizationId === organizationId && x.key === key && x.status === "approved");
    return all.sort((a, b) => b.version - a.version)[0] ?? null;
  }

  // ----- Enrollment and facts -----

  /** Pins the enrollment to the approved version at enrollment time: later versions never rewrite it. */
  async enroll(context: ApplicationContext, command: { subjectId: EntityId; programKey: string }): Promise<ProgramEnrollment> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "program.enroll", "enrollment", command.subjectId);
    const subject = await this.inOrganization(context, "program.enroll", "subject", command.subjectId, await this.d.subjects.getInTenant(tenantId, command.subjectId));
    const def = await this.latestApproved(tenantId, organizationId, command.programKey);
    if (!def) throw new NotFoundError("approved program", command.programKey);
    const active = (await this.d.enrollments.listInTenant(tenantId)).find(e => e.subjectId === subject.id && e.programKey === def.key && e.status === "active");
    if (active) throw new DomainInvariantError("subject is already actively enrolled in this program");
    const entity: ProgramEnrollment = { id: this.d.ids.next(), tenantId, organizationId, subjectId: subject.id, programKey: def.key, definitionId: def.id, programVersion: def.version, status: "active", enrolledAt: this.d.clock.now() };
    await this.k.commit(context, tenantId, { save: () => this.d.enrollments.save(entity), action: "enrollment.created", resource: "enrollment", resourceId: entity.id, eventType: "enrollment.created", payload: { enrollmentId: entity.id, programVersion: entity.programVersion } });
    return entity;
  }

  private async activeEnrollment(context: ApplicationContext, action: string, id: EntityId): Promise<ProgramEnrollment> {
    const { tenantId } = this.scope(context);
    const enrollment = await this.inOrganization(context, action, "enrollment", id, await this.d.enrollments.getInTenant(tenantId, id));
    if (enrollment.status !== "active") throw new DomainInvariantError("enrollment is not active");
    return enrollment;
  }

  async recordFact(context: ApplicationContext, command: RecordFactCommand): Promise<ProgramFact> {
    const { tenantId } = this.scope(context);
    await this.k.authorize(context, "fact.record", "fact", command.enrollmentId);
    const enrollment = await this.activeEnrollment(context, "fact.record", command.enrollmentId);
    const fact = createProgramFact({ id: this.d.ids.next(), tenantId, enrollmentId: enrollment.id, kind: command.kind, occurredAt: command.occurredAt, reference: command.reference, dueAt: command.dueAt, source: command.source }, this.d.clock.now());
    await this.k.commit(context, tenantId, { save: () => this.d.facts.save(fact), action: "fact.recorded", resource: "fact", resourceId: fact.id, eventType: "fact.recorded", payload: { factId: fact.id, kind: fact.kind, enrollmentId: enrollment.id } });
    return fact;
  }

  // ----- Sentinela: continuity evaluation that may open a pendency -----

  /** Idempotent: while a continuity pendency is open for the enrollment, re-evaluating never creates a second one. */
  async evaluateContinuity(context: ApplicationContext, enrollmentId: EntityId): Promise<EvaluationResult> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "sentinela.evaluate", "enrollment", enrollmentId);
    const enrollment = await this.activeEnrollment(context, "sentinela.evaluate", enrollmentId);
    const def = await this.d.definitions.getInTenant(tenantId, enrollment.definitionId);
    if (!def) throw new NotFoundError("program", enrollment.definitionId);
    const facts = (await this.d.facts.listInTenant(tenantId)).filter(f => f.enrollmentId === enrollment.id);
    const now = this.d.clock.now();
    const assessment = assessContinuity(def, enrollment, facts, now);
    if (!assessment.continuityBreak) return { assessment, pendency: null, created: false };

    const dedupKey = "continuity:" + enrollment.id;
    const findOpen = async () => (await this.d.pendencies.listInTenant(tenantId)).find(p => p.dedupKey === dedupKey && isOpenState(p.state));

    const policy = def.continuity.pendency;
    const pendency = createPendency({
      id: this.d.ids.next(), tenantId, organizationId, subjectId: enrollment.subjectId, enrollmentId: enrollment.id,
      category: "continuity", title: "Continuity of care interrupted", priority: policy.priority,
      priorityReason: "Program continuity rules fired; priority set by the program policy, not by clinical triage",
      queue: policy.queue, dueAt: new Date(Date.parse(now) + policy.slaHours * 3600_000).toISOString(),
      nextAction: "Contact the person, understand the barrier and re-engage or document the reason", dedupKey,
      origin: { source: "sentinela", ruleSetVersion: assessment.ruleSetVersion, evidenceFactIds: assessment.signals.flatMap(s => s.evidenceFactIds), explanation: assessment.explanation + " " + assessment.limitations }
    }, now, context.actorUserId);
    const created = await this.k.commit(context, tenantId, {
      save: () => this.d.pendencies.save(pendency), action: "pendency.created", resource: "pendency", resourceId: pendency.id,
      eventType: "pendency.created", payload: { pendencyId: pendency.id, category: pendency.category, priority: pendency.priority },
      skipIf: async () => (await findOpen()) !== undefined
    });
    return created ? { assessment, pendency, created: true } : { assessment, pendency: (await findOpen()) ?? null, created: false };
  }

  // ----- Central de Pendências -----

  async actOnPendency(context: ApplicationContext, command: PendencyActionCommand): Promise<Pendency> {
    const { tenantId } = this.scope(context);
    const action = "pendency." + command.action;
    await this.k.authorize(context, action, "pendency", command.pendencyId, { assigneeUserId: command.assigneeUserId });
    const current = await this.inOrganization(context, action, "pendency", command.pendencyId, await this.d.pendencies.getInTenant(tenantId, command.pendencyId));
    if (command.assigneeUserId) {
      const assignee = await this.d.users.getInTenant(tenantId, command.assigneeUserId);
      if (!assignee) throw new NotFoundError("user", command.assigneeUserId);
    }
    if (command.action === "accept" && current.assigneeUserId !== context.actorUserId) {
      await this.k.refuse(context, action, "pendency", current.id, "not-the-assignee", new DomainInvariantError("only the assignee can accept a pendency"));
    }
    const next = transitionPendency(current, { action: command.action, at: this.d.clock.now(), actorId: context.actorUserId, assigneeUserId: command.assigneeUserId, reason: command.reason });
    await this.k.commit(context, tenantId, { save: () => this.d.pendencies.save(next), action: "pendency." + command.action, resource: "pendency", resourceId: next.id, eventType: "pendency." + command.action, payload: { pendencyId: next.id, state: next.state } });
    return next;
  }

  /** Open pendencies of the acting organization, most urgent first; overdue ones are flagged. */
  async listPendencies(context: ApplicationContext, filter: { queue?: string; assigneeUserId?: EntityId } = {}): Promise<readonly (Pendency & { readonly overdue: boolean })[]> {
    const { tenantId, organizationId } = this.scope(context);
    await this.k.authorize(context, "pendency.list", "pendency");
    const now = this.d.clock.now();
    return (await this.d.pendencies.listInTenant(tenantId))
      .filter(p => p.organizationId === organizationId && isOpenState(p.state) && (!filter.queue || p.queue === filter.queue) && (!filter.assigneeUserId || p.assigneeUserId === filter.assigneeUserId))
      .map(p => ({ ...p, overdue: isOverdue(p, now) }))
      .sort((a, b) => Number(b.overdue) - Number(a.overdue) || priorityRank(b.priority) - priorityRank(a.priority) || Date.parse(a.dueAt) - Date.parse(b.dueAt));
  }
}
