const SYMBOL_DICTIONARY = [
  { source: "DERIV", sourceSymbol: "frxEURUSD", veltrionSymbol: "EUR/USD", mt5Symbol: "EURUSD", precision: 5, contractSize: 100000 },
  { source: "DERIV", sourceSymbol: "frxGBPUSD", veltrionSymbol: "GBP/USD", mt5Symbol: "GBPUSD", precision: 5, contractSize: 100000 },
  { source: "DERIV", sourceSymbol: "frxUSDJPY", veltrionSymbol: "USD/JPY", mt5Symbol: "USDJPY", precision: 3, contractSize: 100000 },
  { source: "DERIV", sourceSymbol: "frxXAUUSD", veltrionSymbol: "Gold", mt5Symbol: "XAUUSD", precision: 2, contractSize: 100 }
];
export function mapSymbol(sourceSymbol, targetPlatform = "MT5") {
  const match = SYMBOL_DICTIONARY.find(s => s.sourceSymbol === sourceSymbol || s.veltrionSymbol === sourceSymbol || s.mt5Symbol === sourceSymbol);
  if (!match) return null;
  return targetPlatform === "MT5" ? match.mt5Symbol : match.veltrionSymbol;
}
export function getSymbolDefinition(sourceSymbol) {
  return SYMBOL_DICTIONARY.find(s => s.sourceSymbol === sourceSymbol || s.veltrionSymbol === sourceSymbol || s.mt5Symbol === sourceSymbol) || null;
}
export { SYMBOL_DICTIONARY };
