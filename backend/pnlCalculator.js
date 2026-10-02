export function calculatePnl({ side, entryPrice, exitPrice, quantity=1, lotSize=100000 }) {
  const entry=Number(entryPrice), exit=Number(exitPrice), qty=Number(quantity), lot=Number(lotSize);
  if(!["BUY","SELL"].includes(side)) throw new Error("INVALID_SIDE");
  if(![entry,exit,qty,lot].every(Number.isFinite) || entry<=0 || exit<=0 || qty<=0 || lot<=0) throw new Error("INVALID_PNL_INPUT");
  const direction=side==="BUY"?1:-1;
  return Number(((exit-entry)*direction*qty*lot).toFixed(2));
}
