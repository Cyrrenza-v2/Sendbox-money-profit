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

const SYSTEM_ENDPOINTS = [
  "wss://ws.derivws.com/websockets/v3?app_id=1089",
  "wss://ws.binaryws.com/websockets/v3"
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

async function publicWsCall(payload: Record<string, unknown>, expected: string, timeoutMs = 4000) {
  let lastError: unknown = null;
  for (const endpoint of PUBLIC_ENDPOINTS) {
    try { return await wsCall(endpoint, payload, expected, timeoutMs); }
    catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error("DERIV_PUBLIC_MARKET_DATA_UNAVAILABLE");
}


const CATEGORY_ALIASES: Record<string,string> = {
  basket_indices:"Basket Indices", basket:"Basket Indices", conversions:"Conversions", conversion:"Conversions", currency_conversion:"Conversions",
  crash_boom_flip_indices:"Crash Boom Flip Indices", crash_boom_flip:"Crash Boom Flip Indices", crash_boom_indices:"Crash Boom Indices", crash_boom:"Crash Boom Indices",
  crypto:"Crypto", cryptocurrency:"Crypto", cryptocurrencies:"Crypto", dex_indices:"DEX Indices", dex:"DEX Indices", drift_switching_indices:"Drift Switching Indices", drift_switching:"Drift Switching Indices",
  etfs:"ETFs", etf:"ETFs", energies:"Energies", energy:"Energies", equities:"Equities", equity:"Equities", exponential_growth_indices:"Exponential Growth Indices", exponential_growth:"Exponential Growth Indices",
  forex_exotic:"Forex Exotic", exotic_pairs:"Forex Exotic", exotic:"Forex Exotic", forex_major:"Forex Major", major_pairs:"Forex Major", major:"Forex Major", forex_micro:"Forex Micro", micro_pairs:"Forex Micro", micro:"Forex Micro", forex_minor:"Forex Minor", minor_pairs:"Forex Minor", minor:"Forex Minor",
  hybrid_indices:"Hybrid Indices", hybrid:"Hybrid Indices", indices:"Indices", index:"Indices", jump_indices:"Jump Indices", jump:"Jump Indices", laddered_volatility_indices:"Laddered Volatility Indices", laddered_volatility:"Laddered Volatility Indices", metals:"Metals", metal:"Metals",
  multi_step_indices:"Multi Step Indices", multi_step:"Multi Step Indices", range_break:"Range Break", range_break_indices:"Range Break", skewed_step:"Skewed Step", skewed_step_indices:"Skewed Step", soft_commodities:"Soft Commodities", soft_commodity:"Soft Commodities",
  spot_volatility_indices:"Spot Volatility Indices", spot_volatility:"Spot Volatility Indices", step_indices:"Step Indices", step:"Step Indices", stock_indices:"Stock Indices", stock_index:"Stock Indices", trek_indices:"Trek Indices", trek:"Trek Indices",
  volatility_crash_boom_indices:"Volatility Crash/Boom Indices", volatility_crash_boom:"Volatility Crash/Boom Indices", volatility_indices:"Volatility Indices", volatility:"Volatility Indices", volatility_switch_indices:"Volatility Switch Indices", volatility_switch:"Volatility Switch Indices"
};
function classifyDerivMarket(item:any){
  const symbol=String(item?.symbol||"").trim(), market=String(item?.market||"").trim().toLowerCase(), subgroup=String(item?.subgroup||"").trim().toLowerCase(), name=String(item?.name||"").trim().toLowerCase();
  for(const key of [subgroup,market]){ const normalized=key.replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""); if(CATEGORY_ALIASES[normalized]) return CATEGORY_ALIASES[normalized]; for(const alias of Object.keys(CATEGORY_ALIASES)) if(normalized.includes(alias)) return CATEGORY_ALIASES[alias]; }
  const text=`${name} ${symbol}`;
  if(/exponential growth/.test(text)) return "Exponential Growth Indices";
  if(/crash.*boom.*flip|flip.*crash.*boom/.test(text)) return "Crash Boom Flip Indices";
  if(/crash.*boom/.test(text)) return "Crash Boom Indices";
  if(/range break/.test(text)) return "Range Break"; if(/skewed step/.test(text)) return "Skewed Step"; if(/multi step/.test(text)) return "Multi Step Indices"; if(/drift switching/.test(text)) return "Drift Switching Indices"; if(/laddered volatility/.test(text)) return "Laddered Volatility Indices"; if(/volatility switch/.test(text)) return "Volatility Switch Indices"; if(/volatility.*crash|crash.*volatility|volatility.*boom|boom.*volatility/.test(text)) return "Volatility Crash/Boom Indices"; if(/spot volatility/.test(text)) return "Spot Volatility Indices"; if(/volatility/.test(text)||/^r_/.test(symbol.toLowerCase())||/^1hz/.test(symbol.toLowerCase())) return "Volatility Indices"; if(/jump/.test(text)) return "Jump Indices"; if(/step/.test(text)) return "Step Indices"; if(/trek/.test(text)) return "Trek Indices"; if(/dex/.test(text)) return "DEX Indices"; if(/basket/.test(text)) return "Basket Indices"; if(/crypto|bitcoin|ethereum|litecoin|dogecoin/.test(text)) return "Crypto"; if(/etf/.test(text)) return "ETFs"; if(/energy|oil|brent|crude|gas/.test(text)) return "Energies"; if(/gold|silver|platinum|palladium/.test(text)) return "Metals"; if(/coffee|cocoa|cotton|sugar|wheat|corn/.test(text)) return "Soft Commodities"; if(/equity|share/.test(text)) return "Equities"; if(/forex/.test(market)||/^frx/i.test(symbol)||/\//.test(name)) return "Forex Major"; return "Indices";
}

function normalizeMarket(item: any) {
  const symbol = String(item?.underlying_symbol ?? item?.symbol ?? "").trim();
  if (!symbol) return null;
  return {
    symbol,
    name: String(item?.underlying_symbol_name ?? item?.display_name ?? symbol),
    market: classifyDerivMarket({ symbol, name: String(item?.underlying_symbol_name ?? item?.display_name ?? symbol), market: item?.market_display_name ?? item?.market ?? item?.underlying_symbol_type, subgroup: item?.subgroup ?? item?.submarket }),
    subgroup: String(item?.subgroup ?? item?.submarket ?? "")
  };
}

function extractTradingTimeSymbols(node:any, marketName = "", submarketName = "", out:Map<string,any> = new Map()) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const value of node) extractTradingTimeSymbols(value, marketName, submarketName, out);
    return out;
  }

  // Deriv trading_times is hierarchical: markets[] -> submarkets[] -> symbols[].
  // Each symbol entry carries its own { name, symbol, times, trading_days, events }.
  if (Array.isArray((node as any).markets)) {
    for (const market of (node as any).markets) {
      const nextMarket = String(market?.name || marketName || "").trim();
      extractTradingTimeSymbols(market, nextMarket, "", out);
    }
    return out;
  }
  if (Array.isArray((node as any).submarkets)) {
    for (const submarket of (node as any).submarkets) {
      const nextSubmarket = String(submarket?.name || submarketName || "").trim();
      extractTradingTimeSymbols(submarket, marketName, nextSubmarket, out);
    }
    return out;
  }
  if (Array.isArray((node as any).symbols)) {
    for (const symbol of (node as any).symbols) {
      const normalized = normalizeMarket({
        symbol: symbol?.underlying_symbol ?? symbol?.symbol,
        display_name: symbol?.name || symbol?.underlying_symbol_name || symbol?.underlying_symbol || symbol?.symbol,
        market_display_name: marketName,
        submarket_display_name: submarketName,
        market: marketName,
        submarket: submarketName
      });
      if (normalized?.symbol) out.set(normalized.symbol, normalized);
    }
    return out;
  }

  // Defensive fallback for future response shapes.
  for (const [key, value] of Object.entries(node)) {
    if (!value || typeof value !== "object") continue;
    const lowerKeys = Object.keys(value).map(k => k.toLowerCase());
    const looksLikeSchedule = lowerKeys.some(k => ["open","close","times","trading_days","events"].includes(k));
    const hasTimesObject = (value as any).times && typeof (value as any).times === "object";
    const isSymbolKey = /^[A-Za-z0-9_]{2,30}$/.test(key) && !["open","close","times","trading_days","events"].includes(key.toLowerCase());
    if (isSymbolKey && (looksLikeSchedule || hasTimesObject)) {
      const normalized = normalizeMarket({ symbol: key, display_name: key, market: marketName, submarket: submarketName });
      if (normalized?.symbol) out.set(normalized.symbol, normalized);
    }
    extractTradingTimeSymbols(value, marketName, submarketName, out);
  }
  return out;
}

