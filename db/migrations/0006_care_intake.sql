-- Consent, contact bindings, patient demands and channel connections (Etapa 5).

create table heal.consent_records (
  id text primary key,
  tenant_id text not null,
  subject_id text not null,
  channel text not null check (channel in ('whatsapp','sms','email','app')),
  purpose text not null check (purpose in ('care-contact','reminders','program-communications')),
  status text not null check (status in ('granted','revoked')),
  doc jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, subject_id) references heal.subjects (tenant_id, id)
);
-- One granted consent per person/channel/purpose; history of revoked ones is kept.
create unique index consent_one_granted on heal.consent_records (tenant_id, subject_id, channel, purpose) where status = 'granted';
create index consent_records_subject_idx on heal.consent_records (tenant_id, subject_id);

create table heal.contact_bindings (
  id text primary key,
  tenant_id text not null,
  subject_id text not null,
  channel text not null check (channel in ('whatsapp','sms','email','app')),
  address_key text not null,
  status text not null check (status in ('active','removed')),
  doc jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, subject_id) references heal.subjects (tenant_id, id)
);
create unique index contact_binding_one_active on heal.contact_bindings (tenant_id, subject_id, channel, address_key) where status = 'active';
create index contact_bindings_lookup_idx on heal.contact_bindings (tenant_id, channel, address_key) where status = 'active';

create table heal.patient_demands (
  id text primary key,
  tenant_id text not null,
  organization_id text not null,
  subject_id text,
  channel text not null check (channel in ('whatsapp','sms','email','app')),
  external_id text not null,
  status text not null check (status in ('new','answered')),
  received_at timestamptz not null,
  doc jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  -- The same provider message is stored once per tenant, whatever the retry pattern.
  unique (tenant_id, channel, external_id),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id),
  foreign key (tenant_id, subject_id) references heal.subjects (tenant_id, id)
);
create index patient_demands_queue_idx on heal.patient_demands (tenant_id, organization_id, status, received_at);

create table heal.channel_connections (
  id text primary key,
  tenant_id text not null references heal.tenants(id),
  organization_id text not null,
  channel text not null check (channel in ('whatsapp','sms','email','app')),
  account_id text not null,
  service_user_id text not null,
  secret_ref text,
  status text not null check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  -- An external account belongs to exactly one tenant.
  unique (channel, account_id),
  foreign key (tenant_id, organization_id) references heal.organizations (tenant_id, id),
  foreign key (tenant_id, service_user_id) references heal.users (tenant_id, id)
);
create index channel_connections_tenant_idx on heal.channel_connections (tenant_id);
create index channel_connections_org_idx on heal.channel_connections (tenant_id, organization_id);
create index channel_connections_user_idx on heal.channel_connections (tenant_id, service_user_id);
create index patient_demands_subject_idx on heal.patient_demands (tenant_id, subject_id);

do $$
declare t text;
begin
  foreach t in array array['consent_records','contact_bindings','patient_demands','channel_connections'] loop
    execute format('alter table heal.%I enable row level security', t);
    execute format('alter table heal.%I force row level security', t);
    execute format('create policy %I on heal.%I for select to tysvora_app using (tenant_id = heal.current_tenant() or heal.is_platform())', t || '_read', t);
    execute format('create policy %I on heal.%I for insert to tysvora_app with check (tenant_id = heal.current_tenant())', t || '_insert', t);
    execute format('create policy %I on heal.%I for update to tysvora_app using (tenant_id = heal.current_tenant()) with check (tenant_id = heal.current_tenant())', t || '_update', t);
    execute format('grant select, insert, update on heal.%I to tysvora_app', t);
  end loop;
end $$;
