# Persistence: Postgres with database-enforced tenant isolation (Etapa 4)

Project: Supabase `Tysvora` (region `sa-east-1`, separate from Ilê Conecta). Schema `heal`; migrations in `db/migrations` (applied in order; 0001-0005 are live).

## How isolation works (defense in depth)
1. **Application**: tenant-scoped repository methods (`getInTenant`, `listInTenant`, `countInTenant`) always carry the tenant.
2. **Database**: every table has `tenant_id`, `ENABLE` + `FORCE ROW LEVEL SECURITY`; policies compare `tenant_id` to `app.tenant_id`, which the adapter sets (transaction-local) before every statement. A query that forgets its tenant filter still only sees the current tenant's rows.
3. **Schema**: composite foreign keys `(tenant_id, x_id)` make a cross-tenant reference impossible even for a buggy writer; partial unique indexes back up de-duplication (one open pendency per key, one active enrollment per subject/program).
4. **Role**: the application runs as `tysvora_app` (NOLOGIN, NOBYPASSRLS, no DDL, no DELETE). The Data API roles `anon`/`authenticated` have no access to the schema.
5. **History**: `audit_log` is append-only (no UPDATE/DELETE/TRUNCATE; trigger + missing privileges); `domain_events` is a transactional outbox (never deleted).

Platform mode (`app.platform = 'on'`) exists only for the few unscoped operations (resolving a role or a user's assignments before the tenant is known, writing platform-catalog roles and plans); it can READ across tenants where listed in the policies but cannot write tenant data.

## Concurrency and cost
- A unit of work is one database transaction. Writers of one tenant are serialized with a per-tenant advisory lock (limit checks, quotas and de-duplication are race-free); tenants never block each other.
- Plans, per-tenant overrides and the usage ledger live in `plans`, `tenant_entitlements`, `usage_ledger` (configuration, not code; writes to plans/entitlements are platform-only).

## Running the tests against a database
`TYSVORA_TEST_DATABASE_URL=postgres://... npm test` (the suite skips the 11 Postgres tests when it is unset; CI starts Postgres 17, creates `anon`/`authenticated`, applies the migrations and sets it). Locally: any Postgres, `db/apply-local.sh <url>`; the tests connect with `-c role=tysvora_app`, so RLS applies exactly as in production.

## Before going live (not done yet)
- Create a LOGIN role for the API (secret password, stored in the host's secret manager), `GRANT tysvora_app TO` it, connect through the pooler in transaction mode (settings are transaction-local, so this is safe).
- Row-level encryption/retention/backup policy for health data (LGPD) and the outbox relay are separate steps.
