-- VELTRION Phase 6: isolated real-money trading ledger.
-- Canonical schema for the connected Supabase project.
-- Real execution remains disabled until backend-only Deriv credentials are configured.

create extension if not exists pgcrypto;

create table if not exists public.real_trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deriv_account_id text not null,
  currency text not null default 'USD',
  balance numeric(15,2) not null default 0 check (balance >= 0),
  equity numeric(15,2) not null default 0,
  is_active boolean not null default false,
  emergency_stopped boolean not null default true,
  max_stake numeric(15,2) not null default 100 check (max_stake > 0),
  daily_loss_limit numeric(15,2) not null default 100 check (daily_loss_limit > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, deriv_account_id)
);

create table if not exists public.real_orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.real_trading_accounts(id) on delete cascade not null,
  deriv_contract_id text,
  client_order_id text not null,
  symbol text not null,
  side text not null check (side in ('BUY','SELL')),
  quantity numeric(10,4) not null check (quantity > 0),
  entry_price numeric(15,5) not null check (entry_price >= 0),
  exit_price numeric(15,5),
  status text not null default 'SUBMITTED'
    check (status in ('SUBMITTED','CONFIRMED','REJECTED','CLOSED')),
  rejection_reason text,
  realized_pnl numeric(15,2) not null default 0,
  opened_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(account_id, client_order_id)
);

create table if not exists public.real_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.real_trading_accounts(id) on delete cascade not null,
  transaction_type text not null check (transaction_type in ('DEPOSIT','TRADE_PNL','FEE')),
  reference_id uuid references public.real_orders(id),
  amount numeric(15,2) not null,
  balance_after numeric(15,2) not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.real_trading_audit (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.real_trading_accounts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  result text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists real_orders_account_status_idx
  on public.real_orders(account_id, status, created_at desc);
create index if not exists real_ledger_account_created_idx
  on public.real_ledger(account_id, created_at desc);
create index if not exists real_audit_account_created_idx
  on public.real_trading_audit(account_id, created_at desc);

alter table public.real_trading_accounts enable row level security;
alter table public.real_orders enable row level security;
alter table public.real_ledger enable row level security;
alter table public.real_trading_audit enable row level security;

drop policy if exists "User read real accounts" on public.real_trading_accounts;
create policy "User read real accounts"
on public.real_trading_accounts for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "User read real orders" on public.real_orders;
create policy "User read real orders"
on public.real_orders for select
to authenticated
using (
  account_id in (
    select id from public.real_trading_accounts where user_id = auth.uid()
  )
);

drop policy if exists "User read real ledger" on public.real_ledger;
create policy "User read real ledger"
on public.real_ledger for select
to authenticated
using (
  account_id in (
    select id from public.real_trading_accounts where user_id = auth.uid()
  )
);

drop policy if exists "User read real audit" on public.real_trading_audit;
create policy "User read real audit"
on public.real_trading_audit for select
to authenticated
using (auth.uid() = user_id);

grant select on public.real_trading_accounts, public.real_orders, public.real_ledger, public.real_trading_audit to authenticated;
