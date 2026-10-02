export function calculateDrawdown(equityCurve = []) {
  let peak = null, maxDrawdown = 0, maxDrawdownPct = 0;
  const curve = equityCurve.map(point => {
    const balance = Number(point.balance ?? 0);
    if (peak === null || balance > peak) peak = balance;
    const drawdown = Math.max(0, peak - balance);
    const pct = peak > 0 ? (drawdown / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    maxDrawdownPct = Math.max(maxDrawdownPct, pct);
    return { ...point, balance, peak, drawdown, drawdownPct: pct };
  });
  return { curve, maxDrawdown, maxDrawdownPct };
}
