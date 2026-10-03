import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DERIV_API = "https://api.derivws.com";

const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function getUser(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const { data } = await client.auth.getUser();
  return data.user || null;
}

async function realContext(userId: string) {
  const [{ data: account, error: accountError }, { data: cred, error: credError }] = await Promise.all([
    db.from("real_trading_accounts")
      .select("id,deriv_account_id,currency,balance,equity,is_active,emergency_stopped")
      .eq("user_id", userId)
      .maybeSingle(),
    db.schema("private").from("deriv_oauth_credentials")
      .select("access_token,expires_at")
      .eq("user_id", userId)
      .maybeSingle()
  ]);
  if (accountError) throw accountError;
  if (credError) throw credError;
  if (!account?.deriv_account_id) throw new Error("REAL_DERIV_ACCOUNT_NOT_PROVISIONED");
  if (!cred?.access_token) throw new Error("DERIV_REAUTH_REQUIRED");
  if (cred.expires_at && Date.parse(cred.expires_at) <= Date.now())
    throw new Error("DERIV_ACCESS_TOKEN_EXPIRED");
  return { account, accessToken: cred.access_token };
}

async function otpUrl(accountId: string, accessToken: string) {
  const r = await fetch(
    `${DERIV_API}/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body?.data?.url) throw new Error(body?.errors?.[0]?.message || "DERIV_OTP_FAILED");
  const url = String(body.data.url);
  if (!url.includes("/trading/v1/options/ws/real")) throw new Error("DERIV_REAL_WS_NOT_RETURNED");
  return url;
}

function wsCall(url: string, payload: Record<string, unknown>, expected: string, timeoutMs = 15000) {
  return new Promise<any>((resolve, reject) => {
    const ws = new WebSocket(url);
    const reqId = Number(payload.req_id || Date.now());
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("DERIV_REQUEST_TIMEOUT"));
    }, timeoutMs);

    const finish = (fn: (value: any) => void, value: any) => {
      clearTimeout(timer);
      try { ws.close(); } catch {}
      fn(value);
    };

    ws.addEventListener("open", () => ws.send(JSON.stringify({ ...payload, req_id: reqId })));
    ws.addEventListener("message", event => {
      let data: any;
      try { data = JSON.parse(String(event.data)); } catch { return; }
      if (data.error) {
        finish(reject, new Error(data.error.message || "DERIV_API_ERROR"));
        return;
      }
      if (data.msg_type === expected && (!data.req_id || data.req_id === reqId))
        finish(resolve, data);
    });
    ws.addEventListener("error", () => finish(reject, new Error("DERIV_WEBSOCKET_ERROR")));
  });
}

async function realWsCall(userId: string, payload: Record<string, unknown>, expected: string) {
  const { account, accessToken } = await realContext(userId);
  const url = await otpUrl(String(account.deriv_account_id), accessToken);
  return wsCall(url, payload, expected);
}

async function tradingGate(userId: string) {
  const [{ data: settings }, { data: account }, { data: kill }] = await Promise.all([
    db.from("production_freeze").select("real_trading_enabled").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("real_trading_accounts").select("is_active,emergency_stopped").eq("user_id", userId).maybeSingle(),
    db.from("kill_switches").select("enabled").eq("scope", "deriv").maybeSingle()
  ]);

  if (settings?.real_trading_enabled !== true) throw new Error("REAL_TRADING_DISABLED");
  if (!account?.is_active) throw new Error("REAL_ACCOUNT_INACTIVE");
  if (account?.emergency_stopped) throw new Error("REAL_ACCOUNT_EMERGENCY_STOPPED");
  if (kill?.enabled) throw new Error("DERIV_TRADING_KILL_SWITCH");
}

function validateAccuTemplate(t: any) {
  if (!t || t.contract_type !== "ACCU") throw new Error("ACCU_CONTRACT_REQUIRED");
  if (!/^\w{2,30}$/.test(String(t.underlying_symbol || ""))) throw new Error("INVALID_UNDERLYING_SYMBOL");
  if (!/^[a-zA-Z0-9]{2,20}$/.test(String(t.currency || ""))) throw new Error("INVALID_CURRENCY");
  if (!Number.isFinite(Number(t.amount)) || Number(t.amount) <= 0) throw new Error("INVALID_STAKE");
  if (!Number.isFinite(Number(t.growth_rate)) || Number(t.growth_rate) <= 0) throw new Error("INVALID_GROWTH_RATE");
  if (t.duration != null && (!Number.isInteger(Number(t.duration)) || Number(t.duration) < 0)) throw new Error("INVALID_DURATION");
  if (t.limit_order) {
    for (const k of ["stop_loss", "take_profit"]) {
      if (t.limit_order[k] != null && (!Number.isFinite(Number(t.limit_order[k])) || Number(t.limit_order[k]) < 0))
        throw new Error(`INVALID_${k.toUpperCase()}`);
    }
  }
  return {
    amount: Number(t.amount),
    basis: t.basis || "stake",
    contract_type: "ACCU",
    currency: String(t.currency).toUpperCase(),
    ...(t.duration == null ? {} : { duration: Number(t.duration) }),
    ...(t.duration_unit ? { duration_unit: t.duration_unit } : {}),
    growth_rate: Number(t.growth_rate),
    ...(t.limit_order ? { limit_order: t.limit_order } : {}),
    underlying_symbol: String(t.underlying_symbol)
  };
}

async function reconcileRealState(userId: string, balancePayload: any, profitPayload: any) {
  const { account } = await realContext(userId);
  const balance = Number(balancePayload?.balance ?? balancePayload?.accounts?.[0]?.balance);
  const closed = Array.isArray(profitPayload?.transactions) ? profitPayload.transactions
    : Array.isArray(profitPayload?.profit_table) ? profitPayload.profit_table : [];

  const accountUpdate: Record<string, unknown> = {
    balance: Number.isFinite(balance) ? Math.max(0, balance) : Number(account.balance || 0),
    equity: Number.isFinite(balance) ? Math.max(0, balance) : Number(account.equity || 0),
    updated_at: new Date().toISOString()
  };
  await db.from("real_trading_accounts").update(accountUpdate).eq("id", account.id).eq("user_id", userId);

  const wallet = await db.from("real_profit_wallets")
    .select("id,available_balance,reserved_balance,currency")
    .eq("account_id", account.id).maybeSingle();

  if (!wallet.data) {
    const created = await db.from("real_profit_wallets").insert({
      account_id: account.id,
      available_balance: 0,
      reserved_balance: 0,
      currency: account.currency || "USD"
    }).select("id,available_balance,reserved_balance,currency").single();
    if (created.error) throw created.error;
  }

  const { data: currentWallet, error: walletError } = await db.from("real_profit_wallets")
    .select("id,available_balance,reserved_balance,currency")
    .eq("account_id", account.id).single();
  if (walletError || !currentWallet) throw walletError || new Error("REAL_PROFIT_WALLET_UNAVAILABLE");

  let credited = 0;
  let reconciled = 0;
  for (const tx of closed) {
    const contractId = String(tx.contract_id ?? tx.contractId ?? "").trim();
    const profit = Number(tx.profit ?? tx.realized_pnl ?? tx.sell_price - tx.buy_price);
    if (!contractId || !Number.isFinite(profit)) continue;

    const existing = await db.from("real_orders")
      .select("id,status,realized_pnl")
      .eq("account_id", account.id)
      .eq("deriv_contract_id", contractId)
      .maybeSingle();

    if (existing.error) throw existing.error;

    if (existing.data) {
      if (existing.data.status !== "CLOSED") {
        await db.from("real_orders").update({
          status: "CLOSED",
          exit_price: Number(tx.sell_price ?? tx.sell_price),
          realized_pnl: Number(profit),
          closed_at: tx.sell_time ? new Date(Number(tx.sell_time) * 1000).toISOString() : new Date().toISOString()
        }).eq("id", existing.data.id);
      }
      continue;
    }

    const inserted = await db.from("real_orders").insert({
      account_id: account.id,
      deriv_contract_id: contractId,
      client_order_id: `reconcile:${contractId}`,
      symbol: String(tx.underlying_symbol ?? tx.symbol ?? "UNKNOWN"),
      side: "BUY",
      quantity: Number(tx.buy_price ?? tx.amount ?? 0) > 0 ? Number(tx.buy_price ?? tx.amount) : 0.0001,
      entry_price: Number(tx.buy_price ?? 0),
      exit_price: Number(tx.sell_price ?? 0),
      status: "CLOSED",
      realized_pnl: Number(profit),
      opened_at: tx.buy_time ? new Date(Number(tx.buy_time) * 1000).toISOString() : new Date().toISOString(),
      closed_at: tx.sell_time ? new Date(Number(tx.sell_time) * 1000).toISOString() : new Date().toISOString()
    }).select("id").single();
    if (inserted.error) throw inserted.error;

    const ledgerBalance = Number(currentWallet.available_balance || 0) + Math.max(0, Number(profit));
    if (Number(profit) > 0) {
      const ledger = await db.from("real_ledger").insert({
        account_id: account.id,
        transaction_type: "TRADE_PNL",
        reference_id: inserted.data.id,
        amount: Number(profit),
        balance_after: Number(account.balance || 0)
      });
      if (ledger.error) throw ledger.error;

      const walletUpdate = await db.from("real_profit_wallets").update({
        available_balance: ledgerBalance,
        updated_at: new Date().toISOString()
      }).eq("id", currentWallet.id);
      if (walletUpdate.error) throw walletUpdate.error;

      const walletTx = await db.from("profit_wallet_transactions").insert({
        wallet_id: currentWallet.id,
        transaction_type: "REALIZED_TRADE_PROFIT",
        amount: Number(profit),
        balance_after: ledgerBalance,
        reference_id: inserted.data.id
      });
      if (walletTx.error) throw walletTx.error;
      credited += Number(profit);
    }
    reconciled += 1;
  }

  await db.from("real_trading_audit").insert({
    account_id: account.id,
    user_id: userId,
    action: "RECONCILE_REAL_STATE",
    result: "SUCCESS",
    metadata: { reconciled, credited, source: "deriv_profit_table" }
  });

  return { account_id: account.id, balance: accountUpdate.balance, reconciled, credited_profit: credited };
}

async function handle(userId: string, body: any) {
  const op = String(body.operation || body.action || "status");

  if (op === "accu_proposal") {
    const template = validateAccuTemplate(body.contract_template);
    const contracts = await realWsCall(userId, { contracts_for: template.underlying_symbol }, "contracts_for");
    const available = Array.isArray(contracts?.contracts_for?.available) ? contracts.contracts_for.available : [];
    if (!available.some((x: any) => x.contract_type === "ACCU"))
      throw new Error("ACCU_NOT_AVAILABLE_FOR_SYMBOL");
    return realWsCall(userId, { proposal: 1, ...template }, "proposal");
  }

  if (op === "real_snapshot") {
    const [balance, portfolio, profit, statement] = await Promise.all([
      realWsCall(userId, { balance: 1 }, "balance"),
      realWsCall(userId, { portfolio: 1 }, "portfolio"),
      realWsCall(userId, { profit_table: 1, limit: 100, sort: "DESC" }, "profit_table"),
      realWsCall(userId, { statement: 1, limit: 100 }, "statement")
    ]);
    await reconcileRealState(userId, balance.balance, profit.profit_table);
    return {
      balance: balance.balance,
      portfolio: portfolio.portfolio,
      profit_table: profit.profit_table,
      statement: statement.statement
    };
  }

  if (op === "reconcile") {
    const [balance, profit] = await Promise.all([
      realWsCall(userId, { balance: 1 }, "balance"),
      realWsCall(userId, { profit_table: 1, limit: 100, sort: "DESC" }, "profit_table")
    ]);
    return await reconcileRealState(userId, balance.balance, profit.profit_table);
  }

  if (op === "contract_status") {
    if (!body.contract_id) throw new Error("CONTRACT_ID_REQUIRED");
    return realWsCall(userId, {
      proposal_open_contract: 1,
      contract_id: Number(body.contract_id),
      subscribe: body.subscribe === 1 ? 1 : undefined
    }, "proposal_open_contract");
  }

  if (op === "buy") {
    await tradingGate(userId);
    if (!body.proposal_id) throw new Error("PROPOSAL_ID_REQUIRED");
    if (!Number.isFinite(Number(body.price)) || Number(body.price) <= 0) throw new Error("INVALID_MAX_PRICE");
    return realWsCall(userId, { buy: String(body.proposal_id), price: Number(body.price) }, "buy");
  }

  if (op === "auto_start") {
    await tradingGate(userId);
    const template = validateAccuTemplate(body.contract_template);
    const strategyId = String(body.strategy_id || "");
    if (!/^\w{1,64}$/.test(strategyId)) throw new Error("INVALID_STRATEGY_ID");
    if (!body.strategy_parameters || typeof body.strategy_parameters !== "object")
      throw new Error("STRATEGY_PARAMETERS_REQUIRED");
    return realWsCall(userId, {
      auto_start: 1,
      contract_template: template,
      strategy_id: strategyId,
      strategy_parameters: body.strategy_parameters,
      subscribe: body.subscribe === 1 ? 1 : undefined
    }, "auto_start");
  }

  throw new Error("UNSUPPORTED_REAL_TRADING_OPERATION");
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await getUser(req);
  if (!user) return json({ ok: false, error: "Authentication required" }, 401);

  try {
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const result = await handle(user.id, body);
    return json({ ok: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "REAL_TRADING_REQUEST_FAILED";
    const status = message === "REAL_TRADING_DISABLED" || message === "REAL_ACCOUNT_INACTIVE" ||
      message === "REAL_ACCOUNT_EMERGENCY_STOPPED" || message === "DERIV_TRADING_KILL_SWITCH" ? 423 : 400;
    return json({ ok: false, error: message }, status);
  }
});
