-- Move profit withdrawal requests behind a JWT-verified Edge Function.
-- The Edge Function validates the caller and passes the verified auth.users.id to this
-- service-role-only RPC. The wallet row lock and reservation remain atomic.

create or replace function public.request_profit_withdrawal_for_user(
  p_user_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_destination text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_wallet public.real_profit_wallets%rowtype;
  v_withdrawal public.withdrawals%rowtype;
  v_new_reserved numeric(15,2);
  v_withdrawable numeric(15,2);
begin
  if p_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_destination is null or length(trim(p_destination)) = 0 then raise exception 'INVALID_DESTINATION'; end if;

  select w.* into v_wallet
  from public.real_profit_wallets w
  join public.real_trading_accounts a on a.id = w.account_id
  where w.id = p_wallet_id and a.user_id = p_user_id
  for update of w;

  if not found then raise exception 'WALLET_NOT_FOUND'; end if;

  v_withdrawable := v_wallet.available_balance - v_wallet.reserved_balance;
  if p_amount > v_withdrawable then raise exception 'INSUFFICIENT_WITHDRAWABLE_BALANCE'; end if;

  v_new_reserved := v_wallet.reserved_balance + p_amount;

  update public.real_profit_wallets
  set reserved_balance = v_new_reserved, updated_at = timezone('utc', now())
  where id = v_wallet.id;

  insert into public.withdrawals(
    user_id, source, environment, wallet_id, amount, currency,
    destination_type, status, requested_at, metadata
  )
  values (
    p_user_id, 'profit_wallet', 'real', v_wallet.id, p_amount, v_wallet.currency,
    'AUTHORIZED_PAYMENT_ROUTE', 'requested', timezone('utc', now()),
    jsonb_build_object(
      'wallet_available_before', v_wallet.available_balance,
      'reserved_before', v_wallet.reserved_balance
    )
  )
  returning * into v_withdrawal;

  insert into public.profit_wallet_transactions(
    wallet_id, transaction_type, amount, balance_after, reference_id
  )
  values (
    v_wallet.id, 'WITHDRAWAL_RESERVATION', p_amount,
    v_wallet.available_balance - v_new_reserved, v_withdrawal.id
  );

  return jsonb_build_object(
    'status', 'SUCCESS',
    'withdrawalId', v_withdrawal.id,
    'reservedAmount', p_amount,
    'withdrawableBalance', v_wallet.available_balance - v_new_reserved
  );
end;
$function$;

revoke all on function public.request_profit_withdrawal_for_user(uuid, uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.request_profit_withdrawal_for_user(uuid, uuid, numeric, text) to service_role;

-- The old direct RPC is no longer needed by the browser after the frontend migration.
revoke all on function public.request_profit_withdrawal(uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.request_profit_withdrawal(uuid, numeric, text) to service_role;
