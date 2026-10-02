create table if not exists public.production_freeze (
  id boolean primary key default true check (id),
  frozen_at timestamptz not null default now(),
  release_version text not null,
  real_trading_enabled boolean not null default false,
  notes text
);
alter table public.production_freeze enable row level security;
revoke all on public.production_freeze from anon, authenticated;
insert into public.production_freeze(id,release_version,real_trading_enabled,notes)
values(true,'phase-14',false,'Initial production launch freeze; REAL trading remains paused.')
on conflict(id) do update set release_version=excluded.release_version, real_trading_enabled=false, notes=excluded.notes;
