export class BalanceLedger {
  constructor(initialBalance=0){ this.balance=Number(initialBalance); if(!Number.isFinite(this.balance)) throw new Error("INVALID_BALANCE"); this.seen=new Set(); }
  apply({requestId,amount}) {
    if(!requestId) throw new Error("REQUEST_ID_REQUIRED");
    if(this.seen.has(requestId)) throw new Error("DUPLICATE_REQUEST_ID");
    const value=Number(amount);
    if(!Number.isFinite(value)) throw new Error("INVALID_AMOUNT");
    const next=Number((this.balance+value).toFixed(2));
    if(next < 0) throw new Error("INSUFFICIENT_BALANCE");
    this.seen.add(requestId); this.balance=next; return this.balance;
  }
  getBalance(){ return this.balance; }
}
