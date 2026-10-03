import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond({ ok: false, error: "AUTH_REQUIRED" }, 401);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return respond({ ok: false, error: "AUTH_REQUIRED" }, 401);

  let body: { wallet_id?: string; amount?: number; destination?: string };
  try {
    body = await req.json();
  } catch {
    return respond({ ok: false, error: "INVALID_REQUEST_BODY" }, 400);
  }

  const amount = Number(body.amount);
  const walletId = typeof body.wallet_id === "string" ? body.wallet_id : "";
  const destination = typeof body.destination === "string" ? body.destination.trim() : "";
  if (!walletId || !Number.isFinite(amount) || amount <= 0 || !destination) {
    return respond({ ok: false, error: "INVALID_WITHDRAWAL_REQUEST" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await admin.rpc("request_profit_withdrawal_for_user", {
    p_user_id: user.id,
    p_wallet_id: walletId,
    p_amount: amount,
    p_destination: destination
  });
  if (error) {
    const known = new Set([
      "WALLET_NOT_FOUND",
      "INVALID_AMOUNT",
      "INVALID_DESTINATION",
      "INSUFFICIENT_WITHDRAWABLE_BALANCE"
    ]);
    const message = error.message || "";
    const code = [...known].find((candidate) => message.includes(candidate));
    return respond({ ok: false, error: code || "WITHDRAWAL_REQUEST_FAILED" }, code ? 400 : 500);
  }

  return respond({ ok: true, data });
});
