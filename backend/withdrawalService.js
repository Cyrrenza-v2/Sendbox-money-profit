const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function requestWithdrawal(walletId, amount, destination) {
  if (!walletId || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !destination) throw new Error("INVALID_WITHDRAWAL_REQUEST");
  const response = await fetch(SUPABASE_URL + "/rest/v1/rpc/request_profit_withdrawal", {
    method: "POST",
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ p_wallet_id: walletId, p_amount: Number(amount), p_destination: destination })
  });
  if (!response.ok) throw new Error("WITHDRAWAL_REQUEST_FAILED");
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function settleWithdrawal(withdrawalId, status, externalReference = null) {
  const allowed = ["processing","completed","failed","cancelled","rejected"];
  if (!allowed.includes(status)) throw new Error("INVALID_WITHDRAWAL_STATUS");
  const response = await fetch(SUPABASE_URL + "/rest/v1/rpc/settle_profit_withdrawal", {
    method: "POST",
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ p_withdrawal_id: withdrawalId, p_status: status, p_external_reference: externalReference })
  });
  if (!response.ok) throw new Error("WITHDRAWAL_SETTLEMENT_FAILED");
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}
