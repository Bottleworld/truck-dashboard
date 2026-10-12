-- Bottle World subscription launch hardening
-- Apply ONLY AFTER the signed-manager and server-data proxy version
-- has been deployed to production and verified with a paid subscription.
-- Otherwise the current browser clients will lose access.
--
-- Existing RLS is already enabled. Removing the permissive SELECT policies
-- blocks Supabase public-client requests. Server API uses service_role only.

begin;
drop policy if exists "allow public read trucks" on public.trucks;
drop policy if exists "allow public read sessions" on public.truck_sessions;
drop policy if exists "allow public read bags" on public.bag_counts;

revoke select on public.trucks, public.truck_sessions, public.bag_counts,
  public.customers, public.app_access from anon, authenticated;

commit;

-- Verification:
-- select tablename, policyname from pg_policies
-- where schemaname = 'public'
--   and tablename in ('trucks','truck_sessions','bag_counts');
-- select has_table_privilege('service_role','public.trucks','SELECT');
--
-- Do not restore permissive public policies as a routine rollback.
-- If a rollback is needed, fix the server gateway instead of reopening data.
