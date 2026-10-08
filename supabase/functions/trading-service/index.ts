import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DERIV_API = "https://api.derivws.com";

const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
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

async function realContext(userId: string, forceRefresh = false) {
  const [{ data: account, error: accountError }, { data: cred, error: credError }] = await Promise.all([
    db.from("real_trading_accounts")
      .select("id,deriv_account_id,currency,balance,equity,is_active,emergency_stopped")
      .eq("user_id", userId)
      .maybeSingle(),
    db.schema("private").from("deriv_oauth_credentials")
      .select("access_token,refresh_token,expires_at,scopes")
      .eq("user_id", userId)
      .maybeSingle()
  ]);
  if (accountError) throw accountError;
  if (credError) throw credError;
  if (!account?.deriv_account_id) throw new Error("REAL_DERIV_ACCOUNT_NOT_PROVISIONED");
  if (!cred?.access_token) throw new Error("DERIV_REAUTH_REQUIRED");
  const scopes = Array.isArray(cred.scopes) ? cred.scopes.map(String) : [];
  if (!scopes.includes("trade")) throw new Error("DERIV_TRADE_SCOPE_REQUIRED");
  let accessToken = cred.access_token;
  const expiresAt = cred.expires_at ? Date.parse(cred.expires_at) : 0;
  if (forceRefresh || (expiresAt && expiresAt <= Date.now() + 120000)) {
    if (!cred.refresh_token) throw new Error("DERIV_REAUTH_REQUIRED");
    const clientId = Deno.env.get("DERIV_OAUTH_CLIENT_ID") || Deno.env.get("DERIV_CLIENT_ID") || "34yFXgA3K5sZIE56LQI7J";
    const refresh = await fetch("https://auth.deriv.com/oauth2/token", {
      method: "POST",
      headers: {"Content-Type":"application/x-www-form-urlencoded"},
      body: new URLSearchParams({grant_type:"refresh_token",client_id:clientId,refresh_token:String(cred.refresh_token)})
    });
    const refreshed = await refresh.json().catch(()=>({}));
    if (!refresh.ok || !refreshed.access_token) throw new Error("DERIV_REAUTH_REQUIRED");
    accessToken = String(refreshed.access_token);
    const nextExpires = refreshed.expires_in ? new Date(Date.now()+Number(refreshed.expires_in)*1000).toISOString() : null;
    const saved = await db.schema("private").from("deriv_oauth_credentials").update({
      access_token: accessToken,
      refresh_token: refreshed.refresh_token || cred.refresh_token,
      expires_at: nextExpires,
      token_type: refreshed.token_type || "Bearer",
      scopes: String(refreshed.scope || scopes.join(" ")).split(/[ ,]+/).filter(Boolean),
      updated_at: new Date().toISOString()
    }).eq("user_id", userId);
    if (saved.error) throw saved.error;
  }
  return { account, accessToken };
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
    ws.addEventListener("close", () => finish(reject, new Error("DERIV_WEBSOCKET_CLOSED")));
  });
}

const PUBLIC_DERIV_WS_ENDPOINTS = [
  "wss://api.derivws.com/trading/v1/options/ws/public",
  "wss://ws.binaryws.com/websockets/v3",
  "wss://ws.derivws.com/websockets/v3?app_id=1089"
];

