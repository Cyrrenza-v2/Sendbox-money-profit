import { useEffect, useMemo, useRef } from "react";

const symbolMap = (symbol) => {
  const s = String(symbol || "").trim();
  if (/^frx[A-Z]{6}$/.test(s)) return "OANDA:" + s.slice(3);
  if (/^cry[A-Z]+USD$/.test(s)) return "COINBASE:" + s.slice(3);
  if (/^cry[A-Z]+$/.test(s)) return "COINBASE:" + s.slice(3);
  if (s === "frxXAUUSD") return "OANDA:XAUUSD";
  if (s === "frxXAGUSD") return "OANDA:XAGUSD";
  return null;
};

export default function TradingViewChart({ symbol, interval = "5", theme = "dark" }) {
  const host = useRef(null);
  const tvSymbol = useMemo(() => symbolMap(symbol), [symbol]);

  useEffect(() => {
    if (!host.current || !tvSymbol) return;
    host.current.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "tradingview-widget-container";
    wrap.style.height = "100%";
    wrap.style.width = "100%";
    const chart = document.createElement("div");
    chart.className = "tradingview-widget-container__widget";
    chart.style.height = "100%";
    chart.style.width = "100%";
    wrap.appendChild(chart);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval,
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com"
    });
    wrap.appendChild(script);
    host.current.appendChild(wrap);
    return () => { if (host.current) host.current.innerHTML = ""; };
  }, [tvSymbol, interval, theme]);

  if (!tvSymbol) {
    return <div className="vt-chart-empty"><span className="vt-live-dot" /> TradingView does not publish this Deriv synthetic symbol. VELTRION will use its authenticated Deriv live feed for this market.</div>;
  }

  return <div ref={host} style={{ width: "100%", height: 520, minHeight: 420, overflow: "hidden" }} aria-label={"TradingView live chart " + symbol} />;
}
