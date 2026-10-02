import { calculateDrawdown } from "./drawdownCalculator.js";
import { generateAnalyticsInsights } from "./aiInsightGenerator.js";

export class AnalyticsEngine {
  constructor(supabaseClient) { this.supabase = supabaseClient; }

  async calculatePerformanceMetrics(accountType) {
    const tableName = accountType === "SANDBOX" ? "sandbox_orders" : "real_orders";
    const { data: orders, error } = await this.supabase.from(tableName).select("*").eq("status", "CLOSED").order("closed_at", { ascending: true });
    if (error) throw new Error("Failed to fetch analytics orders: " + error.message);
    let grossProfit = 0, grossLoss = 0, wins = 0, losses = 0, running = 0;
    const equityCurve = [];
    for (const order of orders ?? []) {
      const pnl = Number(order.realized_pnl || 0);
      running += pnl;
      if (pnl > 0) { grossProfit += pnl; wins++; }
      else if (pnl < 0) { grossLoss += Math.abs(pnl); losses++; }
      equityCurve.push({ at: order.closed_at || order.created_at, balance: running });
    }
    const totalTrades = wins + losses;
    const winRate = totalTrades ? wins / totalTrades * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.99 : 0;
    const drawdown = calculateDrawdown(equityCurve);
    return { accountType, totalTrades, wins, losses, grossProfit, grossLoss, winRate, profitFactor,
      averageWin: wins ? grossProfit / wins : 0, averageLoss: losses ? grossLoss / losses : 0,
      maxDrawdown: drawdown.maxDrawdown, maxDrawdownPct: drawdown.maxDrawdownPct, equityCurve: drawdown.curve };
  }

  async generateInsights(accountType, risk = {}) {
    const metrics = await this.calculatePerformanceMetrics(accountType);
    return { metrics, insights: generateAnalyticsInsights(metrics, risk) };
  }
}
