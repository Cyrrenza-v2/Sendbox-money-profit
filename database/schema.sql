-- VELTRION Phase 1
-- Existing schema adapted; no duplicate admin_users table.
create schema if not exists private;
create or replace function private.is_admin()
returns boolean language sql stable security definer
set search_path = public, private
as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('admin','risk_admin','finance_admin','support')); $$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

insert into public.user_roles(user_id,role)
values ('096bf9c8-df49-4609-8299-056c0ff197ca','admin')
on conflict (user_id,role) do nothing;

insert into public.sandbox_accounts(user_id,currency,initial_capital,available_capital,allocated_capital,withdrawable,status)
values ('096bf9c8-df49-4609-8299-056c0ff197ca','USD',100000,100000,0,0,'active')
on conflict (user_id) do nothing;

insert into public.sandbox_balances(user_id,sandbox_account_id,currency,cash,equity)
select user_id,id,currency,available_capital,available_capital
from public.sandbox_accounts
where user_id='096bf9c8-df49-4609-8299-056c0ff197ca'
on conflict do nothing;

-- RLS policies are maintained by the deployed migration:
-- veltrion_phase1_security_and_sandbox.
