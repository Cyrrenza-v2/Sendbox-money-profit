import WebSocket from "ws";

const DERIV_REST_URL = process.env.DERIV_REST_URL || "https://api.derivws.com";
const DERIV_APP_ID = process.env.DERIV_APP_ID;
const DERIV_ACCOUNT_ID = process.env.DERIV_ACCOUNT_ID;
const DERIV_API_TOKEN = process.env.DERIV_API_TOKEN;
const REAL_TRADING_ENABLED = process.env.REAL_TRADING_ENABLED === "true";

function requireEnabled() {
  if (!REAL_TRADING_ENABLED) {
    throw new Error("REAL_TRADING_DISABLED");
  }
  if (!DERIV_APP_ID || !DERIV_ACCOUNT_ID || !DERIV_API_TOKEN) {
    throw new Error("REAL_TRADING_CREDENTIALS_NOT_CONFIGURED");
  }
}

async function getAuthenticatedWsUrl() {
  requireEnabled();
  const response = await fetch(
    `${DERIV_REST_URL}/trading/v1/options/accounts/${encodeURIComponent(DERIV_ACCOUNT_ID)}/otp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DERIV_API_TOKEN}`,
        "Deriv-App-ID": DERIV_APP_ID
      }
    }
  );
  const body = await response.json();
  if (!response.ok || !body?.data?.url) {
    throw new Error(body?.errors?.[0]?.message || "DERIV_OTP_FAILED");
  }
  return body.data.url;
}

function wsRequest(url, request, expectedType) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("DERIV_REQUEST_TIMEOUT"));
    }, 15000);

    ws.on("open", () => ws.send(JSON.stringify(request)));
    ws.on("message", raw => {
      let response;
      try { response = JSON.parse(raw.toString()); }
      catch { return; }

      if (response.error) {
        clearTimeout(timeout);
        ws.close();
        reject(new Error(response.error.message || "DERIV_API_ERROR"));
        return;
      }

      if (response.msg_type === expectedType) {
        clearTimeout(timeout);
        ws.close();
        resolve(response);
      }
    });
    ws.on("error", error => {
      clearTimeout(timeout);
      ws.close();
      reject(error);
    });
  });
}

export class RealExecutionEngine {
  async getProposal({ amount, symbol, side, duration = 1, durationUnit = "m", currency = "USD" }) {
    const wsUrl = await getAuthenticatedWsUrl();
    return wsRequest(wsUrl, {
      proposal: 1,
      amount,
      basis: "stake",
      contract_type: side === "BUY" ? "CALL" : "PUT",
      currency,
      duration,
      duration_unit: durationUnit,
      underlying_symbol: symbol
    }, "proposal");
  }

  async submitRealOrder({ amount, symbol, side, duration = 1, durationUnit = "m", currency = "USD", proposalId, price }) {
    requireEnabled();

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error("INVALID_STAKE");
    }
    if (!symbol || !["BUY", "SELL"].includes(side)) {
      throw new Error("INVALID_ORDER");
    }

    const wsUrl = await getAuthenticatedWsUrl();
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
}
