import http from "node:http";
import { RealExecutionEngine } from "./realExecutionEngine.js";
import { riskEngine } from "./riskEngine.js";
import { requireAdmin } from "./authGuard.js";
import { SecureOrderProcessor } from "./secureOrderProcessor.js";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const REAL_TRADING_ENABLED = process.env.REAL_TRADING_ENABLED === "true";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 100_000) reject(new Error("BODY_TOO_LARGE")); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("INVALID_JSON")); } });
    req.on("error", reject);
  });
}

async function adminRest(path, params = {}) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
  const response = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } });
  if (!response.ok) throw new Error(`SUPABASE_${response.status}`);
  return response.json();
}
async function setGlobalControl(active) {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    const url = `${SUPABASE_URL}/rest/v1/emergency_controls?control_key=eq.EMERGENCY_STOP`;
    await fetch(url, {
      method: "PATCH",
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: active, updated_at: new Date().toISOString() })
    });
  }
  riskEngine.setEmergencyStop(active);
}
async function loadGlobalStop() {
  const rows = await adminRest("emergency_controls", { select: "is_active", control_key: "eq.EMERGENCY_STOP", limit: "1" });
  if (rows?.length) riskEngine.setEmergencyStop(rows[0].is_active);
}
async function riskSnapshot(userId) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return { openPositions: 0, dailyLoss: 0, totalExposure: 0 };
  const accounts = await adminRest("real_trading_accounts", { select: "id", user_id: `eq.${userId}`, limit: "1" });
  const accountId = accounts?.[0]?.id;
  if (!accountId) return { openPositions: 0, dailyLoss: 0, totalExposure: 0 };
  const open = await adminRest("real_orders", { select: "quantity", account_id: `eq.${accountId}`, status: "in.(SUBMITTED,CONFIRMED)" });
  const start = new Date(); start.setUTCHours(0,0,0,0);
  const ledger = await adminRest("real_ledger", { select: "amount", account_id: `eq.${accountId}`, transaction_type: "eq.TRADE_PNL", created_at: `gte.${start.toISOString()}` });
  const dailyLoss = Math.max(0, -(ledger || []).reduce((sum,row)=>sum+Number(row.amount||0),0));
  const totalExposure = (open || []).reduce((sum,row)=>sum+Math.abs(Number(row.quantity||0)),0);
  return { openPositions: open?.length || 0, dailyLoss, totalExposure };
}

const engine = new RealExecutionEngine();
const secureOrderProcessor = new SecureOrderProcessor({
  realExecutor: async ({ userId, order }) => {
    const snapshot = await riskSnapshot(userId);
    const risk = riskEngine.validateOrder("REAL", { ...order, amount: order.stake, ...snapshot });
    if (!risk.allowed) throw new Error(risk.reason);
    return engine.submitRealOrder({
      amount: order.stake, symbol: order.symbol, side: order.side,
      duration: Number(order.duration || 1), durationUnit: order.durationUnit || "m",
      currency: order.currency || "USD"
    });
  },
  isRealTradingEnabled: () => REAL_TRADING_ENABLED
});
loadGlobalStop().catch(() => riskEngine.setEmergencyStop(true));

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, { ok: true, realTradingEnabled: REAL_TRADING_ENABLED, emergencyStopped: riskEngine.isEmergencyStopped() });
    }

    if (req.method === "POST" && req.url === "/api/operations/emergency-stop") {
      await requireAdmin(req);
      await setGlobalControl(true);
      return json(res, 200, { ok: true, emergencyStopped: true, blockedPipelines: ["SANDBOX","REAL","MT5"] });
    }

    if (req.method === "POST" && req.url === "/api/operations/resume") {
      await requireAdmin(req);
      await setGlobalControl(false);
      return json(res, 200, { ok: true, emergencyStopped: false });
    }

    if (req.method === "POST" && req.url === "/api/real/emergency-stop") {
      await requireAdmin(req);
      await setGlobalControl(true);
      return json(res, 200, { ok: true, emergencyStopped: true });
    }

    if (req.method === "POST" && req.url === "/api/real/resume") {
      await requireAdmin(req);
      if (!REAL_TRADING_ENABLED) return json(res, 423, { error: "REAL_TRADING_DISABLED" });
      await setGlobalControl(false);
      return json(res, 200, { ok: true, emergencyStopped: false });
    }

    if (req.method === "POST" && req.url === "/api/real/orders") {
      const auth = await requireAdmin(req);
      const body = await readBody(req);
      if (!REAL_TRADING_ENABLED) return json(res, 503, { error: "REAL_TRADING_DISABLED" });
      if (body.mode !== "REAL" || body.confirmation !== "EXPLICIT") return json(res, 400, { error: "EXPLICIT_REAL_CONFIRMATION_REQUIRED" });
      if (!body.symbol || !["BUY","SELL"].includes(body.side)) return json(res, 400, { error: "INVALID_ORDER" });
      const result = await secureOrderProcessor.process({
        auth, params: { ...body, stake: body.amount, mode: "REAL" },
        confirmation: body.confirmation === "EXPLICIT"
      });
      return json(res, 200, result);
    }

    return json(res, 404, { error: "NOT_FOUND" });
  } catch (error) {
    const status = Number(error?.statusCode) || (error?.code === "VALIDATION_FAILED" ? 400 : 500);
    return json(res, status, { error: error?.message || "INTERNAL_ERROR" });
  }
});

server.listen(PORT, HOST, () => console.log(`VELTRION real execution service listening on ${HOST}:${PORT}`));
