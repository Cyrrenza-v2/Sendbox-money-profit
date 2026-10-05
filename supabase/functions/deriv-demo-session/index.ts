import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const apiBase = "https://api.derivws.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" }
});

async function getUser(req: Request) {
  const header = req.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const { data } = await admin.auth.getUser(header.slice(7));
  return data.user || null;
}

async function accessTokenFor(userId: string) {
  const { data: credential, error } = await admin.schema("private")
    .from("deriv_oauth_credentials")
    .select("access_token,refresh_token,expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!credential?.access_token) throw new Error("DERIV_OAUTH_REQUIRED");

  const expiresAt = credential.expires_at ? Date.parse(credential.expires_at) : 0;
  if (!expiresAt || expiresAt > Date.now() + 120000) return credential.access_token;
  if (!credential.refresh_token) throw new Error("DERIV_REAUTH_REQUIRED");

  const clientId = Deno.env.get("DERIV_OAUTH_CLIENT_ID") || Deno.env.get("DERIV_CLIENT_ID") || "34yFXgA3K5sZIE56LQI7J";
  const refresh = await fetch("https://auth.deriv.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: credential.refresh_token
    })
  });
  const payload = await refresh.json().catch(() => ({}));
  if (!refresh.ok || !payload.access_token) throw new Error("DERIV_REAUTH_REQUIRED");

  const updatedAt = new Date().toISOString();
  const { error: updateError } = await admin.schema("private").from("deriv_oauth_credentials")
    .update({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || credential.refresh_token,
      token_type: payload.token_type || "Bearer",
      expires_at: payload.expires_in ? new Date(Date.now() + Number(payload.expires_in) * 1000).toISOString() : null,
      scopes: String(payload.scope || "").split(/[ ,]+/).filter(Boolean),
      updated_at: updatedAt
    }).eq("user_id", userId);
  if (updateError) throw updateError;
  return String(payload.access_token);
}

function requestBalance(url: string) {
  return new Promise<any>((resolve, reject) => {
    const ws = new WebSocket(url);
    const reqId = Date.now() % 2000000000;
    let settled = false;
    const timer = setTimeout(() => finish(reject, new Error("DERIV_DEMO_BALANCE_TIMEOUT")), 12000);
    const finish = (fn: (value: any) => void, value: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      fn(value);
    };
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ balance: 1, req_id: reqId }));
    });
    ws.addEventListener("message", event => {
      let message: any;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      if (message.error) return finish(reject, new Error(message.error.message || "DERIV_DEMO_BALANCE_FAILED"));
      if (message.msg_type === "balance" && (!message.req_id || message.req_id === reqId))
        finish(resolve, message.balance || {});
    });
    ws.addEventListener("error", () => finish(reject, new Error("DERIV_DEMO_WEBSOCKET_ERROR")));
  });
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "POST_REQUIRED" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ ok: false, error: "VELTRION_SESSION_REQUIRED" }, 401);

    const { data: demoAccount, error: accountError } = await admin.from("deriv_accounts")
      .select("deriv_account_id,currency,account_type,status")
      .eq("user_id", user.id)
      .eq("account_type", "demo")
      .eq("status", "connected")
      .order("last_synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (accountError) throw accountError;
    if (!demoAccount?.deriv_account_id) throw new Error("DERIV_DEMO_API_ACCOUNT_NOT_CONNECTED");

    const token = await accessTokenFor(user.id);
    const otpResponse = await fetch(
      `${apiBase}/trading/v1/options/accounts/${encodeURIComponent(demoAccount.deriv_account_id)}/otp`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    const otp = await otpResponse.json().catch(() => ({}));
    if (!otpResponse.ok || !otp?.data?.url) {
      throw new Error(otp?.errors?.[0]?.message || "DERIV_DEMO_OTP_FAILED");
    }

    const wsUrl = String(otp.data.url);
    if (!wsUrl.includes("/trading/v1/options/ws/demo")) {
      throw new Error("DERIV_DID_NOT_ISSUE_DEMO_WEBSOCKET");
    }

    const balance = await requestBalance(wsUrl);
    const amount = Number(balance.balance);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("DERIV_DEMO_BALANCE_INVALID");

    const now = new Date().toISOString();
    await admin.from("deriv_accounts").update({
      currency: balance.currency || demoAccount.currency || null,
      status: "connected",
      last_synced_at: now,
      raw: { source: "authenticated_deriv_demo_websocket", loginid: balance.loginid || demoAccount.deriv_account_id, currency: balance.currency || demoAccount.currency || null }
    }).eq("user_id", user.id).eq("deriv_account_id", demoAccount.deriv_account_id);

    await admin.from("deriv_connections").update({
      status: "connected",
      deriv_loginid: demoAccount.deriv_account_id,
      currency: balance.currency || demoAccount.currency || null,
      last_success_at: now,
      last_verified_at: now,
      last_error: null,
      updated_at: now
    }).eq("user_id", user.id);

    return json({
      ok: true,
      account_type: "demo",
      account_id: demoAccount.deriv_account_id,
      balance: amount,
      currency: String(balance.currency || demoAccount.currency || "USD"),
      observed_at: now,
      source: "authenticated_deriv_demo_websocket",
      read_only: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DERIV_DEMO_SESSION_FAILED";
    const status = message === "VELTRION_SESSION_REQUIRED" ? 401 : 400;
    return json({ ok: false, error: message }, status);
  }
});
