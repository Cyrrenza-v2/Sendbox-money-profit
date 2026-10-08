import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

async function getUser(req: Request) {
  const token = String(req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") || "", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user || null;
}

const finitePositive = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const user = await getUser(req);
    if (!user) return json({ ok: false, error: "Authentication required" }, 401);

    if (req.method === "GET") {
      const { data, error } = await db
        .from("mt5_trade_commands")
        .select("id,connection_id,environment,symbol,side,volume,stop_loss,take_profit,client_order_id,status,rejection_reason,mt5_ticket,requested_at,claimed_at,executed_at,expires_at,metadata")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return json({ ok: true, commands: data || [] });
    }

    if (req.method === "DELETE") {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return json({ ok: false, error: "id is required" }, 400);

      const { data, error } = await db
        .from("mt5_trade_commands")
        .update({ status: "CANCELLED" })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("status", "PENDING")
        .select("id,status")
        .maybeSingle();

      if (error) throw error;
      if (!data) return json({ ok: false, error: "Command not found or no longer cancellable" }, 409);
      return json({ ok: true, command: data });
    }

    if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

    const body = await req.json();
    const connectionId = String(body.connection_id || "").trim();
    const symbol = String(body.symbol || "").trim();
    const side = String(body.side || "").toUpperCase();
    const volume = finitePositive(body.volume);
    const stopLoss = body.stop_loss == null ? null : finitePositive(body.stop_loss);
    const takeProfit = body.take_profit == null ? null : finitePositive(body.take_profit);
    const clientOrderId = String(body.client_order_id || crypto.randomUUID()).trim();

    if (!connectionId || !symbol || !["BUY", "SELL"].includes(side) || !volume || !clientOrderId) {
      return json({ ok: false, error: "connection_id, symbol, side, volume and client_order_id are required" }, 400);
    }

    // Production real-MT5 execution is deliberately disabled until the full
    // broker/execution verification gate is completed.
    const environment = "sandbox";

    const { data: connection, error: connectionError } = await db
      .from("mt5_connections")
      .select("id,user_id,environment,status,last_heartbeat_at,server,login")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) throw connectionError;
    if (!connection) return json({ ok: false, error: "MT5 connection not found" }, 404);
    if (String(connection.environment).toLowerCase() !== environment) {
      return json({ ok: false, error: "Only sandbox MT5 commands are enabled in this build" }, 403);
    }

    const heartbeat = connection.last_heartbeat_at ? Date.parse(connection.last_heartbeat_at) : 0;
    if (connection.status !== "connected" || !heartbeat || heartbeat < Date.now() - 45_000) {
      return json({ ok: false, error: "MT5 bridge is not connected or heartbeat is stale" }, 409);
    }

    const { data: existing } = await db
      .from("mt5_trade_commands")
      .select("id,status")
      .eq("user_id", user.id)
      .eq("client_order_id", clientOrderId)
      .maybeSingle();

    if (existing) return json({ ok: true, idempotent: true, command: existing });

    const { data, error } = await db
      .from("mt5_trade_commands")
      .insert({
        user_id: user.id,
        connection_id: connection.id,
        environment,
        symbol,
        side,
        volume,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        client_order_id: clientOrderId,
        metadata: { source: "veltrion_mt5_command", server: connection.server, login: connection.login },
      })
      .select("id,connection_id,environment,symbol,side,volume,stop_loss,take_profit,client_order_id,status,requested_at,expires_at")
      .single();

    if (error) throw error;
    return json({ ok: true, command: data }, 201);
  } catch (error) {
    console.error("mt5-command failed", error instanceof Error ? error.message : "unknown");
    return json({ ok: false, error: "MT5 command request failed" }, 500);
  }
});
