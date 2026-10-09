-- VELTRION Phase 1 foundation hardening.
-- Reuses the existing user_roles, user_sessions, and audit_logs tables.
-- Apply through the reviewed Supabase migration process, not directly from the browser.
begin;
alter table public.audit_logs enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
create or replace function public.prevent_audit_log_mutation()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  raise exception 'AUDIT_LOGS_APPEND_ONLY' using errcode = '42501';
end;
$$;
drop trigger if exists audit_logs_append_only on public.audit_logs;
create trigger audit_logs_append_only before update or delete on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();
revoke all on function public.prevent_audit_log_mutation() from public, anon, authenticated;
commit;
