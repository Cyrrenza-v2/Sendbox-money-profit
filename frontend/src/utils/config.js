import { supabase } from "../supabaseClient";

export const SYSTEM_CONFIG = Object.freeze({
  environment: "PRODUCTION",
  tradingMode: "REAL",
  realTradingEnabled: false,
});

export async function fetchSystemConfig() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("environment,trading_mode,real_trading_enabled")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return SYSTEM_CONFIG;

  return {
    environment: data.environment || SYSTEM_CONFIG.environment,
    tradingMode: data.trading_mode || SYSTEM_CONFIG.tradingMode,
    realTradingEnabled: data.real_trading_enabled === true,
  };
}
