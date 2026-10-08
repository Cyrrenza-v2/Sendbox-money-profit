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

async function userFromRequest(req: Request) {
  const raw = req.headers.get("Authorization") || "";
  if (!raw.startsWith("Bearer ")) return null;
  const client = createClient(URL, ANON_KEY, { global: { headers: { Authorization: raw } }, auth: { persistSession: false } });
  const { data } = await client.auth.getUser();
  return data.user || null;
}

async function tokenFor(userId: string, forceRefresh = false) {
  const { data, error } = await db.schema("private").from("deriv_oauth_credentials")
    .select("access_token,refresh_token,expires_at,scopes").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data?.access_token) throw new Error("DERIV_REAUTH_REQUIRED");
  const scopes = Array.isArray(data.scopes) ? data.scopes.map(String) : [];
  if (!scopes.includes("payment")) throw new Error("DERIV_PAYMENT_SCOPE_REQUIRED");

  const exp = data.expires_at ? Date.parse(data.expires_at) : 0;
  if (forceRefresh || (exp && exp <= Date.now() + 120000)) {
    if (!data.refresh_token) throw new Error("DERIV_REAUTH_REQUIRED");
    const clientId = Deno.env.get("DERIV_OAUTH_CLIENT_ID") || Deno.env.get("DERIV_CLIENT_ID");
    if (!clientId) throw new Error("DERIV_OAUTH_CLIENT_ID_MISSING");
    const r = await fetch("https://auth.deriv.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", client_id: clientId, refresh_token: String(data.refresh_token) }),
    });
    const p = await r.json().catch(() => ({}));
    if (!r.ok || !p.access_token) throw new Error("DERIV_REAUTH_REQUIRED");
    const nextScopes = String(p.scope || scopes.join(" ")).split(/[ ,]+/).filter(Boolean);
    if (!nextScopes.includes("payment")) throw new Error("DERIV_PAYMENT_SCOPE_REQUIRED");
    const { error: saveError } = await db.schema("private").from("deriv_oauth_credentials").update({
      access_token: p.access_token, refresh_token: p.refresh_token || data.refresh_token,
      token_type: p.token_type || "Bearer",
      expires_at: p.expires_in ? new Date(Date.now() + Number(p.expires_in) * 1000).toISOString() : null,
      scopes: nextScopes, updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    if (saveError) throw saveError;
    return String(p.access_token);
  }
  return String(data.access_token);
}

