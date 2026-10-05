-- VELTRION Phase 4 — Sandbox Trading Engine
-- Extends the existing user-owned sandbox schema. Does not introduce admin_users.
create index if not exists idx_sandbox_orders_user_created on public.sandbox_orders(user_id,created_at desc);
create index if not exists idx_sandbox_positions_user on public.sandbox_positions(user_id);
create index if not exists idx_sandbox_ledger_user_created on public.sandbox_ledger(user_id,created_at desc);
create unique index if not exists uq_sandbox_ledger_idempotency on public.sandbox_ledger(idempotency_key) where idempotency_key is not null;
create unique index if not exists uq_sandbox_orders_user_idempotency on public.sandbox_orders(user_id,idempotency_key) where idempotency_key is not null;
alter table public.sandbox_orders add column if not exists stop_loss numeric,add column if not exists take_profit numeric,add column if not exists closed_at timestamptz,add column if not exists exit_price numeric,add column if not exists realized_pnl numeric default 0;
alter table public.sandbox_positions add column if not exists stop_loss numeric,add column if not exists take_profit numeric,add column if not exists opened_at timestamptz default now(),add column if not exists source_order_id uuid;
create or replace function public.sandbox_ledger_immutable() returns trigger language plpgsql as $$ begin if tg_op <> 'INSERT' then raise exception 'sandbox_ledger is append-only'; end if; return new; end $$;
drop trigger if exists sandbox_ledger_no_update_delete on public.sandbox_ledger;
create trigger sandbox_ledger_no_update_delete before update or delete on public.sandbox_ledger for each row execute function public.sandbox_ledger_immutable();
create or replace function public.sandbox_contract_multiplier(p_symbol text) returns numeric language sql immutable as $$ select case when lower(coalesce(p_symbol,'')) like 'frx%' then 100000 when upper(coalesce(p_symbol,'')) ~ '^[A-Z]{6}$' then 100000 else 1 end $$;
-- Execution and close functions are deployed in the sandbox-service Edge Function and execute with server-side privileges.


-- Real/sandbox isolation hardening: provider/environment pairs are enforced at the database boundary.
alter table if exists public.positions drop constraint if exists positions_source_environment_consistency;
alter table if exists public.positions add constraint positions_source_environment_consistency check (
  (source = 'deriv' and environment = 'real')
  or (source = 'sandbox' and environment = 'sandbox')
  or source = 'mt5'
);
alter table if exists public.financial_reconciliation drop constraint if exists financial_reconciliation_source_environment_consistency;
alter table if exists public.financial_reconciliation add constraint financial_reconciliation_source_environment_consistency check (
  (source = 'deriv' and environment = 'real')
  or (source = 'sandbox' and environment = 'sandbox')
  or source = 'mt5'
);
create index if not exists idx_positions_user_source_environment
  on public.positions(user_id,source,environment,observed_at desc);
create index if not exists idx_financial_reconciliation_user_source_environment
  on public.financial_reconciliation(user_id,source,environment,reconciled_at desc);
