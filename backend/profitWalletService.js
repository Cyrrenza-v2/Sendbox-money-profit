const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function get(path) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY } });
  if (!response.ok) throw new Error("SUPABASE_" + response.status);
  return response.json();
}

export async function getProfitWalletForUser(userId) {
  const accounts = await get("real_trading_accounts?select=id,currency&user_id=eq." + encodeURIComponent(userId) + "&limit=1");
  if (!accounts[0]) return null;
  const wallets = await get("real_profit_wallets?select=id,account_id,available_balance,reserved_balance,currency,updated_at&account_id=eq." + accounts[0].id + "&limit=1");
  return wallets[0] || null;
}

export async function getWalletHistory(walletId) {
  const [withdrawals, transactions] = await Promise.all([
    get("withdrawals?select=id,amount,currency,destination_type,status,provider_reference,requested_at,processed_at,completed_at&wallet_id=eq." + walletId + "&order=requested_at.desc&limit=50"),
    get("profit_wallet_transactions?select=id,transaction_type,amount,balance_after,reference_id,created_at&wallet_id=eq." + walletId + "&order=created_at.desc&limit=100")
  ]);
  return { withdrawals, transactions };
}