async function deriv(userId: string, path: string, init: RequestInit = {}) {
  let token = await tokenFor(userId);
  let r = await fetch(DERIV_API + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  let p = await r.json().catch(() => ({}));
  if (r.status === 401) {
    token = await tokenFor(userId, true);
    r = await fetch(DERIV_API + path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
    p = await r.json().catch(() => ({}));
  }
  if (!r.ok) {
    const e = p?.errors?.[0];
    throw new Error(e?.message || e?.detail?.message || p?.error || `DERIV_HTTP_${r.status}`);
  }
  return p;
}

async function withdrawal(userId: string, id: string) {
  const { data, error } = await db.from("withdrawals")
    .select("id,user_id,wallet_id,amount,currency,status,provider_reference,metadata")
    .eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("WITHDRAWAL_NOT_FOUND");
  return data;
}

async function requestWithdrawal(userId: string, b: any) {
  const walletId = String(b.wallet_id || "").trim();
  const destination = String(b.destination || "").trim();
  const amount = Number(b.amount);
  const idempotencyKey = String(b.idempotency_key || crypto.randomUUID());
  if (!walletId || !Number.isFinite(amount) || amount <= 0 || !destination || idempotencyKey.length < 8) {
    throw new Error("INVALID_WITHDRAWAL_REQUEST");
  }

  const { data, error } = await db.rpc("request_profit_withdrawal", {
    p_user_id: userId,
    p_wallet_id: walletId,
    p_amount: amount,
    p_destination: destination,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  const id = String(result?.withdrawalId || "");
  if (id) {
    const { data: row } = await db.from("withdrawals").select("metadata").eq("id", id).eq("user_id", userId).maybeSingle();
    const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
    await db.from("withdrawals").update({
      metadata: {
        ...metadata,
        deriv_wallet_id: String(b.deriv_wallet_id || ""),
        platform_name: String(b.platform_name || "options"),
        requested_via: "veltrion_profit_withdrawal",
      },
    }).eq("id", id).eq("user_id", userId);
  }
  return result;
}

async function requestVerification(userId: string, b: any) {
  const id = String(b.withdrawal_id || "").trim();
  const agentId = String(b.agent_id || "").trim();
  if (!id || !agentId) throw new Error("WITHDRAWAL_ID_AND_AGENT_REQUIRED");
  const w = await withdrawal(userId, id);
  if (!["requested", "processing"].includes(String(w.status))) throw new Error("WITHDRAWAL_NOT_REQUESTABLE");
  const result = await deriv(userId, "/payment-agents/v1/withdraw/verification_code", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, amount: Number(w.amount).toFixed(2), currency: w.currency }),
  });
  return result?.data || result;
}

async function executeWithdrawal(userId: string, b: any) {
  const id = String(b.withdrawal_id || "").trim();
  const agentId = String(b.agent_id || "").trim();
  const verificationCode = String(b.verification_code || "").trim();
  if (!id || !agentId || !/^\d{6}$/.test(verificationCode)) throw new Error("WITHDRAWAL_EXECUTION_FIELDS_REQUIRED");

  const w = await withdrawal(userId, id);
  if (w.status === "completed") return { status: "completed", withdrawal_id: id, idempotent: true };
  if (!["requested", "processing"].includes(String(w.status))) throw new Error("WITHDRAWAL_NOT_EXECUTABLE");

  const metadata = w.metadata && typeof w.metadata === "object" ? w.metadata : {};
  const account = await db.from("real_trading_accounts").select("id,deriv_account_id,currency").eq("user_id", userId).maybeSingle();
  if (account.error) throw account.error;
  if (!account.data?.deriv_account_id) throw new Error("REAL_DERIV_ACCOUNT_NOT_PROVISIONED");

  let nextMetadata = { ...metadata, agent_id: agentId };

  if (!metadata.platform_transfer_request_id) {
    if (w.status === "requested") {
      const { error } = await db.rpc("settle_profit_withdrawal", {
        p_withdrawal_id: id, p_status: "processing", p_external_reference: null,
      });
      if (error) throw error;
    }

    const walletId = String(b.deriv_wallet_id || metadata.deriv_wallet_id || "").trim();
    if (!walletId) throw new Error("DERIV_WALLET_ID_REQUIRED");

    const platformName = String(b.platform_name || metadata.platform_name || "options").toLowerCase();
    const transferRequestId = crypto.randomUUID();
    const transferPayload = {
      wallet_id: walletId,
      amount: Number(w.amount).toFixed(2),
      currency: w.currency,
      direction: "to_wallet",
      platform_name: platformName,
      platform_account_id: String(account.data.deriv_account_id),
      request_id: transferRequestId,
      description: "VELTRION realized-profit repatriation",
    };

    // Validate before moving funds. Validation itself moves no money.
    await deriv(userId, "/wallet/v1/transfers/validate", {
      method: "POST",
      body: JSON.stringify({ ...transferPayload, request_id: `VAL-${crypto.randomUUID()}` }),
    });

    try {
      const transfer = await deriv(userId, "/wallet/v1/transfers/platforms", {
        method: "POST",
        body: JSON.stringify(transferPayload),
      });
      nextMetadata = {
        ...nextMetadata,
        deriv_wallet_id: walletId,
        platform_transfer_request_id: transfer?.data?.request_id || transferRequestId,
        platform_transfer: transfer?.data || transfer,
      };
    } catch (error) {
      // No platform transfer was confirmed, so the reserved profit can be released safely.
      await db.rpc("settle_profit_withdrawal", {
        p_withdrawal_id: id, p_status: "failed", p_external_reference: null,
      }).catch(() => {});
      throw error;
    }

    await db.from("withdrawals").update({ metadata: nextMetadata }).eq("id", id).eq("user_id", userId);
  }

  const providerRequestId = String(metadata.provider_withdrawal_request_id || nextMetadata.provider_withdrawal_request_id || crypto.randomUUID());
  try {
    const result = await deriv(userId, "/payment-agents/v1/withdraw", {
      method: "POST",
      body: JSON.stringify({
        agent_id: agentId,
        amount: Number(w.amount).toFixed(2),
        currency: w.currency,
        verification_code: verificationCode,
        request_id: providerRequestId,
      }),
    });

    const providerData = result?.data || result;
    const providerStatus = String(providerData?.status || "").toLowerCase();
    const mergedMetadata = {
      ...nextMetadata,
      provider_withdrawal_request_id: providerRequestId,
      provider_response: providerData,
    };
    await db.from("withdrawals").update({
      metadata: mergedMetadata,
      provider_reference: providerRequestId,
    }).eq("id", id).eq("user_id", userId);

    if (providerStatus === "complete") {
      const { data: settled, error } = await db.rpc("settle_profit_withdrawal", {
        p_withdrawal_id: id, p_status: "completed", p_external_reference: providerRequestId,
      });
      if (error) throw error;
      return settled;
    }

    // Pending is the normal initial state. Keep the reservation until Deriv confirms final status.
    return { status: "processing", withdrawal_id: id, provider_request_id: providerRequestId, provider: providerData };
  } catch (error) {
    // The provider call can time out after accepting the request. Do not release the
    // reservation in that ambiguous case; status can be reconciled with withdraw_status.
    const message = error instanceof Error ? error.message : "DERIV_WITHDRAWAL_FAILED";
    await db.from("withdrawals").update({
      status: "processing",
      provider_reference: providerRequestId,
      metadata: { ...nextMetadata, provider_withdrawal_request_id: providerRequestId, last_error: message },
    }).eq("id", id).eq("user_id", userId);
    return { status: "processing", withdrawal_id: id, provider_request_id: providerRequestId, reconciliation_required: true };
  }
}

async function withdrawalStatus(userId: string, b: any) {
  const id = String(b.withdrawal_id || "").trim();
  if (!id) throw new Error("WITHDRAWAL_ID_REQUIRED");
  const w = await withdrawal(userId, id);
  const metadata = w.metadata && typeof w.metadata === "object" ? w.metadata : {};
  const requestId = String(b.provider_request_id || metadata.provider_withdrawal_request_id || w.provider_reference || "").trim();
  if (!requestId) return { status: w.status, withdrawal_id: id, provider_status: null };

  const result = await deriv(userId, `/payment-agents/v1/withdraw/${encodeURIComponent(requestId)}`);
  const provider = result?.data || result;
  const status = String(provider?.status || "").toLowerCase();

  if (status === "complete" && w.status !== "completed") {
    const { data: settled, error } = await db.rpc("settle_profit_withdrawal", {
      p_withdrawal_id: id, p_status: "completed", p_external_reference: requestId,
    });
    if (error) throw error;
    return { ...settled, provider };
  }

  if (["rejected", "failed"].includes(status) && ["requested", "processing"].includes(String(w.status))) {
    const { data: settled, error } = await db.rpc("settle_profit_withdrawal", {
      p_withdrawal_id: id, p_status: status, p_external_reference: requestId,
    });
    if (error) throw error;
    return { ...settled, provider };
  }

  return { status: w.status, withdrawal_id: id, provider_request_id: requestId, provider };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await userFromRequest(req);
  if (!user) return json({ ok: false, error: "Authentication required" }, 401);

  try {
    if (req.method === "GET") {
      const { data, error } = await db.from("withdrawals").select("*").eq("user_id", user.id).order("requested_at", { ascending: false }).limit(100);
      if (error) throw error;
      return json({ ok: true, data: data || [] });
    }

    const b = await req.json().catch(() => ({}));
    const op = String(b.operation || "request");
    if (op === "request") return json({ ok: true, data: await requestWithdrawal(user.id, b) });
    if (op === "verification_code") return json({ ok: true, data: await requestVerification(user.id, b) });
    if (op === "execute") return json({ ok: true, data: await executeWithdrawal(user.id, b) });
    if (op === "status") return json({ ok: true, data: await withdrawalStatus(user.id, b) });
    throw new Error("UNSUPPORTED_WITHDRAWAL_OPERATION");
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "WITHDRAWAL_REQUEST_FAILED" }, 400);
  }
});
