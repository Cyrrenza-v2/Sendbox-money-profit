import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

async function getUser(req: Request) {
  const header = req.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const { data } = await admin.auth.getUser(header.slice(7));
  return data.user || null;
}

async function getCredential(userId: string) {
  const { data, error } = await admin
    .schema("private")
    .from("deriv_oauth_credentials")
    .select("access_token,refresh_token,expires_at,scopes")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function refreshAccessToken(userId: string, refreshToken: string) {
  const clientId =
    Deno.env.get("DERIV_OAUTH_CLIENT_ID") ||
    Deno.env.get("DERIV_CLIENT_ID") ||
    "34yFXgA3K5sZIE56LQI7J";

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch("https://auth.deriv.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    return {
      ok: false as const,
      error: payload.error_description || payload.error || "Deriv OAuth refresh failed",
    };
  }

  const now = new Date();
  const expiresAt = payload.expires_in
    ? new Date(now.getTime() + Number(payload.expires_in) * 1000).toISOString()
    : null;

  await admin
    .schema("private")
    .from("deriv_oauth_credentials")
    .update({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || refreshToken,
      token_type: payload.token_type || "Bearer",
      expires_at: expiresAt,
      scopes: String(payload.scope || "")
        .split(/[ ,]+/)
        .filter(Boolean),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  return { ok: true as const, accessToken: payload.access_token };
}

async function getAccessToken(userId: string) {
  const credential = await getCredential(userId);
  if (!credential?.access_token) {
    return { ok: false as const, error: "Deriv authorization is missing. Reconnect Deriv through OAuth." };
  }

  const scopes = Array.isArray(credential.scopes) ? credential.scopes.map(String) : [];
  if (!scopes.includes("trade")) {
    return { ok: false as const, error: "Deriv OAuth authorization does not include the trade scope." };
  }

  const expiresAt = credential.expires_at ? Date.parse(credential.expires_at) : 0;
  if (expiresAt && expiresAt <= Date.now() + 120000) {
    if (!credential.refresh_token) {
      return { ok: false as const, error: "Deriv access authorization expired. Reconnect Deriv through OAuth." };
    }
    return refreshAccessToken(userId, credential.refresh_token);
  }

  return { ok: true as const, accessToken: credential.access_token };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ ok: false, error: "VELTRION session required" }, 401);

    const body = await req.json().catch(() => ({}));
    const requestedAccountId = String(body.account_id || "").trim();

    const token = await getAccessToken(user.id);
    if (!token.ok) return json({ ok: false, error: token.error }, 401);

    const accountsResponse = await fetch(
      "https://api.derivws.com/trading/v1/options/accounts",
      { headers: { Authorization: `Bearer ${token.accessToken}` } },
    );
    const accountsPayload = await accountsResponse.json().catch(() => ({}));

    if (!accountsResponse.ok) {
      return json({
        ok: false,
        error: accountsPayload?.errors?.[0]?.message || "Deriv real-account verification failed",
        status: accountsResponse.status,
      }, accountsResponse.status === 401 ? 401 : 502);
    }

    const rawAccounts = Array.isArray(accountsPayload?.data)
      ? accountsPayload.data
      : accountsPayload?.data
        ? [accountsPayload.data]
        : [];

    const realAccounts = rawAccounts.filter(
      (account: any) => String(account?.account_type || "").toLowerCase() === "real",
    );

    const account = realAccounts.find(
      (item: any) => String(item?.account_id || "") === requestedAccountId,
    ) || realAccounts[0];

    if (!account?.account_id) {
      return json({ ok: false, error: "No authorized real Deriv account is available." }, 403);
    }

    const otpResponse = await fetch(
      `https://api.derivws.com/trading/v1/options/accounts/${encodeURIComponent(String(account.account_id))}/otp`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      },
    );
    const otpPayload = await otpResponse.json().catch(() => ({}));

    if (!otpResponse.ok || !otpPayload?.data?.url) {
      return json({
        ok: false,
        error: otpPayload?.errors?.[0]?.message || "Deriv could not issue a real trading WebSocket session.",
        status: otpResponse.status,
      }, otpResponse.status === 401 ? 401 : 502);
    }

    const verifiedAt = new Date().toISOString();
    await admin
      .from("deriv_connections")
      .update({
        status: "connected",
        deriv_loginid: String(account.account_id),
        currency: account.currency || null,
        last_success_at: verifiedAt,
        last_verified_at: verifiedAt,
        last_error: null,
        updated_at: verifiedAt,
      })
      .eq("user_id", user.id);

    return json({
      ok: true,
      connection: "verified",
      account: {
        account_id: String(account.account_id),
        account_type: "real",
        currency: account.currency || null,
        balance: Number.isFinite(Number(account.balance)) ? Number(account.balance) : null,
      },
      websocket: {
        url: otpPayload.data.url,
        expires_in_seconds: 120,
      },
      message: "Authenticated real-account WebSocket session issued. No trade has been placed.",
    });
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "Real Deriv connection verification failed",
    }, 500);
  }
});
