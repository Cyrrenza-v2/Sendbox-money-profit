create table if not exists public.analytics_daily_snapshots (
  id uuid primary key default gen_random_uuid(), account_type text not null check (account_type in ('SANDBOX','REAL')),
  snapshot_date date not null, starting_balance numeric(15,2) not null, ending_balance numeric(15,2) not null,
  realized_pnl numeric(15,2) not null default 0, total_trades integer not null default 0,
  winning_trades integer not null default 0, losing_trades integer not null default 0, max_drawdown numeric(15,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()), unique(account_type, snapshot_date)
);
create table if not exists public.analytics_trade_metrics (
  id uuid primary key default gen_random_uuid(), account_type text not null check (account_type in ('SANDBOX','REAL')),
  total_trades integer not null default 0, win_rate numeric(5,2) not null default 0,
  profit_factor numeric(10,2) not null default 0, average_win numeric(15,2) not null default 0,
  average_loss numeric(15,2) not null default 0, updated_at timestamptz not null default timezone('utc', now()),
  unique(account_type)
);
alter table public.analytics_daily_snapshots enable row level security;
alter table public.analytics_trade_metrics enable row level security;
drop policy if exists "Admin access analytics snapshots" on public.analytics_daily_snapshots;
create policy "Admin access analytics snapshots" on public.analytics_daily_snapshots for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admin access trade metrics" on public.analytics_trade_metrics;
create policy "Admin access trade metrics" on public.analytics_trade_metrics for select to authenticated using ((select private.is_admin()));
grant select on public.analytics_daily_snapshots, public.analytics_trade_metrics to authenticated;
create index if not exists analytics_daily_snapshots_account_date_idx on public.analytics_daily_snapshots(account_type, snapshot_date desc);
