export function generateAnalyticsInsights(metrics, risk = {}) {
  const insights = [];
  const winRate = Number(metrics?.winRate ?? 0);
  const profitFactor = Number(metrics?.profitFactor ?? 0);
  const drawdownPct = Number(metrics?.maxDrawdownPct ?? 0);
  const exposure = Number(risk?.exposure ?? 0);
  const exposureLimit = Number(risk?.exposureLimit ?? 0);
  if (!Number(metrics?.totalTrades)) insights.push("No closed trades are available for this period; performance conclusions are withheld.");
  else {
    insights.push(winRate >= 50 ? "Closed-trade win rate is at or above 50% for the selected account." : "Closed-trade win rate is below 50%; review trade distribution before drawing conclusions.");
    insights.push(profitFactor > 1 ? "Gross profits currently exceed gross losses on the selected closed-trade set." : "Gross losses currently meet or exceed gross profits on the selected closed-trade set.");
    if (drawdownPct > 0) insights.push("A non-zero peak-to-trough drawdown is present in the derived equity curve.");
  }
  if (exposureLimit > 0) insights.push(exposure / exposureLimit <= 0.8 ? "Current recorded exposure is below 80% of the configured exposure limit." : "Current recorded exposure is at or above 80% of the configured exposure limit.");
  return insights;
}
