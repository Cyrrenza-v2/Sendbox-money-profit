-- VELTRION Phase 2: Device & Infrastructure
-- Apply this SQL to the existing Supabase production project after reviewing
-- the existing schema. This migration intentionally uses user_roles instead
-- of introducing the conflicting admin_users table.

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  environment text not null default 'PRODUCTION',
  trading_mode text not null default 'SANDBOX',
  real_trading_enabled boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_settings_updated_at_idx
  on public.app_settings (updated_at desc);

insert into public.app_settings (environment, trading_mode, real_trading_enabled)
select 'PRODUCTION', 'SANDBOX', false
where not exists (select 1 from public.app_settings);

alter table public.user_sessions
  add column if not exists last_active_at timestamptz default timezone('utc', now()),
  add column if not exists browser_info text;

alter table public.app_settings enable row level security;

drop policy if exists "VELTRION admins can read app settings" on public.app_settings;

create policy "VELTRION admins can read app settings"
on public.app_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and upper(ur.role::text) = 'ADMIN'
  )
);

-- Session rows are private to their owner.
alter table public.user_sessions enable row level security;

drop policy if exists "VELTRION users can read own sessions" on public.user_sessions;
create policy "VELTRION users can read own sessions"
on public.user_sessions
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "VELTRION users can update own sessions" on public.user_sessions;
create policy "VELTRION users can update own sessions"
on public.user_sessions
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
