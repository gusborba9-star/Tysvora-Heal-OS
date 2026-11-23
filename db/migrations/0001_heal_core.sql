-- Tysvora Heal OS - core schema (multi-tenant, isolation enforced by the database itself).
-- Every tenant-owned table carries tenant_id, has ROW LEVEL SECURITY enabled AND forced, and composite foreign keys
-- that make a cross-tenant reference impossible even for a buggy writer.

create schema if not exists heal;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'tysvora_app') then
    -- The application role: no login, no BYPASSRLS, no DDL. A login role is granted membership at deploy time.
    create role tysvora_app nologin nobypassrls;
  end if;
end $$;

revoke all on schema heal from public;
grant usage on schema heal to tysvora_app;

-- Session settings the adapter sets (transaction-local) before every statement.
create or replace function heal.current_tenant() returns text language sql stable as
$$ select nullif(current_setting('app.tenant_id', true), '') $$;
create or replace function heal.is_platform() returns boolean language sql stable as
$$ select coalesce(current_setting('app.platform', true), '') = 'on' $$;

-- ---------- Tenancy ----------
create table heal.tenants (
  id text primary key check (id ~ '^[A-Za-z0-9][A-Za-z0-9._:@-]{0,127}$' and id <> 'platform.scope'),
  name text not null check (length(name) between 1 and 200),
  created_at timestamptz not null default now()
);

create table heal.organizations (
  id text primary key,
  tenant_id text not null references heal.tenants(id),
  name text not null check (length(name) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create table heal.units (
  id text primary key,
  tenant_id text not null,
  organization_id text not null,
  name text not null check (length(name) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id)
);

create table heal.users (
  id text primary key,
  tenant_id text not null references heal.tenants(id),
  identity_id text not null,
  display_name text not null check (length(display_name) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, identity_id)
);

create table heal.professionals (
  id text primary key,
  tenant_id text not null,
  user_id text not null,
  organization_id text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, user_id) references heal.users (tenant_id, id),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id)
);

create table heal.subjects (
  id text primary key,
  tenant_id text not null,
  organization_id text not null,
  display_name text not null check (length(display_name) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id)
);

-- ---------- Access ----------
-- tenant_id null = platform catalog role.
create table heal.roles (
  id text primary key,
  tenant_id text references heal.tenants(id),
  name text not null check (length(name) between 1 and 200),
  architectural_role text check (architectural_role in ('platform-admin','tenant-admin','municipal-management','unit-management','professional','patient-user','technical-operator')),
  created_at timestamptz not null default now()
);

-- tenant_id null = platform-level assignment. scope_key makes a role held at several scopes distinct rows.
create table heal.user_roles (
  user_id text not null,
  role_id text not null references heal.roles(id),
  scope_level text not null check (scope_level in ('platform','tenant','organization','unit')),
  tenant_id text references heal.tenants(id),
  organization_id text,
  unit_id text,
  scope_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id, scope_key),
  check ((scope_level = 'platform') = (tenant_id is null)),
  check (scope_level <> 'organization' or organization_id is not null),
  check (scope_level <> 'unit' or (organization_id is not null and unit_id is not null)),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id),
  foreign key (tenant_id, unit_id) references heal.units (tenant_id, id)
);
create index user_roles_user_idx on heal.user_roles (user_id);

-- ---------- Audit and events (append-only) ----------
-- tenant_id has no FK: platform-level entries use the reserved 'platform.scope' id, and history outlives tenants.
create table heal.audit_log (
  id text primary key,
  tenant_id text not null,
  actor_id text,
  action text not null,
  resource text not null,
  resource_id text,
  occurred_at timestamptz not null,
  correlation_id text,
  result text not null check (result in ('success','failure')),
  metadata jsonb
);
create index audit_log_tenant_time_idx on heal.audit_log (tenant_id, occurred_at desc);

