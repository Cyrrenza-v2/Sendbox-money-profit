// VELTRION MT5 sandbox bridge contract.
// This module never routes orders to Deriv or any real-money venue.
// An actual official MT5 terminal connection requires licensed MT5 broker/server infrastructure.
export function normalizeHeartbeat(payload = {}) {
  return {
    loginId: String(payload.loginId || ""),
    serverName: String(payload.serverName || "VELTRION-VIRTUAL"),
    connectionStatus: payload.connectionStatus === "OFFLINE" ? "OFFLINE" : "ONLINE",
    equity: Number(payload.equity || 0),
    balance: Number(payload.balance || 0),
    openPositions: Number(payload.openPositions || 0),
    symbol: payload.symbol || null,
    receivedAt: new Date().toISOString()
  };
}
export function isSandboxOnlySession(session = {}) {
  return session.environment === "SANDBOX" && session.realTradingEnabled !== true;
}
