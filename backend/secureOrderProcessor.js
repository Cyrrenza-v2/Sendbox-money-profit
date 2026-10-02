import { InputValidator } from './inputValidator.js';

export class SecureOrderProcessor {
  constructor({ sandboxExecutor, realExecutor, isRealTradingEnabled=()=>false }={}) {
    this.sandboxExecutor=sandboxExecutor;
    this.realExecutor=realExecutor;
    this.isRealTradingEnabled=isRealTradingEnabled;
  }

  async process({ auth, params, confirmation=false }={}) {
    if (!auth?.user?.id) throw new Error('AUTH_REQUIRED');
    const validation=InputValidator.validateOrderParams(params);
    if (!validation.valid) { const e=new Error(validation.error); e.code='VALIDATION_FAILED'; throw e; }

    const { mode }=validation.sanitized;
    if (mode==='SANDBOX') {
      if (typeof this.sandboxExecutor!=='function') throw new Error('SANDBOX_EXECUTOR_NOT_CONFIGURED');
      return this.sandboxExecutor({ userId:auth.user.id, order:validation.sanitized });
    }

    if (mode==='REAL') {
      if (confirmation!==true) throw new Error('EXPLICIT_REAL_CONFIRMATION_REQUIRED');
      if (!this.isRealTradingEnabled()) throw new Error('REAL_TRADING_DISABLED');
      if (typeof this.realExecutor!=='function') throw new Error('REAL_EXECUTOR_NOT_CONFIGURED');
      return this.realExecutor({ userId:auth.user.id, order:validation.sanitized });
    }

    throw new Error('INVALID_TRADING_MODE');
  }
}
