-- VELTRION Phase 11: production security/RLS hardening.
-- Authorization uses private.is_admin(); do not use user-editable raw_user_meta_data.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  event_type text not null,
  resource_id text,
  previous_state jsonb,
  new_state jsonb,
  result text,
  ip_address inet,
  device_agent text,
  timestamp timestamptz not null default timezone('utc', now())
);
alter table public.audit_logs enable row level security;

-- Remove broad authenticated read policies from administrative control tables.
drop policy if exists "Authenticated users can read system health" on public.system_health;
drop policy if exists "Authenticated users can read system alerts" on public.system_alerts;
drop policy if exists "Authenticated users can read emergency controls" on public.emergency_controls;
drop policy if exists "Restrict system health access to authenticated admins" on public.system_health;
drop policy if exists "Restrict risk limits access to authenticated admins" on public.risk_limits;
drop policy if exists "Restrict emergency controls access to authenticated admins" on public.emergency_controls;
drop policy if exists "Restrict system alerts access to authenticated admins" on public.system_alerts;

create policy "Phase11 admin system health" on public.system_health for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "Admins can read global risk limits" on public.risk_limits;
drop policy if exists "select_self_or_admin_risk_limits" on public.risk_limits;
create policy "Phase11 admin risk limits" on public.risk_limits for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Phase11 admin emergency controls" on public.emergency_controls for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Phase11 admin system alerts" on public.system_alerts for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "Admin access analytics snapshots" on public.analytics_daily_snapshots;
drop policy if exists "Admin access trade metrics" on public.analytics_trade_metrics;
create policy "Phase11 admin analytics snapshots" on public.analytics_daily_snapshots for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Phase11 admin trade metrics" on public.analytics_trade_metrics for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Phase11 admin audit logs" on public.audit_logs for select to authenticated
  using ((select private.is_admin()));

revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;

alter table public.system_health enable row level security;
alter table public.risk_limits enable row level security;
alter table public.emergency_controls enable row level security;
alter table public.system_alerts enable row level security;
alter table public.analytics_daily_snapshots enable row level security;
alter table public.analytics_trade_metrics enable row level security;

revoke all on public.system_health, public.risk_limits, public.emergency_controls, public.system_alerts,
  public.analytics_daily_snapshots, public.analytics_trade_metrics from anon;
grant select on public.system_health, public.risk_limits, public.emergency_controls, public.system_alerts,
  public.analytics_daily_snapshots, public.analytics_trade_metrics to authenticated;

-- Financial ledgers remain isolated: users can read only their own records; admins can read all.
drop policy if exists "real_orders_select_own" on public.real_orders;
create policy "Phase11 real orders own or admin" on public.real_orders for select to authenticated
  using (
    exists (select 1 from public.real_trading_accounts a where a.id=real_orders.account_id and a.user_id=(select auth.uid()))
    or (select private.is_admin())
  );

-- No client-side inserts/updates/deletes to real orders: live execution is server-only.
drop policy if exists "real_orders_insert" on public.real_orders;
drop policy if exists "real_orders_update" on public.real_orders;
drop policy if exists "real_orders_delete" on public.real_orders;
revoke insert, update, delete on public.real_orders from anon, authenticated;

-- Sandbox remains user-scoped and never grants access to real execution tables.
alter table public.sandbox_orders enable row level security;

create index if not exists audit_logs_admin_timestamp_idx on public.audit_logs(admin_id,timestamp desc);
create index if not exists audit_logs_resource_timestamp_idx on public.audit_logs(resource_id,timestamp desc);

-- Prevent direct public execution of the existing privileged RPCs.
revoke execute on function public.claim_veltrion_owner() from public, anon, authenticated;
revoke execute on function public.request_profit_withdrawal(uuid,numeric,text) from public, anon, authenticated;
revoke execute on function public.set_global_emergency_stop(boolean) from public, anon, authenticated;\ngrant execute on function public.set_global_emergency_stop(boolean) to service_role;