create table heal.domain_events (
  event_id text primary key,
  tenant_id text not null,
  event_type text not null,
  version integer not null check (version >= 1),
  occurred_at timestamptz not null,
  actor_id text,
  source text not null,
  correlation_id text,
  payload jsonb not null,
  published_at timestamptz
);
create index domain_events_unpublished_idx on heal.domain_events (occurred_at) where published_at is null;
create index domain_events_tenant_time_idx on heal.domain_events (tenant_id, occurred_at desc);

create or replace function heal.forbid_mutation() returns trigger language plpgsql set search_path = '' as
$$ begin raise exception 'heal.% is append-only', tg_table_name using errcode = '42501'; end $$;
create trigger audit_log_append_only before update or delete or truncate on heal.audit_log
  for each statement execute function heal.forbid_mutation();
create trigger domain_events_no_delete before delete or truncate on heal.domain_events
  for each statement execute function heal.forbid_mutation();

-- ---------- Row level security ----------
do $$
declare t text;
begin
  -- Strictly tenant-owned tables: visible/writable only inside the current tenant (platform mode may READ).
  foreach t in array array['organizations','units','users','professionals','subjects','audit_log','domain_events'] loop
    execute format('alter table heal.%I enable row level security', t);
    execute format('alter table heal.%I force row level security', t);
    execute format('create policy %I on heal.%I for select to tysvora_app using (tenant_id = heal.current_tenant() or heal.is_platform())', t || '_read', t);
    execute format('create policy %I on heal.%I for insert to tysvora_app with check (tenant_id = heal.current_tenant())', t || '_insert', t);
  end loop;
  foreach t in array array['organizations','units','users','professionals','subjects'] loop
    execute format('create policy %I on heal.%I for update to tysvora_app using (tenant_id = heal.current_tenant()) with check (tenant_id = heal.current_tenant())', t || '_update', t);
  end loop;
end $$;

-- domain_events: the publisher may only stamp published_at (the outbox relay); never delete.
create policy domain_events_update on heal.domain_events for update to tysvora_app
  using (tenant_id = heal.current_tenant()) with check (tenant_id = heal.current_tenant());

-- tenants: a tenant sees and creates only itself; platform mode may read all.
alter table heal.tenants enable row level security;
alter table heal.tenants force row level security;
create policy tenants_read on heal.tenants for select to tysvora_app using (id = heal.current_tenant() or heal.is_platform());
create policy tenants_insert on heal.tenants for insert to tysvora_app with check (id = heal.current_tenant());
create policy tenants_update on heal.tenants for update to tysvora_app using (id = heal.current_tenant()) with check (id = heal.current_tenant());

-- roles / user_roles: tenant rows follow the tenant; NULL-tenant rows (platform catalog / platform assignments) are written in platform mode only.
do $$
declare t text;
begin
  foreach t in array array['roles','user_roles'] loop
    execute format('alter table heal.%I enable row level security', t);
    execute format('alter table heal.%I force row level security', t);
    execute format('create policy %I on heal.%I for select to tysvora_app using (tenant_id = heal.current_tenant() or heal.is_platform() or (%L = ''roles'' and tenant_id is null))', t || '_read', t, t);
    execute format('create policy %I on heal.%I for insert to tysvora_app with check (tenant_id = heal.current_tenant() or (tenant_id is null and heal.is_platform()))', t || '_insert', t);
    execute format('create policy %I on heal.%I for update to tysvora_app using (tenant_id = heal.current_tenant() or (tenant_id is null and heal.is_platform())) with check (tenant_id = heal.current_tenant() or (tenant_id is null and heal.is_platform()))', t || '_update', t);
  end loop;
end $$;

-- ---------- Privileges ----------
grant select, insert, update on heal.tenants, heal.organizations, heal.units, heal.users, heal.professionals,
  heal.subjects, heal.roles, heal.user_roles, heal.domain_events to tysvora_app;
grant select, insert on heal.audit_log to tysvora_app;
-- No DELETE anywhere: history is never destroyed from the application (retention is an explicit, audited platform procedure).
