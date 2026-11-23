import { AsyncLocalStorage } from "node:async_hooks";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import { UnitOfWork } from "../../contracts/core.js";

/** Which rows a statement may touch. Maps to the `app.tenant_id` / `app.platform` settings the RLS policies read. */
export type DbScope = { readonly tenantId: string; readonly platform?: false } | { readonly platform: true; readonly tenantId?: string };

export interface Querier { query<R extends QueryResultRow = QueryResultRow>(text: string, values?: readonly unknown[]): Promise<{ rows: R[]; rowCount: number }>; }

/**
 * Executes every statement inside a transaction with its tenant scope set (transaction-local), so row level security in
 * Postgres - not only the query text - decides what is visible. Inside a unit of work all statements share one transaction.
 */
export class PostgresDatabase {
  private readonly ambient = new AsyncLocalStorage<PoolClient>();
  constructor(private readonly pool: Pool) {}

  private async scoped<T>(client: PoolClient, scope: DbScope, fn: (q: Querier) => Promise<T>): Promise<T> {
    await client.query("select set_config('app.tenant_id', $1, true), set_config('app.platform', $2, true)", [scope.tenantId ?? "", scope.platform ? "on" : ""]);
    return fn({ query: async (text, values) => { const r = await client.query(text, values as unknown[] | undefined); return { rows: r.rows, rowCount: r.rowCount ?? 0 }; } });
  }

  async withScope<T>(scope: DbScope, fn: (q: Querier) => Promise<T>): Promise<T> {
    const inUnit = this.ambient.getStore();
    if (inUnit) return this.scoped(inUnit, scope, fn);
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await this.scoped(client, scope, fn);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /** Runs `work` in one transaction; nested calls join the outer one. */
  async transaction<T>(work: () => Promise<T>, lockKey?: string): Promise<T> {
    if (this.ambient.getStore()) return work();
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      // Writers of one tenant are serialized (race-free limits, de-duplication, quotas); other tenants are unaffected.
      if (lockKey !== undefined) await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [lockKey]);
      const result = await this.ambient.run(client, work);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}

/** Atomic boundary backed by a real database transaction (state, audit and events commit or roll back together). */
export class PostgresUnitOfWork implements UnitOfWork {
  constructor(private readonly db: PostgresDatabase) {}
  run<T>(work: () => Promise<T>, options?: { readonly tenantId?: string }): Promise<T> {
    return this.db.transaction(work, options?.tenantId === undefined ? undefined : "tenant:" + options.tenantId);
  }
}
