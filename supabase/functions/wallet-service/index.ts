import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const DERIV_API = "https://api.derivws.com";
const db = createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-supabase-api-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function getUser(req: Request) {
  const raw = req.headers.get("Authorization") || "";
  if (!raw.startsWith("Bearer ")) return null;
  const client = createClient(URL, ANON_KEY, {
    global: { headers: { Authorization: raw } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user || null;
}

async function getCredential(userId: string, forceRefresh = false) {
  const { data, error } = await db.schema("private")
    .from("deriv_oauth_credentials")
    .select("access_token,refresh_token,expires_at,scopes")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.access_token) throw new Error("DERIV_REAUTH_REQUIRED");

  const scopes = Array.isArray(data.scopes) ? data.scopes.map(String) : [];
  if (!scopes.includes("payment")) throw new Error("DERIV_PAYMENT_SCOPE_REQUIRED");

  const expiresAt = data.expires_at ? Date.parse(data.expires_at) : 0;
  if (forceRefresh || (expiresAt && expiresAt <= Date.now() + 120000)) {
    if (!data.refresh_token) throw new Error("DERIV_REAUTH_REQUIRED");
    const clientId = Deno.env.get("DERIV_OAUTH_CLIENT_ID") || Deno.env.get("DERIV_CLIENT_ID");
    if (!clientId) throw new Error("DERIV_OAUTH_CLIENT_ID_MISSING");

    const response = await fetch("https://auth.deriv.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: String(data.refresh_token),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) throw new Error("DERIV_REAUTH_REQUIRED");

    const nextScopes = String(payload.scope || scopes.join(" ")).split(/[ ,]+/).filter(Boolean);
    if (!nextScopes.includes("payment")) throw new Error("DERIV_PAYMENT_SCOPE_REQUIRED");

    const nextExpiry = payload.expires_in
      ? new Date(Date.now() + Number(payload.expires_in) * 1000).toISOString()
      : null;

    const { error: saveError } = await db.schema("private").from("deriv_oauth_credentials")
      .update({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token || data.refresh_token,
        token_type: payload.token_type || "Bearer",
        expires_at: nextExpiry,
        scopes: nextScopes,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (saveError) throw saveError;

    return String(payload.access_token);
  }

  return String(data.access_token);
}

async function deriv(userId: string, path: string, init: RequestInit = {}) {
  let token = await getCredential(userId);
  let response = await fetch(DERIV_API + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  let payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    token = await getCredential(userId, true);
    response = await fetch(DERIV_API + path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
    });
    payload = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const e = payload?.errors?.[0];
    throw new Error(e?.message || e?.detail?.message || payload?.error || `DERIV_HTTP_${response.status}`);
  }
  return payload;
}

async function getRealAccount(userId: string) {
  const { data, error } = await db.from("real_trading_accounts")
    .select("id,deriv_account_id,currency,is_active,emergency_stopped")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.deriv_account_id) throw new Error("REAL_DERIV_ACCOUNT_NOT_PROVISIONED");
  return data;
}

async function getDerivWallets(userId: string, currency: string) {
  const payload = await deriv(userId, `/wallet/v1/wallets?conversion_currency=${encodeURIComponent(currency)}`);
  return Array.isArray(payload?.data) ? payload.data : [];
}

function walletIdOf(wallet: any) {
  return String(wallet?.wallet_id || wallet?.id || "").trim();
}

function amountString(value: unknown) {
  const amount = String(value ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) throw new Error("INVALID_TRANSFER_AMOUNT");
  return amount;
}

function platformName(value: unknown) {
  const name = String(value || "options").toLowerCase();
  if (!["mt5", "ctrader", "options", "crypto-exchange", "tradingview"].includes(name)) throw new Error("INVALID_DERIV_PLATFORM");
  return name;
}

async function platformTransfer(userId: string, body: any, validateOnly: boolean) {
  const account = await getRealAccount(userId);
  const walletId = String(body.wallet_id || "").trim();
  if (!walletId) throw new Error("DERIV_WALLET_ID_REQUIRED");

  const currency = String(body.currency || account.currency || "USD").toUpperCase();
  const amount = amountString(body.amount);
  const direction = String(body.direction || "to_wallet");
  if (!["from_wallet", "to_wallet"].includes(direction)) throw new Error("INVALID_TRANSFER_DIRECTION");

  const platform = platformName(body.platform_name);
  const platformAccountId = String(body.platform_account_id || account.deriv_account_id).trim();
  if (platformAccountId !== String(account.deriv_account_id)) throw new Error("DERIV_PLATFORM_ACCOUNT_OWNERSHIP_MISMATCH");

  const providerWallets = await getDerivWallets(userId, currency);
  if (!providerWallets.some(w => walletIdOf(w) === walletId)) throw new Error("DERIV_WALLET_NOT_FOUND_OR_NOT_OWNED");

  const requestId = String(body.request_id || crypto.randomUUID());
  const payload = {
    wallet_id: walletId,
    amount,
    currency,
    direction,
    platform_name: platform,
    platform_account_id: platformAccountId,
    request_id: requestId,
    ...(body.description ? { description: String(body.description).slice(0, 200) } : {}),
  };

  if (validateOnly) {
    return await deriv(userId, "/wallet/v1/transfers/validate", {
      method: "POST",
      body: JSON.stringify({ ...payload, request_id: `VAL-${crypto.randomUUID()}` }),
    });
  }

  const result = await deriv(userId, "/wallet/v1/transfers/platforms", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  await db.from("real_trading_audit").insert({
    account_id: account.id,
    user_id: userId,
    action: direction === "to_wallet" ? "DERIV_PLATFORM_TO_WALLET" : "DERIV_WALLET_TO_PLATFORM",
    result: "SUCCESS",
    metadata: {
      wallet_id: walletId,
      amount,
      currency,
      direction,
      platform_name: platform,
      platform_account_id: platformAccountId,
      request_id: result?.data?.request_id || requestId,
      provider_response: result?.data || result,
    },
  });

  return result?.data || result;
}

async function handle(userId: string, body: any) {
  const op = String(body.operation || "wallets");

  if (op === "wallets") {
    return { wallets: await getDerivWallets(userId, String(body.currency || "USD").toUpperCase()) };
  }

  if (op === "transactions") {
    return await deriv(userId, `/wallet/v1/transactions/${encodeURIComponent(String(body.wallet_type || "main"))}?per_page=100`);
  }

  if (op === "validate_transfer") return await platformTransfer(userId, body, true);
  if (op === "platform_transfer") return await platformTransfer(userId, body, false);

  if (op === "platform_transfer_status") {
    const requestId = String(body.request_id || "").trim();
    if (!requestId) throw new Error("REQUEST_ID_REQUIRED");
    return await deriv(userId, `/wallet/v1/transactions/${encodeURIComponent(String(body.wallet_type || "main"))}?request_id=${encodeURIComponent(requestId)}&per_page=20`);
  }

  if (op === "withdraw_verification") {
    const agentId = String(body.agent_id || "").trim();
    if (!agentId) throw new Error("PAYMENT_AGENT_ID_REQUIRED");
    const amount = amountString(body.amount);
    const currency = String(body.currency || "USD").toUpperCase();
    return await deriv(userId, "/payment-agents/v1/withdraw/verification_code", {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId, amount, currency }),
    });
  }

  if (op === "withdraw") {
    const agentId = String(body.agent_id || "").trim();
    const amount = amountString(body.amount);
    const currency = String(body.currency || "USD").toUpperCase();
    const verificationCode = String(body.verification_code || "").trim();
    if (!agentId || !/^\d{6}$/.test(verificationCode)) throw new Error("PAYMENT_AGENT_WITHDRAWAL_FIELDS_REQUIRED");

    const result = await deriv(userId, "/payment-agents/v1/withdraw", {
      method: "POST",
      body: JSON.stringify({
        agent_id: agentId,
        amount,
        currency,
        verification_code: verificationCode,
        request_id: String(body.request_id || crypto.randomUUID()),
      }),
    });
    return result?.data || result;
  }

  if (op === "withdraw_status") {
    const requestId = String(body.request_id || "").trim();
    if (!requestId) throw new Error("REQUEST_ID_REQUIRED");
    return await deriv(userId, `/payment-agents/v1/withdraw/${encodeURIComponent(requestId)}`);
  }

  throw new Error("UNSUPPORTED_DERIV_WALLET_OPERATION");
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await getUser(req);
  if (!user) return json({ ok: false, error: "Authentication required" }, 401);

  try {
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    return json({ ok: true, data: await handle(user.id, body) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "WALLET_REQUEST_FAILED";
    return json({ ok: false, error: message }, message === "DERIV_PAYMENT_SCOPE_REQUIRED" ? 403 : 400);
  }
});
