import { EntityId, PLATFORM_SCOPE_ID } from "../../shared/ids.js";
import { createAuditEntry } from "../domain/audit.js";
import { createDomainEvent } from "../domain/event.js";
import { DomainInvariantError } from "../domain/errors.js";
import { EventPublisher, UnitOfWork } from "../contracts/core.js";
import { AuditSink, IdGenerator, Clock } from "../contracts/application.js";
import { ApplicationContext, ApplicationError, AuthorizationError, AuthorizationService } from "./shared.js";

export interface KernelDependencies {
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly authorization: AuthorizationService;
  readonly audit: AuditSink;
  readonly events: EventPublisher;
  readonly unitOfWork: UnitOfWork;
}

/** Cross-cutting rules shared by every application service: authorization, refusal auditing, tenancy and atomic commit. */
export class ApplicationKernel {
  constructor(private readonly d: KernelDependencies) {}

  auditTenantId(context: ApplicationContext): EntityId {
    return context.scope === "tenant" ? context.tenantId : PLATFORM_SCOPE_ID;
  }

  /** Records a refused attempt. Never lets an audit failure change the refusal itself. */
  private async auditRefusal(context: ApplicationContext, action: string, resource: string, resourceId: string | undefined, reason: string): Promise<void> {
    try {
      await this.d.audit.append(createAuditEntry({
        id: this.d.ids.next(), tenantId: this.auditTenantId(context), actorId: context.actorUserId,
        action: action + ".denied", resource, resourceId, timestamp: this.d.clock.now(),
        correlationId: context.correlationId, result: "failure", metadata: { reason }
      }));
    } catch { /* fail closed: the operation is refused whether or not the refusal could be recorded */ }
  }

  async refuse(context: ApplicationContext, action: string, resource: string, resourceId: string | undefined, reason: string, error: Error): Promise<never> {
    await this.auditRefusal(context, action, resource, resourceId, reason);
    throw error;
  }

  async authorize(context: ApplicationContext, action: string, resource: string, resourceId?: string, attributes?: Readonly<Record<string, unknown>>): Promise<void> {
    let allowed = false;
    let reason = "policy-denied";
    try {
      allowed = (await this.d.authorization.can({ actorUserId: context.actorUserId, action, resource, resourceId, context, attributes })) === true;
    } catch {
      reason = "policy-error";
    }
    if (!allowed) await this.refuse(context, action, resource, resourceId, reason, new AuthorizationError(action + " on " + resource + " is not authorized"));
  }

  tenantId(context: ApplicationContext): EntityId {
    if (context.scope !== "tenant") throw new ApplicationError("tenant context is required");
    return context.tenantId;
  }

  organizationId(context: ApplicationContext): EntityId {
    if (context.scope !== "tenant" || !context.organizationId) throw new ApplicationError("organization context is required");
    return context.organizationId;
  }

  async audit(context: ApplicationContext, tenantId: EntityId, action: string, resource: string, resourceId: EntityId): Promise<void> {
    await this.d.audit.append(createAuditEntry({
      id: this.d.ids.next(), tenantId, actorId: context.actorUserId, action, resource, resourceId,
      timestamp: this.d.clock.now(), correlationId: context.correlationId, result: "success"
    }));
  }

  async event(context: ApplicationContext, tenantId: EntityId, eventType: string, payload: unknown): Promise<void> {
    await this.d.events.publish(createDomainEvent({
      eventId: this.d.ids.next(), eventType, version: 1, occurredAt: this.d.clock.now(),
      tenantId, actorId: context.actorUserId, source: "heal-core.application",
      correlationId: context.correlationId, payload
    }));
  }

  /**
   * Saves, audits and publishes inside one unit of work: a failure in any step leaves no trace of the others.
   * `skipIf` runs inside the same serialized unit, so check-then-write decisions (e.g. de-duplication) are race-free.
   * `precondition` also runs inside it and may throw (e.g. plan limits), so limits cannot be raced past.
   * Returns false when the write was skipped.
   */
  async commit(context: ApplicationContext, tenantId: EntityId, spec: { save: () => Promise<void>; action: string; resource: string; resourceId: EntityId; eventType: string; payload: unknown; skipIf?: () => Promise<boolean>; precondition?: () => Promise<void> }): Promise<boolean> {
    return this.d.unitOfWork.run(async () => {
      if (spec.precondition) await spec.precondition();
      if (spec.skipIf && await spec.skipIf()) return false;
      await spec.save();
      await this.audit(context, tenantId, spec.action, spec.resource, spec.resourceId);
      await this.event(context, tenantId, spec.eventType, spec.payload);
      return true;
    }, { tenantId });
  }

  async requireTenancy(context: ApplicationContext, ok: boolean, action: string, resource: string, message: string): Promise<void> {
    if (!ok) await this.refuse(context, action, resource, undefined, "outside-tenancy", new DomainInvariantError(message));
  }

}
