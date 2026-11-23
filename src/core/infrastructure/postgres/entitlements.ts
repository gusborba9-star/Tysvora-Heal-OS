import { EntityId } from "../../../shared/ids.js";
import { EntitlementSource, PlanDefinition, TenantOverrides, UsageMeter, QuotaMetric } from "../../application/entitlements.js";
import { PostgresDatabase } from "./database.js";

/** Plans and per-tenant overrides stored in the database (configuration, not code). Writes are platform-only (RLS). */
export class PgEntitlementSource implements EntitlementSource {
  constructor(private readonly db: PostgresDatabase) {}
  async planFor(tenantId: EntityId): Promise<PlanDefinition | null> {
    const r = await this.db.withScope({ tenantId }, q => q.query(
      "select p.doc from heal.tenant_entitlements e join heal.plans p on p.id = e.plan_id where e.tenant_id = $1", [tenantId]));
    return r.rows[0] ? (r.rows[0].doc as PlanDefinition) : null;
  }
  async overridesFor(tenantId: EntityId): Promise<TenantOverrides> {
    const r = await this.db.withScope({ tenantId }, q => q.query("select overrides from heal.tenant_entitlements where tenant_id = $1", [tenantId]));
    return (r.rows[0]?.overrides ?? {}) as TenantOverrides;
  }
  async definePlan(plan: PlanDefinition): Promise<void> {
    await this.db.withScope({ platform: true }, q => q.query(
      "insert into heal.plans (id, doc) values ($1, $2) on conflict (id) do update set doc = excluded.doc, updated_at = now()", [plan.id, JSON.stringify(plan)]));
  }
  async assignPlan(tenantId: EntityId, planId: string, overrides: TenantOverrides = {}): Promise<void> {
    await this.db.withScope({ platform: true, tenantId }, q => q.query(
      "insert into heal.tenant_entitlements (tenant_id, plan_id, overrides) values ($1, $2, $3) on conflict (tenant_id) do update set plan_id = excluded.plan_id, overrides = excluded.overrides, updated_at = now()",
      [tenantId, planId, JSON.stringify(overrides)]));
  }
}

/** Per-tenant consumption ledger; increments are atomic in SQL and, inside the unit of work, serialized per tenant. */
export class PgUsageMeter implements UsageMeter {
  constructor(private readonly db: PostgresDatabase) {}
  async total(tenantId: EntityId, metric: QuotaMetric, period: string): Promise<number> {
    const r = await this.db.withScope({ tenantId }, q => q.query<{ total: string }>("select total::text from heal.usage_ledger where tenant_id = $1 and metric = $2 and period = $3", [tenantId, metric, period]));
    return Number(r.rows[0]?.total ?? 0);
  }
  async add(tenantId: EntityId, metric: QuotaMetric, period: string, quantity: number): Promise<void> {
    await this.db.withScope({ tenantId }, q => q.query(
      "insert into heal.usage_ledger (tenant_id, metric, period, total) values ($1, $2, $3, $4) on conflict (tenant_id, metric, period) do update set total = heal.usage_ledger.total + excluded.total, updated_at = now()",
      [tenantId, metric, period, quantity]));
  }
}
