const WebSocketClient = globalThis.WebSocket;

const DERIV_REST_URL = process.env.DERIV_REST_URL || "https://api.derivws.com";
const DERIV_APP_ID = process.env.DERIV_APP_ID;
const DERIV_ACCOUNT_ID = process.env.DERIV_ACCOUNT_ID;
const DERIV_API_TOKEN = process.env.DERIV_API_TOKEN;

async function getWsUrl() {
  if (!DERIV_APP_ID || !DERIV_ACCOUNT_ID || !DERIV_API_TOKEN) {
    throw new Error("REAL_TRADING_CREDENTIALS_NOT_CONFIGURED");
  }
  const response = await fetch(
    `${DERIV_REST_URL}/trading/v1/options/accounts/${encodeURIComponent(DERIV_ACCOUNT_ID)}/otp`,
    { method: "POST", headers: { Authorization: `Bearer ${DERIV_API_TOKEN}`, "Deriv-App-ID": DERIV_APP_ID } }
  );
  const body = await response.json();
  if (!response.ok || !body?.data?.url) throw new Error("DERIV_OTP_FAILED");
  return body.data.url;
}

function request(url, payload, type) {
  return new Promise((resolve, reject) => {
    if (typeof WebSocketClient !== "function") {
      reject(new Error("WEBSOCKET_RUNTIME_UNAVAILABLE"));
      return;
    }
    const ws = new WebSocketClient(url);
    const timer = setTimeout(() => { ws.close(); reject(new Error("DERIV_REQUEST_TIMEOUT")); }, 15000);
    ws.addEventListener("open", () => ws.send(JSON.stringify(payload)));
    ws.addEventListener("message", event => {
      let data;
      try {
        const raw = typeof event.data === "string" ? event.data : String(event.data);
        data = JSON.parse(raw);
      } catch {
        return;
      }
      if (data.error) { clearTimeout(timer); ws.close(); reject(new Error(data.error.message)); return; }
      if (data.msg_type === type) { clearTimeout(timer); ws.close(); resolve(data); }
    });
    ws.addEventListener("error", () => { clearTimeout(timer); try { ws.close(); } catch {} reject(new Error("DERIV_WEBSOCKET_ERROR")); });
  });
}

export class ReconciliationService {
  async snapshot() {
    const url = await getWsUrl();
    const [balance, portfolio] = await Promise.all([
      request(url, { balance: 1 }, "balance"),
      request(url, { portfolio: 1 }, "portfolio")
    ]);
    return {
      balance: balance.balance,
      portfolio: portfolio.portfolio
    };
  }
}
