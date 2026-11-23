-- Program Engine v0 + Sentinela + Central de Pendencias persistence.
-- Full domain documents live in `doc` (versioned by the domain); everything the database must enforce or index is a column.

create table heal.program_definitions (
  id text primary key,
  tenant_id text not null,
  organization_id text not null,
  program_key text not null,
  version integer not null check (version >= 1),
  status text not null check (status in ('draft','approved','retired')),
  doc jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, organization_id, program_key, version),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id)
);

create table heal.program_enrollments (
  id text primary key,
  tenant_id text not null,
  organization_id text not null,
  subject_id text not null,
  program_key text not null,
  definition_id text not null,
  status text not null check (status in ('active','closed')),
  doc jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id),
  foreign key (tenant_id, subject_id) references heal.subjects (tenant_id, id),
  foreign key (tenant_id, definition_id) references heal.program_definitions (tenant_id, id)
);
-- A subject can hold only one active enrollment per program (backstop for the application check).
create unique index program_enrollments_one_active on heal.program_enrollments (tenant_id, subject_id, program_key) where status = 'active';

create table heal.program_facts (
  id text primary key,
  tenant_id text not null,
  enrollment_id text not null,
  kind text not null,
  occurred_at timestamptz not null,
  doc jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, enrollment_id) references heal.program_enrollments (tenant_id, id)
);
create index program_facts_enrollment_idx on heal.program_facts (tenant_id, enrollment_id, occurred_at);

create table heal.pendencies (
  id text primary key,
  tenant_id text not null,
  organization_id text not null,
  subject_id text not null,
  state text not null check (state in ('open','assigned','in_progress','paused','escalated','resolved','closed')),
  dedup_key text,
  version integer not null check (version >= 1),
  due_at timestamptz not null,
  doc jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id),
  foreign key (tenant_id, subject_id) references heal.subjects (tenant_id, id)
);
-- At most one open pendency per dedup key, enforced by the database even if two writers race.
create unique index pendencies_one_open_per_dedup on heal.pendencies (tenant_id, dedup_key)
  where dedup_key is not null and state in ('open','assigned','in_progress','paused','escalated');
create index pendencies_queue_idx on heal.pendencies (tenant_id, organization_id, state, due_at);

do $$
declare t text;
begin
  foreach t in array array['program_definitions','program_enrollments','program_facts','pendencies'] loop
    execute format('alter table heal.%I enable row level security', t);
    execute format('alter table heal.%I force row level security', t);
    execute format('create policy %I on heal.%I for select to tysvora_app using (tenant_id = heal.current_tenant() or heal.is_platform())', t || '_read', t);
    execute format('create policy %I on heal.%I for insert to tysvora_app with check (tenant_id = heal.current_tenant())', t || '_insert', t);
    execute format('create policy %I on heal.%I for update to tysvora_app using (tenant_id = heal.current_tenant()) with check (tenant_id = heal.current_tenant())', t || '_update', t);
    execute format('grant select, insert, update on heal.%I to tysvora_app', t);
  end loop;
end $$;