async function publicWsCall(payload: Record<string, unknown>, expected: string, timeoutMs = 8000) {
  let lastError: unknown = null;
  for (const endpoint of PUBLIC_DERIV_WS_ENDPOINTS) {
    try {
      return await wsCall(endpoint, payload, expected, timeoutMs);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("DERIV_PUBLIC_MARKET_DATA_UNAVAILABLE");
}

function normalizePublicMarket(item: any) {
  const symbol = String(item?.underlying_symbol ?? item?.symbol ?? "").trim();
  if (!symbol) return null;
  return {
    symbol,
    name: String(item?.underlying_symbol_name ?? item?.display_name ?? symbol),
    market: String(item?.market_display_name ?? item?.market ?? item?.underlying_symbol_type ?? "Other"),
    subgroup: String(item?.subgroup ?? item?.submarket ?? "")
  };
}

async function realWsCall(userId: string, payload: Record<string, unknown>, expected: string) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const forceRefresh = attempt > 0 && /AUTH|UNAUTHORIZED|TOKEN|CREDENTIAL/i.test(String(lastError instanceof Error ? lastError.message : ""));
      const { account, accessToken } = await realContext(userId, forceRefresh);
      const url = await otpUrl(String(account.deriv_account_id), accessToken);
      return await wsCall(url, payload, expected);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      if (!/WEBSOCKET|CLOSED|TIMEOUT|AUTH|UNAUTHORIZED|TOKEN|CREDENTIAL/i.test(message) || attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("DERIV_WEBSOCKET_RECONNECT_FAILED");
}

const PRODUCTION_READ_ONLY_FREEZE = true;

async function realSnapshotBatch(userId: string) {
  const requests = [
    { key: "balance", payload: { balance: 1 }, expected: "balance" },
    { key: "portfolio", payload: { portfolio: 1 }, expected: "portfolio" },
    { key: "profit_table", payload: { profit_table: 1, limit: 100, sort: "DESC" }, expected: "profit_table" },
    { key: "statement", payload: { statement: 1, limit: 100 }, expected: "statement" }
  ];

  const runOnce = async () => {
    const { account, accessToken } = await realContext(userId);
    const url = await otpUrl(String(account.deriv_account_id), accessToken);
    return new Promise<Record<string, any>>((resolve, reject) => {
      const ws = new WebSocket(url);
      const timeoutMs = 15000;
      const timer = setTimeout(() => {
        try { ws.close(); } catch {}
        reject(new Error("DERIV_SNAPSHOT_TIMEOUT"));
      }, timeoutMs);
      const pending = new Map<number, string>();
      const result: Record<string, any> = {};
      const errors: Record<string, string> = {};

      requests.forEach((request, index) => {
        const reqId = 82000 + index;
        pending.set(reqId, request.key);
        request.req_id = reqId;
      });

      const finish = () => {
        if (pending.size === 0) {
          clearTimeout(timer);
          try { ws.close(); } catch {}
          resolve({ result, errors });
        }
      };

      ws.addEventListener("open", () => {
        for (const request of requests) {
          ws.send(JSON.stringify({ ...request.payload, req_id: request.req_id }));
        }
      });

      ws.addEventListener("message", event => {
        let data: any;
        try { data = JSON.parse(String(event.data)); } catch { return; }
        const reqId = Number(data?.req_id);
        const key = pending.get(reqId);
        if (!key) return;
        pending.delete(reqId);
        if (data?.error) errors[key] = String(data.error.message || "DERIV_API_ERROR");
        else result[key] = data;
        finish();
      });

      ws.addEventListener("error", () => {
        clearTimeout(timer);
        try { ws.close(); } catch {}
        reject(new Error("DERIV_SNAPSHOT_WEBSOCKET_ERROR"));
      });

      ws.addEventListener("close", () => {
        if (pending.size > 0) {
          clearTimeout(timer);
          reject(new Error("DERIV_SNAPSHOT_WEBSOCKET_CLOSED"));
        }
      });
    });
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await runOnce();
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("DERIV_SNAPSHOT_UNAVAILABLE");
}

async function getCachedRealSnapshot(userId: string) {
  const { data, error } = await db.from("deriv_sync_events")
    .select("payload,created_at")
    .eq("user_id", userId)
    .eq("event_type", "REAL_PORTFOLIO_SNAPSHOT")
    .eq("status", "SUCCESS")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return {
    ...data.payload,
    stale: true,
    stale_since: data.created_at,
    cache_source: "supabase_last_good_real_snapshot"
  };
}

async function tradingGate(userId: string) {
  const [
    { data: freezeRows, error: freezeError },
    { data: appRows, error: appError },
    { data: account, error: accountError },
    { data: kill, error: killError },
    { data: controls, error: controlsError }
  ] = await Promise.all([
    db.from("production_freeze").select("real_trading_enabled").order("updated_at", { ascending: false }).limit(1),
    db.from("app_settings").select("real_trading_enabled").order("updated_at", { ascending: false }).limit(1),
    db.from("real_trading_accounts").select("is_active,emergency_stopped").eq("user_id", userId).maybeSingle(),
    db.from("kill_switches").select("enabled").eq("scope", "deriv").maybeSingle(),
    db.from("emergency_controls").select("control_key,is_active").in("control_key", ["EMERGENCY_STOP", "REAL_TRADING"])
  ]);

  // Fail closed on database errors, missing control records, or conflicting control states.
  if (freezeError || appError || accountError || killError || controlsError)
    throw new Error("TRADING_SAFETY_CONTROLS_UNAVAILABLE");

  const freeze = freezeRows?.[0];
  const appSettings = appRows?.[0];
  const emergencyStop = controls?.find((control: any) => control.control_key === "EMERGENCY_STOP");
  const realTradingControl = controls?.find((control: any) => control.control_key === "REAL_TRADING");

  if (!freeze || freeze.real_trading_enabled !== true ||
      !appSettings || appSettings.real_trading_enabled !== true)
    throw new Error("REAL_TRADING_DISABLED");
  if (!account) throw new Error("REAL_ACCOUNT_NOT_FOUND");
  if (account.emergency_stopped) throw new Error("REAL_ACCOUNT_EMERGENCY_STOPPED");
  if (!account.is_active) throw new Error("REAL_ACCOUNT_INACTIVE");
  if (!emergencyStop || emergencyStop.is_active) throw new Error("EMERGENCY_STOP_ACTIVE_OR_UNCONFIGURED");
  if (!realTradingControl || !realTradingControl.is_active) throw new Error("REAL_TRADING_CONTROL_DISABLED");
  if (!kill) throw new Error("DERIV_TRADING_KILL_SWITCH_MISSING");
  if (kill.enabled) throw new Error("DERIV_TRADING_KILL_SWITCH");
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

    if (existing.data && existing.data.status === "CLOSED") continue;
    if (existing.data) {
      await db.from("real_orders").update({
        status: "CLOSED",
        exit_price: Number(tx.sell_price ?? 0),
        realized_pnl: Number(profit),
        closed_at: tx.sell_time ? new Date(Number(tx.sell_time) * 1000).toISOString() : new Date().toISOString()
      }).eq("id", existing.data.id);
    }

    const inserted = existing.data
      ? { data: existing.data, error: null as any }
      : await db.from("real_orders").insert({
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

    reconciled += 1;
  }

  const { data: walletReconciliation, error: walletReconciliationError } = await db.rpc(
    "reconcile_profit_wallet",
    { p_wallet_id: currentWallet.id }
  );
  if (walletReconciliationError) throw walletReconciliationError;

  const reconciledProfit = Array.isArray(walletReconciliation)
    ? walletReconciliation[0]
    : walletReconciliation;

  await db.from("real_trading_audit").insert({
    account_id: account.id,
    user_id: userId,
    action: "RECONCILE_REAL_STATE",
    result: "SUCCESS",
    metadata: {
      reconciled,
      credited: Number(reconciledProfit?.withdrawableProfit || 0),
      source: "deriv_profit_table",
      wallet_reconciliation: reconciledProfit || null
    }
  });

  return {
    account_id: account.id,
    balance: accountUpdate.balance,
    reconciled,
    credited_profit: Number(reconciledProfit?.withdrawableProfit || 0),
    wallet_reconciliation: reconciledProfit || null
  };
}

async function executeSendboxDecision(userId: string, body: any) {
  const sandboxOrderId = String(body.sandbox_order_id || "").trim();
  const stake = Number(body.stake);
  const duration = Number(body.duration ?? 1);
  const durationUnit = String(body.duration_unit || "m");
  if (!sandboxOrderId) throw new Error("SANDBOX_DECISION_REQUIRED");
  if (!Number.isFinite(stake) || stake <= 0) throw new Error("INVALID_REAL_STAKE");
  if (!Number.isInteger(duration) || duration <= 0) throw new Error("INVALID_DURATION");
  if (!["s","m","h","d"].includes(durationUnit)) throw new Error("INVALID_DURATION_UNIT");

  await tradingGate(userId);

  const { data: decision, error: decisionError } = await db.from("sandbox_orders")
    .select("id,user_id,symbol,side,status,quantity,price,stop_loss,take_profit,created_at")
    .eq("id", sandboxOrderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (decisionError) throw decisionError;
  if (!decision) throw new Error("SANDBOX_DECISION_NOT_FOUND");
  if (["CLOSED","REJECTED","CANCELLED"].includes(String(decision.status || "").toUpperCase()))
    throw new Error("SANDBOX_DECISION_NOT_ACTIVE");

  const symbol = String(decision.symbol || "").trim();
  const side = String(decision.side || "").toUpperCase();
  if (!symbol || !["BUY","SELL"].includes(side)) throw new Error("SANDBOX_DECISION_INVALID");

  const clientOrderId = String(body.client_order_id || crypto.randomUUID());
  const contractType = side === "BUY" ? "CALL" : "PUT";
  const proposal = await realWsCall(userId, {
    proposal: 1,
    amount: stake,
    basis: "stake",
    contract_type: contractType,
    currency: "USD",
    duration,
    duration_unit: durationUnit,
    underlying_symbol: symbol,
    passthrough: {
      source: "sendbox_decision",
      sandbox_order_id: sandboxOrderId,
      client_order_id: clientOrderId
    }
  }, "proposal");

  const proposalId = String(proposal?.proposal?.id || "").trim();
  const maxPrice = Number(proposal?.proposal?.ask_price);
  if (!proposalId) throw new Error("DERIV_PROPOSAL_MISSING_ID");
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) throw new Error("DERIV_PROPOSAL_INVALID_PRICE");

  const bought = await realWsCall(userId, {
    buy: proposalId,
    price: maxPrice,
    passthrough: {
      source: "sendbox_decision",
      sandbox_order_id: sandboxOrderId,
      client_order_id: clientOrderId
    }
  }, "buy");

  const contractId = String(bought?.buy?.contract_id || "").trim();
  if (!contractId) throw new Error("DERIV_BUY_MISSING_CONTRACT_ID");

  const { account } = await realContext(userId);
  const inserted = await db.from("real_orders").insert({
    account_id: account.id,
    deriv_contract_id: contractId,
    client_order_id: clientOrderId,
    source_sandbox_order_id: sandboxOrderId,
    symbol,
    side: "BUY",
    quantity: stake,
    entry_price: Number(bought.buy.buy_price ?? maxPrice),
    status: "CONFIRMED"
  }).select("id,deriv_contract_id,client_order_id,source_sandbox_order_id,status").single();
  if (inserted.error) throw inserted.error;

  await db.from("real_trading_audit").insert({
    account_id: account.id,
    user_id: userId,
    action: "SENDBOX_DECISION_ROUTED_TO_REAL_DERIV",
    result: "SUCCESS",
    metadata: {
      sandbox_order_id: sandboxOrderId,
      real_order_id: inserted.data.id,
      deriv_contract_id: contractId,
      symbol,
      decision_side: side,
      stake,
      duration,
      duration_unit: durationUnit
    }
  });

  return {
    status: "CONFIRMED",
    source: "sendbox_decision",
    sandbox_order_id: sandboxOrderId,
    real_order: inserted.data,
    deriv: bought.buy
  };
}

async function handle(userId: string, body: any) {
  const op = String(body.operation || body.action || "status");

  if (op === "public_market_catalog") {
    const response = await publicWsCall({ active_symbols: "full", req_id: 61001 }, "active_symbols");
    const markets = Array.isArray(response?.active_symbols)
      ? response.active_symbols.map(normalizePublicMarket).filter(Boolean)
      : [];
    if (!markets.length) throw new Error("DERIV_PUBLIC_MARKET_CATALOG_EMPTY");

    const updatedAt = new Date().toISOString();
    const rows = markets.map((item: any) => ({
      source: "deriv",
      symbol: item.symbol,
      display_name: item.name,
      market: item.market,
      submarket: item.subgroup,
      is_active: true,
      raw: item,
      updated_at: updatedAt
    }));
    const { error: syncError } = await db.from("market_symbols").upsert(rows, { onConflict: "symbol" });
    if (syncError) throw syncError;

    return { markets, count: markets.length, source: "server_deriv_public_websocket", observed_at: updatedAt };
  }

  if (op === "public_market_tick") {
    const symbol = String(body.symbol || "").trim();
    if (!symbol || symbol.length > 64) throw new Error("MARKET_SYMBOL_REQUIRED");
    const response = await publicWsCall({ ticks: symbol, subscribe: 0, req_id: 61002 }, "tick");
    const tick = response?.tick;
    const quote = Number(tick?.quote);
    const epoch = Number(tick?.epoch);
    if (!Number.isFinite(quote) || !Number.isFinite(epoch)) throw new Error("DERIV_PUBLIC_TICK_INVALID");
    return {
      symbol: String(tick?.symbol ?? tick?.underlying_symbol ?? symbol),
      quote,
      epoch,
      pipSize: tick?.pip_size ?? null,
      source: "server_deriv_public_websocket"
    };
  }


  if (op === "balance_reconcile") {
    const { account } = await realContext(userId);
    const balanceResponse = await realWsCall(userId, { balance: 1 }, "balance");
    const balanceInfo = balanceResponse?.balance;
    const liveBalance = Number(balanceInfo?.balance);
    const currency = String(balanceInfo?.currency || account.currency || "USD");
    if (!Number.isFinite(liveBalance) || liveBalance < 0) {
      throw new Error("DERIV_LIVE_BALANCE_INVALID");
    }

    // Equity is only set from cash balance when Deriv confirms there are no open contracts.
    // If portfolio state is unavailable or positions exist, preserve the stored equity and mark it unverified.
    let noOpenPositions = false;
    try {
      const portfolioResponse = await realWsCall(userId, { portfolio: 1 }, "portfolio");
      const contracts = portfolioResponse?.portfolio?.contracts;
      noOpenPositions = Array.isArray(contracts) && contracts.length === 0;
    } catch {
      noOpenPositions = false;
    }

    const observedAt = new Date().toISOString();
    const previousBalance = Number(account.balance || 0);
    const previousEquity = Number(account.equity || 0);
    const balanceDifference = Number((liveBalance - previousBalance).toFixed(2));

    // Keep the provider-account identity synchronized before writing snapshots.
    // The OAuth connection can be valid even when the normalized deriv_accounts row
    // has not yet been created. Create it idempotently so reconciliation does not
    // remain stuck in an "awaiting synchronization" state.
    let { data: derivAccount, error: derivAccountError } = await db.from("deriv_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("deriv_account_id", account.deriv_account_id)
      .maybeSingle();
    if (derivAccountError) throw derivAccountError;

    if (!derivAccount) {
      const { data: createdDerivAccount, error: createDerivAccountError } = await db
        .from("deriv_accounts")
        .insert({
          user_id: userId,
          deriv_account_id: account.deriv_account_id,
          account_type: "real",
          currency,
          status: "connected",
          scopes: ["read", "trade"],
          last_synced_at: observedAt,
          raw: {
            source: "authenticated_deriv_websocket",
            loginid: balanceInfo?.loginid || account.deriv_account_id,
            currency
          }
        })
        .select("id")
        .single();

      if (createDerivAccountError) throw createDerivAccountError;
      derivAccount = createdDerivAccount;
    } else {
      const { error: syncDerivAccountError } = await db.from("deriv_accounts")
        .update({
          currency,
          status: "connected",
          last_synced_at: observedAt,
          updated_at: observedAt
        })
        .eq("id", derivAccount.id)
        .eq("user_id", userId);
      if (syncDerivAccountError) throw syncDerivAccountError;
    }

    // Ensure the real profit wallet is provisioned during every successful live reconciliation.
    // This keeps the wallet/reconciliation path consistent even when the account was
    // synchronized before the wallet row existed.
    const { data: existingProfitWallet, error: profitWalletLookupError } = await db
      .from("real_profit_wallets")
      .select("id")
      .eq("account_id", account.id)
      .maybeSingle();
    if (profitWalletLookupError) throw profitWalletLookupError;
    if (!existingProfitWallet) {
      const { error: profitWalletCreateError } = await db.from("real_profit_wallets").insert({
        account_id: account.id,
        available_balance: 0,
        reserved_balance: 0,
        currency
      });
      if (profitWalletCreateError) throw profitWalletCreateError;
    }

    const { data: updatedAccount, error: accountUpdateError } = await db.from("real_trading_accounts")
      .update({
        balance: liveBalance,
        ...(noOpenPositions ? { equity: liveBalance } : {}),
        currency,
        updated_at: observedAt
      })
      .eq("id", account.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (accountUpdateError) throw accountUpdateError;
    if (!updatedAccount) throw new Error("REAL_ACCOUNT_BALANCE_UPDATE_FAILED");

    const snapshot = await db.from("deriv_account_snapshots").insert({
      user_id: userId,
      deriv_account_id: derivAccount?.id || null,
      balance: liveBalance,
      equity: noOpenPositions ? liveBalance : null,
      currency,
      snapshot_at: observedAt,
      raw: {
        source: "authenticated_deriv_websocket",
        loginid: balanceInfo?.loginid || null,
        balance: liveBalance,
        currency,
        open_positions_confirmed_empty: noOpenPositions
      }
    });
    if (snapshot.error) throw snapshot.error;

    let walletQuery = db.from("deriv_wallets").select("id").eq("user_id", userId);
    if (derivAccount?.id) walletQuery = walletQuery.eq("deriv_account_id", derivAccount.id);
    else walletQuery = walletQuery.is("deriv_account_id", null);
    const { data: walletRows, error: walletLookupError } = await walletQuery
      .order("observed_at", { ascending: false }).limit(1);
    if (walletLookupError) throw walletLookupError;

    const walletValues = {
      user_id: userId,
      deriv_account_id: derivAccount?.id || null,
      provider_wallet_id: account.deriv_account_id,
      currency,
      balance: liveBalance,
      available_balance: liveBalance,
      observed_at: observedAt,
      raw: {
        source: "authenticated_deriv_websocket",
        loginid: balanceInfo?.loginid || null,
        balance: liveBalance,
        currency
      }
    };
    const walletWrite = walletRows?.[0]?.id
      ? await db.from("deriv_wallets").update(walletValues).eq("id", walletRows[0].id)
      : await db.from("deriv_wallets").insert(walletValues);
    if (walletWrite.error) throw walletWrite.error;

    const reconciliation = await db.from("financial_reconciliation").insert({
      user_id: userId,
      source: "deriv",
      environment: "real",
      resource_type: "account_balance",
      resource_id: account.id,
      external_value: { balance: liveBalance, currency, observed_at: observedAt },
      internal_value: { balance: previousBalance, equity: previousEquity, currency: account.currency || currency },
      status: Math.abs(balanceDifference) <= 0.01 ? "MATCH" : "RECONCILED",
      difference: balanceDifference,
      reconciled_at: observedAt
    });
    if (reconciliation.error) throw reconciliation.error;

    return {
      account_id: account.deriv_account_id,
      currency,
      balance: liveBalance,
      previous_stored_balance: previousBalance,
      balance_difference: balanceDifference,
      equity: noOpenPositions ? liveBalance : null,
      equity_verified: noOpenPositions,
      snapshot_saved: true,
      wallet_observation_saved: true,
      reconciliation_recorded: true,
      observed_at: observedAt,
      source: "authenticated_deriv_websocket"
    };
  }

  if (op === "accu_proposal") {
    const template = validateAccuTemplate(body.contract_template);
    const contracts = await realWsCall(userId, { contracts_for: template.underlying_symbol }, "contracts_for");
    const available = Array.isArray(contracts?.contracts_for?.available) ? contracts.contracts_for.available : [];
    if (!available.some((x: any) => x.contract_type === "ACCU"))
      throw new Error("ACCU_NOT_AVAILABLE_FOR_SYMBOL");
    return realWsCall(userId, { proposal: 1, ...template }, "proposal");
  }

  if (op === "real_snapshot") {
    let liveSnapshot = true;
    let batch: any = null;
    let warnings: any[] = [];

    try {
      batch = await realSnapshotBatch(userId);
    } catch (error) {
      warnings.push({
        section: "snapshot",
        error: error instanceof Error ? error.message : "DERIV_SNAPSHOT_UNAVAILABLE"
      });
    }

    const balance = batch?.result?.balance;
    const portfolio = batch?.result?.portfolio;
    const profit = batch?.result?.profit_table;
    const statement = batch?.result?.statement;

    for (const [section, message] of Object.entries(batch?.errors || {})) {
      warnings.push({ section, error: message });
    }

    let snapshot: any;
    if (balance && Number.isFinite(Number(balance.balance?.balance))) {
      snapshot = {
        balance: balance.balance,
        portfolio: portfolio?.portfolio ?? { contracts: [] },
        profit_table: profit?.profit_table ?? { transactions: [] },
        statement: statement?.statement ?? { transactions: [] }
      };
    } else {
      snapshot = await getCachedRealSnapshot(userId);
      if (!snapshot) {
        throw new Error(warnings[0]?.error || "REAL_BALANCE_UNAVAILABLE");
      }
      liveSnapshot = false;
      warnings.push({
        section: "snapshot",
        error: "LIVE_REAL_ACCOUNT_UNAVAILABLE_USING_LAST_GOOD_SNAPSHOT"
      });
    }

    if (liveSnapshot) {
      // Persist only a complete live snapshot. This becomes the durable reconnect fallback.
      try {
        const { account } = await realContext(userId);
        const livePortfolio = Array.isArray(snapshot.portfolio?.contracts) ? snapshot.portfolio.contracts : [];
        const liveClosed = Array.isArray(snapshot.profit_table?.transactions) ? snapshot.profit_table.transactions : [];
        const syncEvent = await db.from("deriv_sync_events").insert({
          user_id: userId,
          deriv_account_id: account.id,
          event_type: "REAL_PORTFOLIO_SNAPSHOT",
          status: "SUCCESS",
          payload: {
            source: "authenticated_deriv_websocket",
            balance: snapshot.balance,
            portfolio: snapshot.portfolio,
            profit_table: snapshot.profit_table,
            statement: snapshot.statement
          }
        }).select("id").single();
        if (syncEvent.error) throw syncEvent.error;

        const cleared = await db.from("positions").delete()
          .eq("user_id", userId).eq("account_id", account.id)
          .eq("source", "deriv").eq("environment", "real");
        if (cleared.error) throw cleared.error;

        if (livePortfolio.length) {
          const rows = livePortfolio.map((p: any) => {
            const contractId = String(p.contract_id ?? p.id ?? "").trim();
            return {
              user_id: userId, source: "deriv", environment: "real", account_id: account.id,
              external_position_id: contractId || crypto.randomUUID(),
              symbol: String(p.underlying_symbol ?? p.symbol ?? "UNKNOWN"),
              side: String(p.contract_type ?? p.direction ?? "BUY").toUpperCase().includes("PUT") ? "SELL" : "BUY",
              quantity: Math.max(Number(p.buy_price ?? p.amount ?? 0), 0.0001),
              entry_price: Math.max(Number(p.buy_price ?? 0), 0),
              current_price: Math.max(Number(p.bid_price ?? p.sell_price ?? p.current_price ?? p.buy_price ?? 0), 0),
              unrealized_pnl: Number(p.profit ?? p.profit_loss ?? 0) || 0,
              status: "OPEN", observed_at: new Date().toISOString(), raw: p
            };
          });
          const positionInsert = await db.from("positions").insert(rows);
          if (positionInsert.error) throw positionInsert.error;
        }

        snapshot.supabase_sync = {
          status: "SYNCED",
          synced_at: new Date().toISOString(),
          open_positions: livePortfolio.length,
          closed_orders: liveClosed.length
        };
      } catch (error) {
        warnings.push({
          section: "supabase_sync",
          error: error instanceof Error ? error.message : "REAL_PORTFOLIO_SUPABASE_SYNC_FAILED"
        });
      }

      if (profit?.profit_table) {
        try {
          await reconcileRealState(userId, snapshot.balance, profit.profit_table);
        } catch (error) {
          warnings.push({
            section: "reconciliation",
            error: error instanceof Error ? error.message : "REAL_RECONCILIATION_FAILED"
          });
        }
      }
    }

    return {
      ...snapshot,
      warnings,
      stale: !liveSnapshot,
      observed_at: snapshot.observed_at || (liveSnapshot ? new Date().toISOString() : undefined)
    };
  }
  if (op === "reconcile") {
    const [balance, profit] = await Promise.all([
      realWsCall(userId, { balance: 1 }, "balance"),
      realWsCall(userId, { profit_table: 1, limit: 100, sort: "DESC" }, "profit_table")
    ]);
    return await reconcileRealState(userId, balance.balance, profit.profit_table);
  }

  if (op === "proposal") {
    if (PRODUCTION_READ_ONLY_FREEZE) throw new Error("PRODUCTION_READ_ONLY_FREEZE");
    await tradingGate(userId);
    const symbol = String(body.symbol || "").trim();
    const side = String(body.side || "").toUpperCase();
    const stake = Number(body.stake);
    const duration = Number(body.duration ?? 5);
    const durationUnit = String(body.duration_unit || "m");
    if (!symbol) throw new Error("MARKET_SYMBOL_REQUIRED");
    if (!["BUY","SELL"].includes(side)) throw new Error("INVALID_SIDE");
    if (!Number.isFinite(stake) || stake <= 0) throw new Error("INVALID_STAKE");
    if (!Number.isInteger(duration) || duration <= 0) throw new Error("INVALID_DURATION");
    if (!["s","m","h","d","t"].includes(durationUnit)) throw new Error("INVALID_DURATION_UNIT");
    const { account } = await realContext(userId);
    const balanceResponse = await realWsCall(userId, { balance: 1 }, "balance");
    const balance = Number(balanceResponse?.balance?.balance);
    if (!Number.isFinite(balance) || balance < stake) throw new Error("REAL_BROKER_FUNDS_INSUFFICIENT");
    const contractType = side === "BUY" ? "CALL" : "PUT";
    return realWsCall(userId, {
      proposal: 1,
      amount: stake,
      basis: "stake",
      contract_type: contractType,
      currency: String(account.currency || "USD").toUpperCase(),
      duration,
      duration_unit: durationUnit,
      underlying_symbol: symbol
    }, "proposal");
  }

  if (op === "contract_status") {
    if (!body.contract_id) throw new Error("CONTRACT_ID_REQUIRED");
    return realWsCall(userId, {
      proposal_open_contract: 1,
      contract_id: Number(body.contract_id),
      subscribe: body.subscribe === 1 ? 1 : undefined
    }, "proposal_open_contract");
  }

  if (op === "sendbox_real_execute") {
    if (PRODUCTION_READ_ONLY_FREEZE) throw new Error("PRODUCTION_READ_ONLY_FREEZE");
    return executeSendboxDecision(userId, body);
  }

  if (op === "buy") {
    if (PRODUCTION_READ_ONLY_FREEZE) throw new Error("PRODUCTION_READ_ONLY_FREEZE");
    await tradingGate(userId);
    if (!body.proposal_id) throw new Error("PROPOSAL_ID_REQUIRED");
    if (!Number.isFinite(Number(body.price)) || Number(body.price) <= 0) throw new Error("INVALID_MAX_PRICE");
    const clientOrderId = String(body.client_order_id || "").trim();
    if (!clientOrderId || clientOrderId.length > 128) throw new Error("CLIENT_ORDER_ID_REQUIRED");

    const { account } = await realContext(userId);
    const existing = await db.from("real_orders").select("id,status,deriv_contract_id")
      .eq("account_id", account.id).eq("client_order_id", clientOrderId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return { duplicate: true, order: existing.data };

    const result = await realWsCall(userId, {
      buy: String(body.proposal_id),
      price: Number(body.price),
      passthrough: { client_order_id: clientOrderId }
    }, "buy");

    const bought = result?.buy;
    const contractId = String(bought?.contract_id || "").trim();
    if (!contractId) throw new Error("DERIV_BUY_MISSING_CONTRACT_ID");

    const stake = Number(body.stake);
    const symbol = String(body.symbol || "");
    if (!Number.isFinite(stake) || stake <= 0 || !symbol) throw new Error("ORDER_METADATA_REQUIRED");

    const inserted = await db.from("real_orders").insert({
      account_id: account.id,
      deriv_contract_id: contractId,
      client_order_id: clientOrderId,
      symbol,
      side: "BUY",
      quantity: stake,
      entry_price: Number(bought?.buy_price ?? body.price),
      status: "CONFIRMED"
    }).select("id,deriv_contract_id,client_order_id,status").single();
    if (inserted.error) throw inserted.error;

    await db.from("real_trading_audit").insert({
      account_id: account.id,
      user_id: userId,
      action: "REAL_ORDER_SUBMITTED",
      result: "SUCCESS",
      metadata: { order_id: inserted.data.id, deriv_contract_id: contractId, symbol, stake }
    });

    return { ...result, order: inserted.data };
  }

  if (op === "sell") {
    if (PRODUCTION_READ_ONLY_FREEZE) throw new Error("PRODUCTION_READ_ONLY_FREEZE");
    await tradingGate(userId);
    const contractId = String(body.contract_id || "").trim();
    if (!contractId) throw new Error("CONTRACT_ID_REQUIRED");
    const price = Number(body.price ?? 0);
    if (!Number.isFinite(price) || price < 0) throw new Error("INVALID_SELL_PRICE");

    const result = await realWsCall(userId, {
      sell: Number(contractId),
      price
    }, "sell");

    const { account } = await realContext(userId);
    const profit = Number(result?.sell?.profit ?? result?.sell?.sell_price - result?.sell?.buy_price);
    await db.from("real_orders").update({
      status: "CLOSED",
      exit_price: Number(result?.sell?.sell_price ?? price),
      realized_pnl: Number.isFinite(profit) ? profit : 0,
      closed_at: new Date().toISOString()
    }).eq("account_id", account.id).eq("deriv_contract_id", contractId);

    return result;
  }

  if (op === "auto_start") {
    if (PRODUCTION_READ_ONLY_FREEZE) throw new Error("PRODUCTION_READ_ONLY_FREEZE");
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
    const status = [
      "REAL_TRADING_DISABLED", "REAL_ACCOUNT_INACTIVE", "REAL_ACCOUNT_EMERGENCY_STOPPED",
      "REAL_ACCOUNT_NOT_FOUND", "EMERGENCY_STOP_ACTIVE_OR_UNCONFIGURED",
      "REAL_TRADING_CONTROL_DISABLED", "DERIV_TRADING_KILL_SWITCH", "PRODUCTION_READ_ONLY_FREEZE",
      "DERIV_TRADING_KILL_SWITCH_MISSING", "TRADING_SAFETY_CONTROLS_UNAVAILABLE"
    ].includes(message) ? 423 : 400;
    return json({ ok: false, error: message }, status);
  }
});