async function systemWsCall(payload: Record<string, unknown>, expected: string, timeoutMs = 8000) {
  const attempts = SYSTEM_ENDPOINTS.map(endpoint => wsCall(endpoint, payload, expected, timeoutMs));
  try {
    return await Promise.any(attempts);
  } catch (error) {
    const errors = error instanceof AggregateError ? error.errors : [];
    const lastError = errors.find((item: unknown) => item instanceof Error);
    throw lastError instanceof Error
      ? lastError
      : new Error("DERIV_TRADING_TIMES_UNAVAILABLE");
  }
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
      const [activeResult, scheduleResult] = await Promise.allSettled([
        publicWsCall({ active_symbols: "full", req_id: 62001 }, "active_symbols", 4000),
        systemWsCall({ trading_times: "today", req_id: 62003 }, "trading_times", 8000)
      ]);

      if (activeResult.status === "rejected") {
        throw activeResult.reason instanceof Error
          ? activeResult.reason
          : new Error("DERIV_PUBLIC_MARKET_CATALOG_UNAVAILABLE");
      }

      const response = activeResult.value;
      const markets = Array.isArray(response?.active_symbols)
        ? response.active_symbols.map(normalizeMarket).filter(Boolean)
        : [];
      if (!markets.length) throw new Error("DERIV_PUBLIC_MARKET_CATALOG_EMPTY");

      const bySymbol = new Map<string, any>(markets.map((item:any) => [item.symbol, { ...item, isActive: true }]));
      let tradingTimesError: string | null = null;

      if (scheduleResult.status === "fulfilled") {
        const scheduleSymbols = extractTradingTimeSymbols(scheduleResult.value?.trading_times);
        for (const item of scheduleSymbols.values()) {
          if (bySymbol.has(item.symbol)) continue;
          const normalized = normalizeMarket(item);
          if (normalized?.symbol) bySymbol.set(normalized.symbol, { ...normalized, isActive: false });
        }
      } else {
        tradingTimesError = scheduleResult.reason instanceof Error
          ? scheduleResult.reason.message
          : "DERIV_TRADING_TIMES_UNAVAILABLE";
      }

      const scheduleSymbols = scheduleResult.status === 'fulfilled' ? extractTradingTimeSymbols(scheduleResult.value?.trading_times) : new Map();
      const mergedMarkets = Array.from(bySymbol.values()).filter(Boolean);
      const scheduleOnlySymbols = Array.from(scheduleSymbols.keys()).filter(symbol => !markets.some((item:any)=>item.symbol===symbol));
      const updatedAt = new Date().toISOString();
      const rows = mergedMarkets.map((item: any) => ({
        source: "deriv",
        symbol: item.symbol,
        display_name: item.name,
        market: item.market,
        submarket: item.subgroup,
        is_active: item.isActive !== false,
        raw: item,
        updated_at: updatedAt
      }));
      const { error } = await db.from("market_symbols").upsert(rows, { onConflict: "symbol" });
      if (error) throw error;
      return json({ ok: true, data: { markets: mergedMarkets, count: mergedMarkets.length, activeSymbolCount: markets.length, tradingTimesCount: Math.max(0, mergedMarkets.length - markets.length), tradingTimesSymbolCount: scheduleSymbols.size, scheduleOnlySymbolCount: scheduleOnlySymbols.length, scheduleOnlySymbols: scheduleOnlySymbols.slice(0,200), source: "server_deriv_public_websocket+trading_times", tradingTimesError, observed_at: updatedAt } });
    }

    if (op === "time") {\n      const response = await publicWsCall({ time: 1, req_id: 62004 }, "time", 4000);\n      const serverEpoch = Number(response?.time);\n      if (!Number.isFinite(serverEpoch)) throw new Error("DERIV_SERVER_TIME_INVALID");\n      const localEpoch = Math.floor(Date.now() / 1000);\n      return json({ ok: true, data: { serverEpoch, localEpoch, offsetSeconds: serverEpoch - localEpoch, observed_at: new Date().toISOString(), source: "deriv_server_time" } });\n    }\n\n    if (op === "tick") {
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
