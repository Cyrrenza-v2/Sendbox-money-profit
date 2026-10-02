import http from "node:http";
import { RealExecutionEngine } from "./realExecutionEngine.js";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const REAL_TRADING_ENABLED = process.env.REAL_TRADING_ENABLED === "true";
const MAX_STAKE = Number(process.env.REAL_MAX_STAKE || 100);
const DAILY_LOSS_LIMIT = Number(process.env.REAL_DAILY_LOSS_LIMIT || 100);

let emergencyStopped = true;

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 100_000) reject(new Error("BODY_TOO_LARGE")); });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("INVALID_JSON")); }
    });
    req.on("error", reject);
  });
}

function authIsPresent(req) {
  return Boolean(req.headers.authorization?.startsWith("Bearer "));
}

const engine = new RealExecutionEngine();

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, {
        ok: true,
        realTradingEnabled: REAL_TRADING_ENABLED,
        emergencyStopped
      });
    }

    if (req.method === "POST" && req.url === "/api/real/emergency-stop") {
      if (!authIsPresent(req)) return json(res, 401, { error: "AUTH_REQUIRED" });
      emergencyStopped = true;
      return json(res, 200, { ok: true, emergencyStopped });
    }

    if (req.method === "POST" && req.url === "/api/real/resume") {
      if (!authIsPresent(req)) return json(res, 401, { error: "AUTH_REQUIRED" });
      emergencyStopped = false;
      return json(res, 200, { ok: true, emergencyStopped });
    }

    if (req.method === "POST" && req.url === "/api/real/orders") {
      if (!authIsPresent(req)) return json(res, 401, { error: "AUTH_REQUIRED" });
      if (!REAL_TRADING_ENABLED) return json(res, 503, { error: "REAL_TRADING_DISABLED" });
      if (emergencyStopped) return json(res, 423, { error: "EMERGENCY_STOP_ACTIVE" });

      const body = await readBody(req);
      if (body.mode !== "REAL" || body.confirmation !== "EXPLICIT") {
        return json(res, 400, { error: "EXPLICIT_REAL_CONFIRMATION_REQUIRED" });
      }

      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_STAKE) {
        return json(res, 400, { error: "STAKE_LIMIT_EXCEEDED" });
      }

      if (!body.symbol || !["BUY", "SELL"].includes(body.side)) {
        return json(res, 400, { error: "INVALID_ORDER" });
      }

      // This service intentionally does not accept or expose Deriv credentials
      // from the browser. The configured server-side credential is used instead.
      const result = await engine.submitRealOrder({
        amount,
        symbol: body.symbol,
        side: body.side,
        duration: Number(body.duration || 1),
        durationUnit: body.durationUnit || "m",
        currency: body.currency || "USD"
      });

      return json(res, 200, result);
    }

    return json(res, 404, { error: "NOT_FOUND" });
  } catch (error) {
    return json(res, 500, { error: error?.message || "INTERNAL_ERROR" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`VELTRION real execution service listening on ${HOST}:${PORT}`);
});
