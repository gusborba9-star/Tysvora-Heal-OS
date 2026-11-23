import { EntityId } from "../../shared/ids.js";
import { ApplicationError } from "./shared.js";
import { Snapshottable } from "../infrastructure/in-memory-repositories.js";
import { UnitOfWork } from "../contracts/core.js";

/** Count limits: how many of something a tenant may hold at once. */
export type CountMetric = "organizations" | "units" | "professionals" | "subjects" | "enrollments";
/** Consumption quotas: how much of a metered, costly resource a tenant may use per calendar month (UTC). */
export type QuotaMetric = "whatsapp.messages" | "sms.messages" | "email.messages" | "ai.calls" | "storage.mb";

export interface PlanDefinition {
  readonly id: string;
  readonly limits: Readonly<Partial<Record<CountMetric, number>>>;
  readonly quotas: Readonly<Partial<Record<QuotaMetric, number>>>;
  /** Module/feature keys active in this plan, e.g. "program-engine", "sentinela", "ai". Inactive features cost nothing and are invisible. */
  readonly features: readonly string[];
}
export interface TenantOverrides {
  readonly limits?: Readonly<Partial<Record<CountMetric, number>>>;
  readonly quotas?: Readonly<Partial<Record<QuotaMetric, number>>>;
  readonly enableFeatures?: readonly string[];
  readonly disableFeatures?: readonly string[];
}
/** Where plans and per-tenant overrides come from (billing system, database or configuration). */
export interface EntitlementSource {
  planFor(tenantId: EntityId): Promise<PlanDefinition | null>;
  overridesFor(tenantId: EntityId): Promise<TenantOverrides>;
}

export class EntitlementError extends ApplicationError {
  constructor(readonly code: "no-plan" | "limit-reached" | "quota-exceeded" | "feature-disabled", message: string) { super(message); this.name = "EntitlementError"; }
}

export interface EntitlementGate {
  assertCanAdd(tenantId: EntityId, metric: CountMetric, currentCount: number, adding?: number): Promise<void>;
  requireFeature(tenantId: EntityId, feature: string): Promise<void>;
  quotaFor(tenantId: EntityId, metric: QuotaMetric): Promise<number | undefined>;
}

/** Fails closed: a tenant without a plan can neither create billable records nor use features. */
export class EntitlementService implements EntitlementGate {
  constructor(private readonly source: EntitlementSource) {}

  async assertCanAdd(tenantId: EntityId, metric: CountMetric, currentCount: number, adding = 1): Promise<void> {
    const plan = await this.source.planFor(tenantId);
    if (!plan) throw new EntitlementError("no-plan", "tenant has no active plan");
    const limit = (await this.source.overridesFor(tenantId)).limits?.[metric] ?? plan.limits[metric];
    if (limit !== undefined && currentCount + adding > limit) throw new EntitlementError("limit-reached", `plan limit reached for ${metric} (${limit})`);
  }

  async requireFeature(tenantId: EntityId, feature: string): Promise<void> {
    const plan = await this.source.planFor(tenantId);
    if (!plan) throw new EntitlementError("no-plan", "tenant has no active plan");
    const o = await this.source.overridesFor(tenantId);
    const active = (o.disableFeatures ?? []).includes(feature) ? false : (o.enableFeatures ?? []).includes(feature) || plan.features.includes(feature);
    if (!active) throw new EntitlementError("feature-disabled", `feature not available in the current plan: ${feature}`);
  }

  async quotaFor(tenantId: EntityId, metric: QuotaMetric): Promise<number | undefined> {
    const plan = await this.source.planFor(tenantId);
    if (!plan) throw new EntitlementError("no-plan", "tenant has no active plan");
    return (await this.source.overridesFor(tenantId)).quotas?.[metric] ?? plan.quotas[metric];
  }
}

/** Development and test only: everything allowed. Production must inject EntitlementService backed by real plans. */
export class UnlimitedEntitlementsForTestsOnly implements EntitlementGate {
  async assertCanAdd(): Promise<void> {}
  async requireFeature(): Promise<void> {}
  async quotaFor(): Promise<number | undefined> { return undefined; }
}

// ---------- Metering: per-tenant, per-feature consumption ledger ----------

export interface UsageMeter {
  total(tenantId: EntityId, metric: QuotaMetric, period: string): Promise<number>;
  add(tenantId: EntityId, metric: QuotaMetric, period: string, quantity: number): Promise<void>;
}
export class InMemoryUsageMeter implements UsageMeter, Snapshottable {
  private totals = new Map<string, number>();
  private key(t: string, m: string, p: string) { return `${t}|${m}|${p}`; }
  async total(t: EntityId, m: QuotaMetric, p: string) { return this.totals.get(this.key(t, m, p)) ?? 0; }
  async add(t: EntityId, m: QuotaMetric, p: string, q: number) { this.totals.set(this.key(t, m, p), (await this.total(t, m, p)) + q); }
  captureState(): unknown { return new Map(this.totals); }
  restoreState(state: unknown): void { this.totals = new Map(state as Map<string, number>); }
}

export function usagePeriod(isoNow: string): string { return isoNow.slice(0, 7); }

/** Checks the monthly quota and records consumption in one serialized step, so concurrent callers cannot overshoot it. */
export class UsageService {
  constructor(private readonly d: { readonly entitlements: EntitlementGate; readonly meter: UsageMeter; readonly unitOfWork: UnitOfWork; readonly clock: { now(): string } }) {}

  async consume(tenantId: EntityId, metric: QuotaMetric, quantity: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) throw new ApplicationError("usage quantity must be a positive integer");
    await this.d.unitOfWork.run(async () => {
      const quota = await this.d.entitlements.quotaFor(tenantId, metric);
      const period = usagePeriod(this.d.clock.now());
      if (quota !== undefined && (await this.d.meter.total(tenantId, metric, period)) + quantity > quota) {
        throw new EntitlementError("quota-exceeded", `monthly quota exceeded for ${metric} (${quota})`);
      }
      await this.d.meter.add(tenantId, metric, period, quantity);
    }, { tenantId });
  }

  async usage(tenantId: EntityId, metric: QuotaMetric): Promise<{ used: number; quota?: number }> {
    const quota = await this.d.entitlements.quotaFor(tenantId, metric);
    return { used: await this.d.meter.total(tenantId, metric, usagePeriod(this.d.clock.now())), quota };
  }
}
