-- VELTRION Phase 1
-- Existing schema adapted; no duplicate admin_users table.
create schema if not exists private;
create or replace function private.is_admin()
returns boolean language sql stable security definer
set search_path = public, private
as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role in ('admin','risk_admin','finance_admin','support')); $$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Bootstrap the VELTRION owner by email instead of a stale hard-coded auth UUID.
do $$
declare
  owner_id uuid;
begin
  select id into owner_id
  from auth.users
  where email = 'uasianubong@gmail.com'
  limit 1;

  if owner_id is not null then
    insert into public.user_roles(user_id,role)
    values (owner_id,'admin')
    on conflict (user_id,role) do nothing;

    insert into public.sandbox_accounts(user_id,currency,initial_capital,available_capital,allocated_capital,withdrawable,status)
    values (owner_id,'USD',100000,100000,0,0,'active')
    on conflict (user_id) do nothing;

    insert into public.sandbox_balances(user_id,sandbox_account_id,currency,cash,equity)
    select user_id,id,currency,available_capital,available_capital
    from public.sandbox_accounts
    where user_id=owner_id
    on conflict do nothing;
  end if;
end $$;

-- RLS policies are maintained by the deployed migration:
-- veltrion_phase1_security_and_sandbox.
