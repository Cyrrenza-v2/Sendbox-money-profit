import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BRIDGE_URL = Deno.env.get("MT5_BRIDGE_URL") || "";
const BRIDGE_SECRET = Deno.env.get("MT5_BRIDGE_SECRET") || "";
const LIVE_ORDERS_ENABLED = Deno.env.get("MT5_LIVE_ORDERS_ENABLED") === "true";
const MAX_ORDER_VOLUME = Number(Deno.env.get("MT5_MAX_ORDER_VOLUME") || "1");

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version, idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

type Operation =
  | "health"
  | "account"
  | "sync"
  | "positions"
  | "orders"
  | "execution_reports"
  | "place_order"
  | "cancel_order";

const ALLOWED_OPERATIONS = new Set<Operation>([
  "health", "account", "sync", "positions", "orders",
  "execution_reports", "place_order", "cancel_order",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function finitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

async function authenticatedUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token || !SUPABASE_ANON_KEY) return null;

  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data, error } = await caller.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

function bridgeBaseUrl(): URL {
  if (!BRIDGE_URL || !BRIDGE_SECRET) throw new Error("MT5_BRIDGE_NOT_CONFIGURED");
  const url = new URL(BRIDGE_URL);
  if (url.protocol !== "https:") throw new Error("MT5_BRIDGE_MUST_USE_HTTPS");
  return url;
}

