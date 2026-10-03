const WebSocketClient = globalThis.WebSocket;

const DERIV_REST_URL = process.env.DERIV_REST_URL || "https://api.derivws.com";
const DERIV_APP_ID = process.env.DERIV_APP_ID;
const DERIV_ACCOUNT_ID = process.env.DERIV_ACCOUNT_ID;
const DERIV_API_TOKEN = process.env.DERIV_API_TOKEN;
const REAL_TRADING_ENABLED = process.env.REAL_TRADING_ENABLED === "true";

function requireCredentials() {
  if (!DERIV_ACCOUNT_ID || !DERIV_API_TOKEN) throw new Error("REAL_TRADING_CREDENTIALS_NOT_CONFIGURED");
}

function requireEnabled() {
  requireCredentials();
  if (!REAL_TRADING_ENABLED) throw new Error("REAL_TRADING_DISABLED");
}

async function getAuthenticatedWsUrl({ execution = false } = {}) {
  if (execution) requireEnabled(); else requireCredentials();

  const headers = { Authorization: `Bearer ${DERIV_API_TOKEN}` };
  if (DERIV_APP_ID) headers["Deriv-App-ID"] = DERIV_APP_ID;

  const response = await fetch(
    `${DERIV_REST_URL}/trading/v1/options/accounts/${encodeURIComponent(DERIV_ACCOUNT_ID)}/otp`,
    { method: "POST", headers }
  );
  const body = await response.json();
  if (!response.ok || !body?.data?.url) {
    throw new Error(body?.errors?.[0]?.message || "DERIV_OTP_FAILED");
  }
  const url = String(body.data.url);
  if (!url.includes("/trading/v1/options/ws/real")) throw new Error("DERIV_REAL_WS_NOT_RETURNED");
  return url;
}

function wsRequest(url, request, expectedType) {
  return new Promise((resolve, reject) => {
    if (typeof WebSocketClient !== "function") {
      reject(new Error("WEBSOCKET_RUNTIME_UNAVAILABLE"));
      return;
    }

    const ws = new WebSocketClient(url);
    const reqId = Number(request.req_id || Date.now());
    const timeout = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("DERIV_REQUEST_TIMEOUT"));
    }, 15000);

    ws.addEventListener("open", () => ws.send(JSON.stringify({ ...request, req_id: reqId })));
    ws.addEventListener("message", event => {
      let response;
      try {
        const raw = typeof event.data === "string" ? event.data : String(event.data);
        response = JSON.parse(raw);
      } catch { return; }

      if (response.error) {
        clearTimeout(timeout);
        try { ws.close(); } catch {}
        reject(new Error(response.error.message || "DERIV_API_ERROR"));
        return;
      }

      if (response.msg_type === expectedType && (!response.req_id || response.req_id === reqId)) {
        clearTimeout(timeout);
        try { ws.close(); } catch {}
        resolve(response);
      }
    });

    ws.addEventListener("error", () => {
      clearTimeout(timeout);
      try { ws.close(); } catch {}
      reject(new Error("DERIV_WEBSOCKET_ERROR"));
    });
  });
}

export class RealExecutionEngine {
  async getProposal({ amount, symbol, side, duration = 1, durationUnit = "m", currency = "USD" }) {
    const wsUrl = await getAuthenticatedWsUrl();
    return wsRequest(wsUrl, {
      proposal: 1,
      amount: Number(amount),
      basis: "stake",
      contract_type: side === "BUY" ? "CALL" : "PUT",
      currency,
      duration,
      duration_unit: durationUnit,
      underlying_symbol: symbol
    }, "proposal");
  }

  async getAccuProposal({ amount, symbol, growthRate = 1, duration, durationUnit = "s", currency = "USD", takeProfit, stopLoss }) {
    const wsUrl = await getAuthenticatedWsUrl();
    const request = {
      proposal: 1,
      amount: Number(amount),
      basis: "stake",
      contract_type: "ACCU",
      currency,
      underlying_symbol: symbol,
      growth_rate: Number(growthRate),
      ...(duration == null ? {} : { duration: Number(duration), duration_unit: durationUnit }),
      ...(takeProfit == null && stopLoss == null ? {} : {
        limit_order: {
          ...(takeProfit == null ? {} : { take_profit: Number(takeProfit) }),
          ...(stopLoss == null ? {} : { stop_loss: Number(stopLoss) })
        }
      })
    };
    return wsRequest(wsUrl, request, "proposal");
  }

  async submitRealOrder({ amount, symbol, side, duration = 1, durationUnit = "m", currency = "USD", proposalId, price }) {
    requireEnabled();
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error("INVALID_STAKE");
    if (!symbol || !["BUY", "SELL"].includes(side)) throw new Error("INVALID_ORDER");

    const wsUrl = await getAuthenticatedWsUrl({ execution: true });
    const proposal = proposalId
      ? { id: proposalId, ask_price: price ?? amount }
      : await this.getProposal({ amount, symbol, side, duration, durationUnit, currency }).then(r => r.proposal);

    const buy = await wsRequest(wsUrl, {
      buy: proposal.id,
      price: Number(price ?? proposal.ask_price),
      req_id: Date.now()
    }, "buy");

    return {
      status: "CONFIRMED",
      contractId: buy.buy.contract_id,
      purchasePrice: buy.buy.buy_price,
      payout: buy.buy.payout,
      balanceAfter: buy.buy.balance_after,
      transactionId: buy.buy.transaction_id
    };
  }

  async submitAccuOrder({ proposalId, price }) {
    requireEnabled();
    if (!proposalId) throw new Error("PROPOSAL_ID_REQUIRED");
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) throw new Error("INVALID_MAX_PRICE");
    const wsUrl = await getAuthenticatedWsUrl({ execution: true });
    const buy = await wsRequest(wsUrl, {
      buy: String(proposalId),
      price: Number(price),
      req_id: Date.now()
    }, "buy");
    return buy.buy;
  }

  async startAutomation({ contractTemplate, strategyId, strategyParameters, subscribe = 1 }) {
    requireEnabled();
    if (!/^\w{1,64}$/.test(String(strategyId || ""))) throw new Error("INVALID_STRATEGY_ID");
    if (!contractTemplate || contractTemplate.contract_type !== "ACCU") throw new Error("ACCU_CONTRACT_REQUIRED");
    if (!strategyParameters || typeof strategyParameters !== "object") throw new Error("STRATEGY_PARAMETERS_REQUIRED");

    const wsUrl = await getAuthenticatedWsUrl({ execution: true });
    return wsRequest(wsUrl, {
      auto_start: 1,
      contract_template: contractTemplate,
      strategy_id: String(strategyId),
      strategy_parameters: strategyParameters,
      ...(subscribe ? { subscribe: 1 } : {}),
      req_id: Date.now()
    }, "auto_start");
  }
}
