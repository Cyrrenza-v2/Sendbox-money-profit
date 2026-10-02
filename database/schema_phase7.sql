-- VELTRION Phase 7 canonical real-profit wallet schema.
-- Sandbox balances remain virtual and are never linked to this wallet.
create table if not exists public.real_profit_wallets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.real_trading_accounts(id) on delete cascade,
  available_balance numeric(15,2) not null default 0 check (available_balance >= 0),
  reserved_balance numeric(15,2) not null default 0 check (reserved_balance >= 0),
  currency text not null default 'USD',
  updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.profit_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.real_profit_wallets(id) on delete cascade,
  transaction_type text not null,
  amount numeric(15,2) not null,
  balance_after numeric(15,2) not null,
  reference_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);
-- Withdrawals are already part of the connected financial schema. This file documents the canonical lifecycle.
-- REQUESTED -> PROCESSING -> COMPLETED; FAILED/CANCELLED/REJECTED release reservations as appropriate.
alter table public.real_profit_wallets enable row level security;
alter table public.profit_wallet_transactions enable row level security;
