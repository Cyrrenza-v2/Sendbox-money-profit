import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PUBLIC_ENDPOINTS = [
  "wss://api.derivws.com/trading/v1/options/ws/public",
  "wss://ws.binaryws.com/websockets/v3",
  "wss://ws.derivws.com/websockets/v3?app_id=1089"
];

function wsCall(url: string, payload: Record<string, unknown>, expected: string, timeoutMs = 8000) {
  return new Promise<any>((resolve, reject) => {
    const ws = new WebSocket(url);
    const reqId = Number(payload.req_id || Date.now());
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("DERIV_PUBLIC_REQUEST_TIMEOUT"));
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
        finish(reject, new Error(data.error.message || "DERIV_PUBLIC_API_ERROR"));
        return;
      }
      if (data.msg_type === expected && (!data.req_id || data.req_id === reqId))
        finish(resolve, data);
    });
    ws.addEventListener("error", () => finish(reject, new Error("DERIV_PUBLIC_WEBSOCKET_ERROR")));
    ws.addEventListener("close", () => finish(reject, new Error("DERIV_PUBLIC_WEBSOCKET_CLOSED")));
  });
}

async function publicWsCall(payload: Record<string, unknown>, expected: string) {
  let lastError: unknown = null;
  for (const endpoint of PUBLIC_ENDPOINTS) {
    try { return await wsCall(endpoint, payload, expected); }
    catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error("DERIV_PUBLIC_MARKET_DATA_UNAVAILABLE");
}

function normalizeMarket(item: any) {
  const symbol = String(item?.underlying_symbol ?? item?.symbol ?? "").trim();
  if (!symbol) return null;
  return {
    symbol,
    name: String(item?.underlying_symbol_name ?? item?.display_name ?? symbol),
    market: String(item?.market_display_name ?? item?.market ?? item?.underlying_symbol_type ?? "Other"),
    subgroup: String(item?.subgroup ?? item?.submarket ?? "")
  };
}

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

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await getUser(req);
  if (!user) return json({ ok: false, error: "Authentication required" }, 401);

  try {
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const op = String(body.operation || "catalog");

    if (op === "catalog") {
      const response = await publicWsCall({ active_symbols: "full", req_id: 62001 }, "active_symbols");
      const markets = Array.isArray(response?.active_symbols)
        ? response.active_symbols.map(normalizeMarket).filter(Boolean)
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
      const { error } = await db.from("market_symbols").upsert(rows, { onConflict: "symbol" });
      if (error) throw error;
      return json({ ok: true, data: { markets, count: markets.length, source: "server_deriv_public_websocket", observed_at: updatedAt } });
    }

    if (op === "tick") {
      const symbol = String(body.symbol || "").trim();
      if (!symbol || symbol.length > 64) return json({ ok: false, error: "MARKET_SYMBOL_REQUIRED" }, 400);
      const response = await publicWsCall({ ticks: symbol, subscribe: 0, req_id: 62002 }, "tick");
      const tick = response?.tick;
      const quote = Number(tick?.quote);
      const epoch = Number(tick?.epoch);
      if (!Number.isFinite(quote) || !Number.isFinite(epoch)) throw new Error("DERIV_PUBLIC_TICK_INVALID");
      return json({ ok: true, data: {
        symbol: String(tick?.symbol ?? tick?.underlying_symbol ?? symbol),
        quote, epoch, pipSize: tick?.pip_size ?? null,
        source: "server_deriv_public_websocket"
      }});
    }

    return json({ ok: false, error: "UNSUPPORTED_MARKET_OPERATION" }, 400);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "DERIV_PUBLIC_MARKET_DATA_UNAVAILABLE" }, 502);
  }
});
