-- VELTRION Phase 6: isolated real-money trading ledger.
-- Run only after reviewing this schema in Supabase SQL Editor.
-- IMPORTANT: the real execution service must remain disabled until production
-- credentials, risk limits, authentication, and operational controls are verified.

create extension if not exists pgcrypto;

create table if not exists public.real_trading_accounts (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users(id) on delete cascade not null,
  deriv_account_id text not null,
  currency text not null default 'USD',
  balance numeric(15,2) not null default 0 check (balance >= 0),
  equity numeric(15,2) not null default 0,
  is_active boolean not null default false,
  emergency_stopped boolean not null default false,
  max_stake numeric(15,2) not null default 100 check (max_stake > 0),
  daily_loss_limit numeric(15,2) not null default 100 check (daily_loss_limit > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(admin_id, deriv_account_id)
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
  admin_id uuid references public.admin_users(id) on delete cascade not null,
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

drop policy if exists "Admin access real accounts" on public.real_trading_accounts;
create policy "Admin access real accounts"
on public.real_trading_accounts for all
using (admin_id in (
  select id from public.admin_users where user_id = auth.uid()
))
with check (admin_id in (
  select id from public.admin_users where user_id = auth.uid()
));

drop policy if exists "Admin access real orders" on public.real_orders;
create policy "Admin access real orders"
on public.real_orders for all
using (account_id in (
  select id from public.real_trading_accounts
  where admin_id in (select id from public.admin_users where user_id = auth.uid())
))
with check (account_id in (
  select id from public.real_trading_accounts
  where admin_id in (select id from public.admin_users where user_id = auth.uid())
));

drop policy if exists "Admin access real ledger" on public.real_ledger;
create policy "Admin access real ledger"
on public.real_ledger for all
using (account_id in (
  select id from public.real_trading_accounts
  where admin_id in (select id from public.admin_users where user_id = auth.uid())
))
with check (account_id in (
  select id from public.real_trading_accounts
  where admin_id in (select id from public.admin_users where user_id = auth.uid())
));

drop policy if exists "Admin access real audit" on public.real_trading_audit;
create policy "Admin access real audit"
on public.real_trading_audit for all
using (admin_id in (
  select id from public.admin_users where user_id = auth.uid()
))
with check (admin_id in (
  select id from public.admin_users where user_id = auth.uid()
));
