import { useEffect, useMemo, useState } from "react";

const DERIV_PUBLIC_ENDPOINTS = [
  "wss://ws.binaryws.com/websockets/v3",
  "wss://ws.derivws.com/websockets/v3?app_id=1089"
];

export default function LiveMarketPanel({ compact = false, selectedSymbol = null, onSymbolChange }) {
  const [markets, setMarkets] = useState([]);
  const [ticks, setTicks] = useState({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("ALL");

  useEffect(() => {
    let disposed = false;
    let socket = null;
    let endpointIndex = 0;
    let retryTimer = null;
    let retryCount = 0;
    let symbolsLoaded = false;

    const connect = () => {
      if (disposed) return;
      const endpoint = DERIV_PUBLIC_ENDPOINTS[endpointIndex];
      let opened = false;
      symbolsLoaded = false;

      try {
        socket = new WebSocket(endpoint);
      } catch {
        tryNextEndpoint();
        return;
      }

      const timeout = setTimeout(() => {
        if (!opened && !disposed) {
          try { socket?.close(); } catch {}
          tryNextEndpoint();
        }
      }, 10000);

      socket.onopen = () => {
        opened = true;
        clearTimeout(timeout);
        if (disposed) return;
        setConnected(true);
        setError("");
        retryCount = 0;
        socket.send(JSON.stringify({ active_symbols: "full", product_type: "basic", req_id: 1 }));
      };

      socket.onmessage = event => {
        if (disposed) return;
        try {
          const message = JSON.parse(event.data);
          if (message.error) {
            setError(message.error.message || "Deriv rejected the market data request.");
            if (message.req_id === 1) setLoading(false);
            return;
          }

          if (message.msg_type === "active_symbols" && Array.isArray(message.active_symbols)) {
            const discovered = message.active_symbols.map(item => ({
              symbol: item.underlying_symbol ?? item.symbol,
              name: item.underlying_symbol_name ?? item.display_name ?? item.symbol,
              market: item.market ?? item.symbol_type ?? "Other",
              subgroup: item.subgroup ?? item.submarket ?? ""
            })).filter(item => item.symbol && item.name);
            const unique = Array.from(new Map(discovered.map(item => [item.symbol, item])).values());
            symbolsLoaded = true;
            setMarkets(unique);
            setLoading(false);
            if (unique.length) {
              // Deriv accepts an array of symbols for a tick subscription.
              socket.send(JSON.stringify({ ticks: unique.map(item => item.symbol), subscribe: 1, req_id: 2 }));
            } else {
              setError("Deriv connected, but no active symbols were returned.");
            }
            return;
          }

          if (message.msg_type === "tick" && message.tick) {
            const tick = message.tick;
            const symbol = tick.underlying_symbol ?? tick.symbol;
            if (!symbol) return;
            setTicks(prev => ({
              ...prev,
              [symbol]: {
                quote: Number(tick.quote),
                epoch: Number(tick.epoch),
                pipSize: tick.pip_size
              }
            }));
          }
        } catch {
          setError("Received an unreadable response from Deriv.");
        }
      };

      socket.onerror = () => {
        clearTimeout(timeout);
        if (disposed) return;
        setConnected(false);
        tryNextEndpoint();
      };

      socket.onclose = () => {
        clearTimeout(timeout);
        if (disposed) return;
        setConnected(false);
        if (!symbolsLoaded) tryNextEndpoint();
        else {
          retryTimer = setTimeout(() => {
            endpointIndex = 0;
            connect();
          }, Math.min(15000, 1000 * (2 ** Math.min(retryCount++, 4))));
        }
      };
    };

    const tryNextEndpoint = () => {
      if (disposed) return;
      if (retryTimer) clearTimeout(retryTimer);
      if (endpointIndex < DERIV_PUBLIC_ENDPOINTS.length - 1) {
        endpointIndex += 1;
        retryTimer = setTimeout(connect, 250);
      } else {
        setConnected(false);
        setLoading(false);
        setError("Unable to connect to Deriv market data. Check your internet connection or network restrictions, then retry.");
        // Retry the endpoints automatically rather than leaving the screen permanently offline.
        endpointIndex = 0;
        retryTimer = setTimeout(connect, Math.min(30000, 2000 * (2 ** Math.min(retryCount++, 4))));
      }
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      try { socket?.close(); } catch {}
    };
  }, []);

  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(markets.map(item => item.market).filter(Boolean))).sort()],
    [markets]
  );
  const visibleMarkets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return markets.filter(item => {
      const matchesCategory = marketFilter === "ALL" || item.market === marketFilter;
      const matchesQuery = !normalized ||
        item.symbol.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        item.market.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [markets, marketFilter, query]);

  return <section className="panel market-panel">
    <div className="panel-title market-title">
      <span>LIVE DERIV MARKET — ALL ACTIVE SYMBOLS</span>
      <span className={connected ? "market-status connected" : "market-status"}>● {connected ? "STREAMING" : "CONNECTING"}</span>
    </div>
    <div className="market-toolbar">
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search every Deriv market or symbol..." aria-label="Search Deriv markets" />
      <select value={marketFilter} onChange={event => setMarketFilter(event.target.value)}>
        {categories.map(category => <option key={category} value={category}>{category}</option>)}
      </select>
      <span className="market-count">{loading ? "Discovering markets…" : `${visibleMarkets.length} / ${markets.length} active`}</span>
    </div>
    {error && <div className="market-error">{error}</div>}
    <div className={compact ? "market-grid compact" : "market-grid"}>
      {visibleMarkets.map(item => {
        const tick = ticks[item.symbol];
        return <button key={item.symbol} className={selectedSymbol === item.symbol ? "market-card selected" : "market-card"} onClick={() => onSymbolChange?.(item.symbol)} title={item.name}>
          <span>{item.name}</span>
          <small>{item.symbol} • {item.market}</small>
          <strong>{tick && Number.isFinite(tick.quote) ? tick.quote.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "—"}</strong>
          <small>{tick ? new Date(tick.epoch * 1000).toLocaleTimeString() : "waiting for tick"}</small>
        </button>;
      })}
    </div>
    {!loading && visibleMarkets.length === 0 && <div className="market-empty">No active Deriv symbols match this filter.</div>}
    <div className="market-footnote">Dynamically discovered from Deriv <code>active_symbols</code>. Public live market data only; trading credentials remain server-side.</div>
  </section>;
}
