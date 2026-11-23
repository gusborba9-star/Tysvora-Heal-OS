-- Plans, per-tenant entitlements and the usage ledger (cost control per client and per feature).

-- Plans are platform configuration: readable by the application, writable only in platform mode.
create table heal.plans (
  id text primary key check (id ~ '^[A-Za-z0-9][A-Za-z0-9._:@-]{0,127}$'),
  doc jsonb not null,
  updated_at timestamptz not null default now()
);

create table heal.tenant_entitlements (
  tenant_id text primary key references heal.tenants(id),
  plan_id text references heal.plans(id),
  overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table heal.usage_ledger (
  tenant_id text not null references heal.tenants(id),
  metric text not null,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  total bigint not null check (total >= 0),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, metric, period)
);

create index tenant_entitlements_plan_idx on heal.tenant_entitlements (plan_id);

alter table heal.plans enable row level security;
alter table heal.plans force row level security;
create policy plans_read on heal.plans for select to tysvora_app using (true);
create policy plans_write on heal.plans for insert to tysvora_app with check (heal.is_platform());
create policy plans_update on heal.plans for update to tysvora_app using (heal.is_platform()) with check (heal.is_platform());

do $$
declare t text;
begin
  foreach t in array array['tenant_entitlements','usage_ledger'] loop
    execute format('alter table heal.%I enable row level security', t);
    execute format('alter table heal.%I force row level security', t);
    execute format('create policy %I on heal.%I for select to tysvora_app using (tenant_id = heal.current_tenant() or heal.is_platform())', t || '_read', t);
  end loop;
end $$;
-- Entitlements (which plan a tenant is on) are changed by the platform only; usage is recorded within the tenant.
create policy tenant_entitlements_insert on heal.tenant_entitlements for insert to tysvora_app with check (heal.is_platform());
create policy tenant_entitlements_update on heal.tenant_entitlements for update to tysvora_app using (heal.is_platform()) with check (heal.is_platform());
create policy usage_ledger_insert on heal.usage_ledger for insert to tysvora_app with check (tenant_id = heal.current_tenant());
create policy usage_ledger_update on heal.usage_ledger for update to tysvora_app using (tenant_id = heal.current_tenant()) with check (tenant_id = heal.current_tenant());

grant select, insert, update on heal.plans, heal.tenant_entitlements, heal.usage_ledger to tysvora_app;
