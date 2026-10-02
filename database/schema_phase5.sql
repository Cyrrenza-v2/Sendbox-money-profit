-- Phase 5: MT5 sandbox bridge schema.
-- Uses the existing VELTRION sandbox/user model. No admin_users table is introduced.
-- This schema alone does NOT create an official MetaTrader broker/server.

create extension if not exists pgcrypto;

create table if not exists public.mt5_accounts (
  id uuid primary key default gen_random_uuid(),
  sandbox_account_id uuid references public.sandbox_accounts(id) on delete cascade not null,
  server_name text not null default 'VELTRION-VIRTUAL',
  login_id text not null,
  password_hash text,
  investor_password_hash text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISABLED','LOCKED')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (server_name, login_id)
);

create table if not exists public.mt5_symbol_mapping (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'DERIV',
  source_symbol text not null,
  veltrion_symbol text not null,
  mt5_symbol text not null,
  price_precision integer not null default 5,
  contract_size numeric(15,2) not null default 100000,
  min_volume numeric(10,4) not null default 0.01,
  volume_step numeric(10,4) not null default 0.01,
  status text not null default 'ACTIVE',
  unique (source, source_symbol),
  unique (mt5_symbol)
);

create table if not exists public.mt5_sessions (
  id uuid primary key default gen_random_uuid(),
  mt5_account_id uuid references public.mt5_accounts(id) on delete cascade not null,
  connection_status text not null default 'OFFLINE' check (connection_status in ('ONLINE','OFFLINE')),
  last_heartbeat timestamptz not null default timezone('utc', now()),
  client_ip inet,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.mt5_accounts enable row level security;
alter table public.mt5_symbol_mapping enable row level security;
alter table public.mt5_sessions enable row level security;

drop policy if exists "MT5 accounts owner access" on public.mt5_accounts;
create policy "MT5 accounts owner access" on public.mt5_accounts
for select to authenticated
using (sandbox_account_id in (
  select sa.id from public.sandbox_accounts sa where sa.user_id = (select auth.uid())
));

drop policy if exists "MT5 symbol mapping read" on public.mt5_symbol_mapping;
create policy "MT5 symbol mapping read" on public.mt5_symbol_mapping
for select to authenticated using (true);

drop policy if exists "MT5 sessions owner access" on public.mt5_sessions;
create policy "MT5 sessions owner access" on public.mt5_sessions
for select to authenticated
using (mt5_account_id in (
  select ma.id from public.mt5_accounts ma
  join public.sandbox_accounts sa on sa.id = ma.sandbox_account_id
  where sa.user_id = (select auth.uid())
));

insert into public.mt5_symbol_mapping
(source,source_symbol,veltrion_symbol,mt5_symbol,price_precision,contract_size,min_volume,volume_step)
values
('DERIV','frxEURUSD','EUR/USD','EURUSD',5,100000,0.01,0.01),
('DERIV','frxGBPUSD','GBP/USD','GBPUSD',5,100000,0.01,0.01),
('DERIV','frxUSDJPY','USD/JPY','USDJPY',3,100000,0.01,0.01),
('DERIV','frxXAUUSD','Gold','XAUUSD',2,100,0.01,0.01)
on conflict do nothing;
