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

function DerivFallback({ symbol, candles = [], price }) {
  const data = candles.slice(-80);
  if (!data.length) {
    return <div className="vt-chart-empty"><span className="vt-live-dot" /> Connecting to VELTRION live Deriv market data…</div>;
  }
  const w = 1200, h = 520, left = 12, right = 82, top = 20, bottom = 28;
  const hi = Math.max(...data.map(c => c.high), Number(price) || -Infinity);
  const lo = Math.min(...data.map(c => c.low), Number(price) || Infinity);
  const range = hi - lo || 1;
  const x = i => left + (i / Math.max(1, data.length - 1)) * (w - left - right);
  const y = v => top + ((hi - v) / range) * (h - top - bottom);
  return <div style={{width:"100%",height:520,minHeight:420,overflow:"hidden"}}>
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" role="img" aria-label={`VELTRION Deriv live chart ${symbol}`}>
      {[0,1,2,3,4].map(i => {
        const v = hi - range * i / 4;
        return <g key={i}><line x1={left} x2={w-right} y1={y(v)} y2={y(v)} stroke="currentColor" opacity=".12" strokeDasharray="3 5"/><text x={w-right+8} y={y(v)+4} fill="currentColor" opacity=".65" fontSize="11">{v.toFixed(Math.abs(v)<10?5:2)}</text></g>;
      })}
      {data.map((c,i) => {
        const up=c.close>=c.open, cx=x(i), bodyW=Math.max(2,Math.min(12,(w-left-right)/data.length*.65));
        return <g key={c.time}><line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={up?"#20c997":"#f05252"} strokeWidth="1.2"/><rect x={cx-bodyW/2} y={Math.min(y(c.open),y(c.close))} width={bodyW} height={Math.max(1,Math.abs(y(c.close)-y(c.open)))} fill={up?"#20c997":"#f05252"} rx=".6"/></g>;
      })}
      {Number.isFinite(Number(price)) && <line x1={left} x2={w-right} y1={y(Number(price))} y2={y(Number(price))} stroke="#60a5fa" strokeDasharray="5 4"/>}
    </svg>
  </div>;
}

export default function TradingViewChart({ symbol, interval = "5", theme = "dark", candles = [], price = null }) {
  const host = useRef(null);
  const tvSymbol = useMemo(() => symbolMap(symbol), [symbol]);

  useEffect(() => {
    if (!host.current || !tvSymbol) return;
    host.current.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "tradingview-widget-container";
    wrap.style.height = "520px";
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
      autosize: true, symbol: tvSymbol, interval, timezone: "Etc/UTC", theme, style: "1",
      locale: "en", allow_symbol_change: true, hide_top_toolbar: false, hide_legend: false,
      save_image: false, calendar: false, support_host: "https://www.tradingview.com"
    });
    wrap.appendChild(script);
    host.current.appendChild(wrap);
    return () => { if (host.current) host.current.innerHTML = ""; };
  }, [tvSymbol, interval, theme]);

  if (!tvSymbol) return <DerivFallback symbol={symbol} candles={candles} price={price} />;
  return <div ref={host} style={{ width:"100%", height:520, minHeight:420, overflow:"hidden" }} aria-label={"TradingView live chart " + symbol} />;
}
