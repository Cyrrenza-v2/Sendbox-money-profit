import { useEffect, useMemo, useState } from "react";

const DERIV_PUBLIC_WS = "wss://api.derivws.com/trading/v1/options/ws/public";
const DEFAULT_SYMBOLS = ["1HZ100V", "1HZ50V", "frxEURUSD", "frxUSDJPY"];

export default function LiveMarketPanel({ compact = false, selectedSymbol = null, onSymbolChange }) {
  const symbols = useMemo(
    () => selectedSymbol ? [selectedSymbol, ...DEFAULT_SYMBOLS.filter(s => s !== selectedSymbol)] : DEFAULT_SYMBOLS,
    [selectedSymbol]
  );
  const [ticks, setTicks] = useState({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ws = new WebSocket(DERIV_PUBLIC_WS);
    let closed = false;

    ws.onopen = () => {
      if (closed) return;
      setConnected(true);
      setError("");
      symbols.forEach((symbol, index) => {
        ws.send(JSON.stringify({ ticks: symbol, subscribe: 1, req_id: index + 1 }));
      });
    };

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        if (message.msg_type !== "tick" || !message.tick) return;
        const tick = message.tick;
        setTicks(prev => ({
          ...prev,
          [tick.symbol]: {
            quote: Number(tick.quote),
            epoch: Number(tick.epoch),
            pipSize: tick.pip_size
          }
        }));
      } catch {
        setError("Unable to parse Deriv market data.");
      }
    };

    ws.onerror = () => setError("Deriv public market stream is unavailable.");
    ws.onclose = () => setConnected(false);

    return () => {
      closed = true;
      ws.close();
    };
  }, [symbols.join(",")]);

  return (
    <section className="panel market-panel">
      <div className="panel-title market-title">
        <span>LIVE DERIV MARKET</span>
        <span className={connected ? "market-status connected" : "market-status"}>● {connected ? "STREAMING" : "CONNECTING"}</span>
      </div>
      {error && <div className="market-error">{error}</div>}
      <div className={compact ? "market-grid compact" : "market-grid"}>
        {symbols.slice(0, compact ? 4 : symbols.length).map(symbol => {
          const tick = ticks[symbol];
          return (
            <button key={symbol} className={selectedSymbol === symbol ? "market-card selected" : "market-card"} onClick={() => onSymbolChange?.(symbol)}>
              <span>{symbol}</span>
              <strong>{tick ? tick.quote.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "—"}</strong>
              <small>{tick ? new Date(tick.epoch * 1000).toLocaleTimeString() : "waiting for tick"}</small>
            </button>
          );
        })}
      </div>
      <div className="market-footnote">Public Deriv market data • no trading credentials exposed to the browser</div>
    </section>
  );
}
