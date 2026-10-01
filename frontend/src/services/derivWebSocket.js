const DERIV_WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public";

class DerivMarketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.symbols = new Map();
    this.statusListeners = new Set();
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.manualClose = false;
    this.nextReqId = 1;
  }

  onStatus(callback) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  setStatus(status) {
    this.statusListeners.forEach((callback) => callback(status));
  }

  connect() {
    if (this.ws && [WebSocket.OPEN, WebSocket.CONNECTING].includes(this.ws.readyState)) return;
    this.manualClose = false;
    this.setStatus("CONNECTING");
    this.ws = new WebSocket(DERIV_WS_URL);

    this.ws.onopen = () => {
      this.setStatus("LIVE");
      this.startHeartbeat();
      this.send({ active_symbols: "brief", req_id: this.nextReqId++ });
      this.subscribeAll();
    };

    this.ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.error) {
        this.setStatus("ERROR");
        return;
      }

      if (data.msg_type === "active_symbols" && Array.isArray(data.active_symbols)) {
        this.symbols.clear();
        data.active_symbols.forEach((item) => {
          const code = item.underlying_symbol || item.symbol;
          const name = item.underlying_symbol_name || item.display_name || code;
          if (code) this.symbols.set(code, { code, name, market: item.market });
        });
        this.subscribeAll();
      }

      if (data.msg_type === "tick" && data.tick) {
        const code = data.tick.symbol;
        const callback = this.subscribers.get(code);
        if (callback) callback(data.tick);
      }
    };

    this.ws.onerror = () => this.setStatus("ERROR");

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      if (!this.manualClose) {
        this.setStatus("RECONNECTING");
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      } else {
        this.setStatus("DISCONNECTED");
      }
    };
  }

  subscribeTick(symbol, callback) {
    this.subscribers.set(symbol, callback);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ ticks: symbol, subscribe: 1, req_id: this.nextReqId++ });
    }
  }

  subscribeAll() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    for (const symbol of this.subscribers.keys()) {
      this.send({ ticks: symbol, subscribe: 1, req_id: this.nextReqId++ });
    }
  }

  getSymbolByName(pattern) {
    const needle = pattern.toLowerCase();
    return [...this.symbols.values()].find((item) =>
      item.name.toLowerCase().includes(needle) ||
      item.code.toLowerCase().includes(needle)
    );
  }

  send(payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => this.send({ ping: 1 }), 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  disconnect() {
    this.manualClose = true;
    clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }
}

export const derivMarketService = new DerivMarketService();
