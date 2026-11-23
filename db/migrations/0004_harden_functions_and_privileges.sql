alter function heal.current_tenant() set search_path = '';
alter function heal.is_platform() set search_path = '';
-- The Data API roles must never reach this schema, even if it were exposed by mistake.
revoke all on all tables in schema heal from anon, authenticated;
revoke all on all functions in schema heal from anon, authenticated;
revoke usage on schema heal from anon, authenticated;
alter default privileges in schema heal revoke all on tables from anon, authenticated;
alter default privileges in schema heal revoke all on functions from anon, authenticated;
