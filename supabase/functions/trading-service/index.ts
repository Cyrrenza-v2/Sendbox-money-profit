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

async function realContext(userId: string) {
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
  if (expiresAt && expiresAt <= Date.now() + 120000) {
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
  });
}

async function realWsCall(userId: string, payload: Record<string, unknown>, expected: string) {
  const { account, accessToken } = await realContext(userId);
  const url = await otpUrl(String(account.deriv_account_id), accessToken);
  return wsCall(url, payload, expected);
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
    // Read-only snapshot calls are independent. A temporary failure in one
    // Deriv request must not tear down the entire terminal state.
    const results = await Promise.allSettled([
      realWsCall(userId, { balance: 1 }, "balance"),
      realWsCall(userId, { portfolio: 1 }, "portfolio"),
      realWsCall(userId, { profit_table: 1, limit: 100, sort: "DESC" }, "profit_table"),
      realWsCall(userId, { statement: 1, limit: 100 }, "statement")
    ]);

    const [balanceResult, portfolioResult, profitResult, statementResult] = results;
    const warnings = [];

    const valueOf = (result, label) => {
      if (result.status === "fulfilled") return result.value;
      warnings.push({ section: label, error: result.reason instanceof Error ? result.reason.message : "DERIV_REQUEST_FAILED" });
      return null;
    };

    const balance = valueOf(balanceResult, "balance");
    const portfolio = valueOf(portfolioResult, "portfolio");
    const profit = valueOf(profitResult, "profit_table");
    const statement = valueOf(statementResult, "statement");

    // A balance is the minimum required identity/state signal. If it failed,
    // surface the failure rather than inventing a zero balance.
    if (!balance?.balance) {
      throw new Error(warnings[0]?.error || "REAL_BALANCE_UNAVAILABLE");
    }

    // Reconciliation is best-effort for the read-only screen. A temporary
    // reconciliation write/API failure must not blank the account terminal.
    if (profit?.profit_table) {
      try {
        await reconcileRealState(userId, balance.balance, profit.profit_table);
      } catch (error) {
        warnings.push({
          section: "reconciliation",
          error: error instanceof Error ? error.message : "REAL_RECONCILIATION_FAILED"
        });
      }
    }

    return {
      balance: balance.balance,
      portfolio: portfolio?.portfolio ?? { contracts: [] },
      profit_table: profit?.profit_table ?? { transactions: [] },
      statement: statement?.statement ?? { transactions: [] },
      warnings
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
      "REAL_TRADING_CONTROL_DISABLED", "DERIV_TRADING_KILL_SWITCH",
      "DERIV_TRADING_KILL_SWITCH_MISSING", "TRADING_SAFETY_CONTROLS_UNAVAILABLE"
    ].includes(message) ? 423 : 400;
    return json({ ok: false, error: message }, status);
  }
});
