import { useEffect, useMemo, useState } from "react";

const DERIV_PUBLIC_WS = "wss://api.derivws.com/trading/v1/options/ws/public";

export default function LiveMarketPanel({ compact = false, selectedSymbol = null, onSymbolChange }) {
  const [markets, setMarkets] = useState([]);
  const [ticks, setTicks] = useState({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("ALL");

  useEffect(() => {
    const ws = new WebSocket(DERIV_PUBLIC_WS);
    let closed = false;
    let activeSymbolsLoaded = false;

    ws.onopen = () => {
      if (closed) return;
      setConnected(true);
      setError("");
      ws.send(JSON.stringify({ active_symbols: "full", req_id: 1 }));
    };

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        if (message.msg_type === "active_symbols" && Array.isArray(message.active_symbols)) {
          const discovered = message.active_symbols.map(item => ({
            symbol: item.underlying_symbol ?? item.symbol,
            name: item.underlying_symbol_name ?? item.display_name ?? item.symbol,
            market: item.market ?? item.symbol_type ?? "Other",
            subgroup: item.subgroup ?? item.submarket ?? ""
          })).filter(item => item.symbol && item.name);
          const unique = Array.from(new Map(discovered.map(item => [item.symbol, item])).values());
          activeSymbolsLoaded = true;
          setMarkets(unique);
          setLoading(false);
          unique.forEach((item, index) => {
            ws.send(JSON.stringify({ ticks: item.symbol, subscribe: 1, req_id: 1000 + index }));
          });
          return;
        }
        if (message.msg_type === "tick" && message.tick) {
          const tick = message.tick;
          const symbol = tick.underlying_symbol ?? tick.symbol;
          if (!symbol) return;
          setTicks(prev => ({ ...prev, [symbol]: { quote: Number(tick.quote), epoch: Number(tick.epoch), pipSize: tick.pip_size } }));
          return;
        }
        if (message.error && !activeSymbolsLoaded) {
          setError(message.error.message || "Unable to load Deriv markets.");
          setLoading(false);
        }
      } catch {
        setError("Unable to parse Deriv market data.");
        setLoading(false);
      }
    };

    ws.onerror = () => { setError("Deriv public market stream is unavailable."); setLoading(false); };
    ws.onclose = () => setConnected(false);
    return () => { closed = true; ws.close(); };
  }, []);

  const categories = useMemo(() => ["ALL", ...Array.from(new Set(markets.map(item => item.market).filter(Boolean))).sort()], [markets]);
  const visibleMarkets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return markets.filter(item => {
      const matchesCategory = marketFilter === "ALL" || item.market === marketFilter;
      const matchesQuery = !normalized || item.symbol.toLowerCase().includes(normalized) || item.name.toLowerCase().includes(normalized) || item.market.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [markets, marketFilter, query]);

  return <section className="panel market-panel">
    <div className="panel-title market-title"><span>LIVE DERIV MARKET — ALL ACTIVE SYMBOLS</span><span className={connected ? "market-status connected" : "market-status"}>● {connected ? "STREAMING" : "CONNECTING"}</span></div>
    <div className="market-toolbar">
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search every Deriv market or symbol..." aria-label="Search Deriv markets" />
      <select value={marketFilter} onChange={event => setMarketFilter(event.target.value)}>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
      <span className="market-count">{loading ? "Discovering markets…" : `${visibleMarkets.length} / ${markets.length} active`}</span>
    </div>
    {error && <div className="market-error">{error}</div>}
    <div className={compact ? "market-grid compact" : "market-grid"}>
      {visibleMarkets.map(item => {
        const tick = ticks[item.symbol];
        return <button key={item.symbol} className={selectedSymbol === item.symbol ? "market-card selected" : "market-card"} onClick={() => onSymbolChange?.(item.symbol)} title={item.name}>
          <span>{item.name}</span><small>{item.symbol} • {item.market}</small>
          <strong>{tick && Number.isFinite(tick.quote) ? tick.quote.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "—"}</strong>
          <small>{tick ? new Date(tick.epoch * 1000).toLocaleTimeString() : "waiting for tick"}</small>
        </button>;
      })}
    </div>
    {!loading && visibleMarkets.length === 0 && <div className="market-empty">No active Deriv symbols match this filter.</div>}
    <div className="market-footnote">Dynamically discovered from Deriv <code>active_symbols</code>. Public live market data only; trading credentials remain server-side.</div>
  </section>;
}
