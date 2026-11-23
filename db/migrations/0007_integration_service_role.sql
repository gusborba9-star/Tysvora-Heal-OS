alter table heal.roles drop constraint roles_architectural_role_check;
alter table heal.roles add constraint roles_architectural_role_check check (architectural_role in
  ('platform-admin','tenant-admin','municipal-management','unit-management','professional','patient-user','technical-operator','integration-service'));

-- Demand facts are recorded once per (enrollment, kind, reference): a database backstop for the idempotent writer.
create unique index program_facts_one_per_demand on heal.program_facts (tenant_id, enrollment_id, kind, (doc->>'reference'))
  where kind in ('demand.opened', 'demand.answered');
