const DEFAULT_LIMITS = Object.freeze({
  SANDBOX: { maxOrderSize: 500, maxOpenPositions: 10, maxDailyLoss: 250, maxTotalExposure: 1000 },
  REAL: { maxOrderSize: 500, maxOpenPositions: 10, maxDailyLoss: 250, maxTotalExposure: 1000 },
  MT5: { maxOrderSize: 500, maxOpenPositions: 10, maxDailyLoss: 250, maxTotalExposure: 1000 }
});

export class RiskEngine {
  constructor({ emergencyStopped = true } = {}) { this.emergencyStopped = emergencyStopped; }
  setEmergencyStop(active) { this.emergencyStopped = Boolean(active); return this.emergencyStopped; }
  isEmergencyStopped() { return this.emergencyStopped; }
  getLimits(accountType = "REAL") { return DEFAULT_LIMITS[String(accountType).toUpperCase()] || DEFAULT_LIMITS.REAL; }

  validateOrder(accountType, orderParams = {}) {
    const limits = this.getLimits(accountType);
    const stake = Number(orderParams.stake ?? orderParams.amount);
    const openPositions = Number(orderParams.openPositions ?? 0);
    const dailyLoss = Number(orderParams.dailyLoss ?? 0);
    const totalExposure = Number(orderParams.totalExposure ?? 0);

    if (this.emergencyStopped) return { allowed: false, reason: "EMERGENCY_STOP_ACTIVE", message: "Global emergency stop is active. New orders are blocked." };
    if (!Number.isFinite(stake) || stake <= 0) return { allowed: false, reason: "INVALID_STAKE", message: "Order stake must be greater than zero." };
    if (stake > limits.maxOrderSize) return { allowed: false, reason: "MAX_ORDER_SIZE", message: "Order size exceeds the configured maximum." };
    if (openPositions >= limits.maxOpenPositions) return { allowed: false, reason: "MAX_OPEN_POSITIONS", message: "Maximum open-position limit reached." };
    if (dailyLoss >= limits.maxDailyLoss) return { allowed: false, reason: "MAX_DAILY_LOSS", message: "Daily loss limit reached." };
    if (totalExposure + stake > limits.maxTotalExposure) return { allowed: false, reason: "MAX_TOTAL_EXPOSURE", message: "Order would exceed maximum total exposure." };
    return { allowed: true, reason: "RISK_CHECK_PASSED", limits };
  }
}

export const riskEngine = new RiskEngine();
