const ALLOWED_SYMBOLS = Object.freeze(['EUR/USD','GBP/USD','USD/JPY','XAU/USD','BTC/USD']);
const MODES = Object.freeze(['SANDBOX','REAL']);
const MAX_STAKE = 50000;

export class InputValidator {
  static validateOrderParams(params = {}) {
    const { stake, symbol, mode, side, duration, durationUnit, currency } = params;
    if (!MODES.includes(mode)) return { valid:false, error:'Invalid trading mode specified.' };
    if (!ALLOWED_SYMBOLS.includes(symbol)) return { valid:false, error:'Unsupported or restricted trading symbol.' };
    if (mode === 'REAL' && !['BUY','SELL'].includes(side)) return { valid:false, error:'Invalid order side.' };
    const numericStake = Number(stake);
    if (!Number.isFinite(numericStake) || numericStake <= 0) return { valid:false, error:'Order stake must be a positive numerical value.' };
    if (numericStake > MAX_STAKE) return { valid:false, error:'Order stake exceeds maximum absolute system threshold.' };
    const numericDuration = Number(duration ?? 1);
    if (!Number.isInteger(numericDuration) || numericDuration <= 0 || numericDuration > 1440) return { valid:false, error:'Invalid order duration.' };
    const safeCurrency = typeof currency === 'string' && currency.length <= 8 ? currency : 'USD';
    return { valid:true, sanitized:{ stake:numericStake, symbol, mode, side, duration:numericDuration, durationUnit:durationUnit || 'm', currency:safeCurrency } };
  }
  static assertMode(mode) {
    if (!MODES.includes(mode)) throw new Error('INVALID_TRADING_MODE');
    return mode;
  }
}