async function callBridge(
  operation: Operation,
  connection: Record<string, unknown>,
  payload: Record<string, unknown>,
  requestId: string,
) {
  const base = bridgeBaseUrl();
  const path = `/v1/mt5/${operation.replaceAll("_", "-")}`;
  const url = new URL(path, base);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${BRIDGE_SECRET}`,
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify({
        request_id: requestId,
        operation,
        connection: {
          id: connection.id,
          broker: connection.broker,
          server: connection.server,
          login: connection.login,
          environment: connection.environment,
        },
        payload,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const code = isRecord(result) && typeof result.code === "string"
        ? result.code
        : "MT5_BRIDGE_REQUEST_FAILED";
      throw new Error(code);
    }
    if (!isRecord(result)) throw new Error("MT5_BRIDGE_INVALID_RESPONSE");
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("MT5_BRIDGE_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validateOrder(payload: Record<string, unknown>) {
  const symbol = typeof payload.symbol === "string" ? payload.symbol.trim() : "";
  const side = payload.side;
  const volume = payload.volume;
  const orderType = payload.order_type ?? "market";
  const clientOrderId = payload.client_order_id;

  if (!/^[A-Za-z0-9._-]{1,32}$/.test(symbol)) throw new Error("INVALID_SYMBOL");
  if (side !== "buy" && side !== "sell") throw new Error("INVALID_ORDER_SIDE");
  if (!finitePositive(volume) || volume > MAX_ORDER_VOLUME) throw new Error("INVALID_ORDER_VOLUME");
  if (orderType !== "market" && orderType !== "limit" && orderType !== "stop") {
    throw new Error("INVALID_ORDER_TYPE");
  }
  if (typeof clientOrderId !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(clientOrderId)) {
    throw new Error("CLIENT_ORDER_ID_REQUIRED");
  }
  if (orderType !== "market" && !finitePositive(payload.price)) {
    throw new Error("LIMIT_OR_STOP_PRICE_REQUIRED");
  }
  for (const key of ["stop_loss", "take_profit"]) {
    const value = payload[key];
    if (value !== undefined && value !== null && (!finitePositive(value))) {
      throw new Error(`INVALID_${key.toUpperCase()}`);
    }
  }
  return {
    symbol,
    side,
    volume,
    order_type: orderType,
    client_order_id: clientOrderId,
    ...(finitePositive(payload.price) ? { price: payload.price } : {}),
    ...(finitePositive(payload.stop_loss) ? { stop_loss: payload.stop_loss } : {}),
    ...(finitePositive(payload.take_profit) ? { take_profit: payload.take_profit } : {}),
  };
}

async function recordSyncEvent(
  userId: string,
  connectionId: string,
  eventType: string,
  status: string,
  summary: Record<string, unknown>,
) {
  const { error } = await db.from("mt5_sync_events").insert({
    user_id: userId,
    connection_id: connectionId,
    event_type: eventType,
    status,
    payload: summary,
  });
  if (error) console.error("MT5_SYNC_EVENT_WRITE_FAILED", error.code);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const user = await authenticatedUser(req);
    if (!user) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

    const body = await req.json().catch(() => null);
    if (!isRecord(body)) return json({ ok: false, error: "INVALID_JSON_BODY" }, 400);

    const operation = body.operation;
    const connectionId = body.connection_id;
    const payload = isRecord(body.payload) ? body.payload : {};

    if (typeof operation !== "string" || !ALLOWED_OPERATIONS.has(operation as Operation)) {
      return json({ ok: false, error: "UNSUPPORTED_OPERATION" }, 400);
    }
    if (typeof connectionId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(connectionId)) {
      return json({ ok: false, error: "INVALID_CONNECTION_ID" }, 400);
    }

    const { data: connection, error: connectionError } = await db
      .from("mt5_connections")
      .select("id,user_id,broker,server,login,environment,status")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) throw new Error("MT5_CONNECTION_LOOKUP_FAILED");
    if (!connection) return json({ ok: false, error: "MT5_CONNECTION_NOT_FOUND" }, 404);

    const requestId = typeof body.request_id === "string" &&
      /^[A-Za-z0-9_-]{8,80}$/.test(body.request_id)
      ? body.request_id
      : crypto.randomUUID();

    const op = operation as Operation;
    if (op === "place_order") {
      const order = validateOrder(payload);
      const environment = String(connection.environment || "").toLowerCase();
      const isLive = environment === "real" || environment === "live" || environment === "production";
      if (isLive && !LIVE_ORDERS_ENABLED) {
        return json({ ok: false, error: "MT5_LIVE_ORDER_ROUTING_DISABLED" }, 403);
      }
      if (connection.status && !["connected", "online", "active", "ready"].includes(
        String(connection.status).toLowerCase(),
      )) {
        return json({ ok: false, error: "MT5_CONNECTION_NOT_READY" }, 409);
      }
      const result = await callBridge(op, connection, order, requestId);
      await recordSyncEvent(user.id, connection.id, op, "submitted", {
        request_id: requestId,
        client_order_id: order.client_order_id,
        symbol: order.symbol,
        side: order.side,
        volume: order.volume,
        environment: connection.environment,
      });
      return json({ ok: true, request_id: requestId, result });
    }

    if (op === "cancel_order") {
      const externalOrderId = payload.external_order_id;
      if (typeof externalOrderId !== "string" || externalOrderId.length < 1 || externalOrderId.length > 128) {
        return json({ ok: false, error: "INVALID_EXTERNAL_ORDER_ID" }, 400);
      }
    }

    const result = await callBridge(op, connection, payload, requestId);

    if (op === "sync") {
      const account = isRecord(result.account) ? result.account : null;
      const balance = account?.balance;
      const equity = account?.equity;
      const margin = account?.margin;
      const freeMargin = account?.free_margin;
      const accountNumber = typeof account?.account_number === "string"
        ? account.account_number
        : String(connection.login || "");

      if (account && finiteNonNegative(balance) && finiteNonNegative(equity)) {
        const observedAt = new Date().toISOString();
        const { data: existing } = await db.from("mt5_accounts")
          .select("id")
          .eq("user_id", user.id)
          .eq("connection_id", connection.id)
          .eq("account_number", accountNumber)
          .limit(1)
          .maybeSingle();

        const accountRow = {
          user_id: user.id,
          connection_id: connection.id,
          account_number: accountNumber,
          currency: typeof account.currency === "string" ? account.currency : null,
          balance,
          equity,
          margin: finiteNonNegative(margin) ? margin : 0,
          free_margin: finiteNonNegative(freeMargin) ? freeMargin : 0,
          observed_at: observedAt,
          raw: safeRaw(account),
        };

        const write = existing?.id
          ? await db.from("mt5_accounts").update(accountRow).eq("id", existing.id).eq("user_id", user.id)
          : await db.from("mt5_accounts").insert(accountRow);
        if (write.error) throw new Error("MT5_ACCOUNT_SYNC_WRITE_FAILED");

        const snapshot = await db.from("mt5_account_snapshots").insert({
          user_id: user.id,
          connection_id: connection.id,
          balance,
          equity,
          margin: finiteNonNegative(margin) ? margin : 0,
          free_margin: finiteNonNegative(freeMargin) ? freeMargin : 0,
          snapshot_at: observedAt,
          raw: safeRaw(account),
        });
        if (snapshot.error) throw new Error("MT5_ACCOUNT_SNAPSHOT_WRITE_FAILED");
      } else {
        throw new Error("MT5_SYNC_ACCOUNT_PAYLOAD_INVALID");
      }

      await recordSyncEvent(user.id, connection.id, op, "succeeded", {
        request_id: requestId,
        positions_count: Array.isArray(result.positions) ? result.positions.length : null,
        orders_count: Array.isArray(result.orders) ? result.orders.length : null,
        execution_reports_count: Array.isArray(result.execution_reports) ? result.execution_reports.length : null,
        account_synced: true,
      });
    } else {
      await recordSyncEvent(user.id, connection.id, op, "succeeded", {
        request_id: requestId,
        returned_count: Array.isArray(result.items) ? result.items.length : null,
      });
    }

    return json({ ok: true, request_id: requestId, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MT5_ADAPTER_ERROR";
    const status = message === "MT5_BRIDGE_NOT_CONFIGURED" ? 503 :
      message === "MT5_BRIDGE_MUST_USE_HTTPS" ? 503 :
      message === "MT5_BRIDGE_TIMEOUT" ? 504 : 502;
    console.error("MT5_ADAPTER_ERROR", message);
    return json({ ok: false, error: message }, status);
  }
});

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function safeRaw(value: Record<string, unknown>) {
  const { password: _password, token: _token, access_token: _accessToken, secret: _secret, ...rest } = value;
  return rest;
}
