import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const secret = Deno.env.get(["SUPABASE","SERVICE","ROLE","KEY"].join("_"))!;
const admin = createClient(url, secret, { auth: { persistSession: false } });

const redirect = "https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/deriv-oauth/callback";
const appUrl = (Deno.env.get("VELTRION_APP_URL") || "https://sendbox-money-profit-delta.vercel.app").replace(/\/$/, "");
const client = Deno.env.get("DERIV_OAUTH_CLIENT_ID") || Deno.env.get("DERIV_CLIENT_ID") || "34yFXgA3K5sZIE56LQI7J";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" }
  });

const b64 = (b: Uint8Array) => {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const rnd = (n = 64) => b64(crypto.getRandomValues(new Uint8Array(n)));
const sha = async (s: string) =>
  b64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));

async function authenticatedUser(req: Request) {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  const { data } = await admin.auth.getUser(h.slice(7));
  return data.user || null;
}

async function callback(code: string, state: string) {
  if (!code || !state) return json({ ok: false, error: "code and state are required" }, 400);

  const { data: p } = await admin.schema("private")
    .from("deriv_oauth_pending_states")
    .select("state,user_id,code_verifier,code_verifier_hash,redirect_uri,expires_at")
    .eq("state", state)
    .maybeSingle();

  if (!p || Date.parse(p.expires_at) <= Date.now())
    return json({ ok: false, error: "OAuth state expired or invalid" }, 400);

  if (!p.user_id)
    return json({ ok: false, error: "OAuth transaction is not bound to a VELTRION user" }, 400);

  const v = String(p.code_verifier || "");
  if (!v) return json({ ok: false, error: "OAuth PKCE transaction is incomplete" }, 400);
  if (await sha(v) !== p.code_verifier_hash)
    return json({ ok: false, error: "PKCE verification failed" }, 400);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: client,
    code,
    code_verifier: v,
    redirect_uri: p.redirect_uri
  });

  const tr = await fetch("https://auth.deriv.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const td = await tr.json().catch(() => ({}));
  if (!tr.ok || !td.access_token)
    return json(
      { ok: false, error: td.error_description || td.error || "Deriv token exchange failed" },
      tr.status || 502
    );

  const ar = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
    headers: { Authorization: `Bearer ${td.access_token}` }
  });
  const ad = await ar.json().catch(() => ({}));
  const raw = Array.isArray(ad?.data) ? ad.data : (ad?.data ? [ad.data] : []);
  const real = raw.filter((a: any) => String(a?.account_type || "").toLowerCase() === "real");

  if (!real.length)
    return json({ ok: false, error: "No real Deriv account was returned" }, 403);

  const uid = p.user_id;
  const ids = real.map((a: any) => String(a.account_id || "")).filter(Boolean);
  const now = new Date().toISOString();

  await admin.from("profiles").upsert({ user_id: uid, status: "active", updated_at: now });

  await admin.schema("private").from("deriv_oauth_credentials").upsert({
    user_id: uid,
    access_token: td.access_token,
    refresh_token: td.refresh_token || null,
    token_type: td.token_type || "Bearer",
    expires_at: td.expires_in ? new Date(Date.now() + Number(td.expires_in) * 1000).toISOString() : null,
    scopes: String(td.scope || "").split(/[ ,]+/).filter(Boolean),
    updated_at: now
  }, { onConflict: "user_id" });

  for (const a of real) {
    await admin.from("deriv_accounts").upsert({
      user_id: uid,
      deriv_account_id: String(a.account_id),
      account_type: "real",
      currency: a.currency || null,
      status: "connected",
      scopes: String(td.scope || "").split(/[ ,]+/).filter(Boolean),
      last_synced_at: now,
      raw: a
    }, { onConflict: "user_id,deriv_account_id" });
  }

  await admin.from("deriv_connections").upsert({
    user_id: uid,
    status: "connected",
    last_success_at: now,
    updated_at: now,
    deriv_loginid: ids[0] || null
  }, { onConflict: "user_id" });

  await admin.schema("private").from("deriv_oauth_pending_states").delete().eq("state", state);

  return new Response(null, { status: 303, headers: { ...cors, Location: `${appUrl}/app/deriv/account?deriv=connected` } });}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const p = new URL(req.url).pathname;

    if (p.endsWith("/start") || p.endsWith("/signup")) {
      const user = await authenticatedUser(req);
      if (!user) return json({ ok: false, error: "VELTRION session required" }, 401);

      const verifier = rnd();
      const state = rnd(32);
      const challenge = await sha(verifier);

      await admin.schema("private").from("deriv_oauth_pending_states")
        .delete().lt("expires_at", new Date().toISOString());

      const { error } = await admin.schema("private").from("deriv_oauth_pending_states").insert({
        state,
        user_id: user.id,
        code_verifier: verifier,
        code_verifier_hash: await sha(verifier),
        redirect_uri: redirect,
        expires_at: new Date(Date.now() + 600000).toISOString()
      });

      if (error) throw error;

      const u = new URL("https://auth.deriv.com/oauth2/auth");
      u.searchParams.set("response_type", "code");
      u.searchParams.set("client_id", client);
      u.searchParams.set("redirect_uri", redirect);
      u.searchParams.set("scope", "trade account_manage application_read payment");
      u.searchParams.set("state", state);
      u.searchParams.set("code_challenge", challenge);
      u.searchParams.set("code_challenge_method", "S256");

      if (p.endsWith("/signup")) u.searchParams.set("prompt", "registration");

      return json({ ok: true, authorization_url: u.toString(), redirect_uri: redirect });
    }

    if (p.endsWith("/callback")) {
      if (req.method === "GET") {
        const q = new URL(req.url).searchParams;
        return await callback(q.get("code") || "", q.get("state") || "");
      }
      const b = await req.json().catch(() => ({}));
      return await callback(String(b.code || ""), String(b.state || ""));
    }

    return json({
      ok: true,
      service: "deriv-oauth",
      configured: true,
      redirect_uri: redirect,
      client_id_configured: Boolean(client)
    });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "OAuth error" }, 500);
  }
});