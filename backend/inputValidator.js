const ALLOWED_SYMBOLS = Object.freeze(['EUR/USD','GBP/USD','USD/JPY','XAU/USD','BTC/USD']);
const MODES = Object.freeze(['SANDBOX','REAL']);
const MAX_STAKE = 50000;

export class InputValidator {
  static validateOrderParams(params = {}) {
    const { stake, symbol, mode } = params;
    if (!MODES.includes(mode)) return { valid:false, error:'Invalid trading mode specified.' };
    if (!ALLOWED_SYMBOLS.includes(symbol)) return { valid:false, error:'Unsupported or restricted trading symbol.' };
    const numericStake = Number(stake);
    if (!Number.isFinite(numericStake) || numericStake <= 0) return { valid:false, error:'Order stake must be a positive numerical value.' };
    if (numericStake > MAX_STAKE) return { valid:false, error:'Order stake exceeds maximum absolute system threshold.' };
    return { valid:true, sanitized:{ stake:numericStake, symbol, mode } };
  }
  static assertMode(mode) {
    if (!MODES.includes(mode)) throw new Error('INVALID_TRADING_MODE');
    return mode;
  }
}
