import { useEffect, useMemo, useState } from "react";


const DERIV_PUBLIC_ENDPOINTS = ["wss:" + "//api.derivws.com/trading/v1/options/ws/public", "wss:" + "//ws.binaryws.com/websockets/v3"];

export default function LiveMarketPanel({ compact = false, selectedSymbol = null, onSymbolChange }) {
  const [markets, setMarkets] = useState([]);
  const [ticks, setTicks] = useState({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discoveryComplete, setDiscoveryComplete] = useState(false);
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
    let failureHandled = false;
    let connectTimeout = null;
    let tickTimers = [];

    const clearConnectionTimeout = () => {
      if (connectTimeout) clearTimeout(connectTimeout);
      connectTimeout = null;
    };

    const scheduleNextEndpoint = reason => {
      if (disposed || failureHandled) return;
      failureHandled = true;
      clearConnectionTimeout();
      setConnected(false);
      try { socket?.close(); } catch {}
      if (endpointIndex < DERIV_PUBLIC_ENDPOINTS.length - 1) {
        endpointIndex += 1;
        retryTimer = setTimeout(connect, 500);
      } else {
        setLoading(false);
        setDiscoveryComplete(false);
        setError(reason || "Could not reach Deriv market data from this browser. Check network WebSocket access.");
        endpointIndex = 0;
        retryTimer = setTimeout(connect, Math.min(30000, 2000 * (2 ** Math.min(retryCount++, 4))));
      }
    };

    const connect = () => {
      if (disposed) return;
      failureHandled = false;
      symbolsLoaded = false;
      const endpoint = DERIV_PUBLIC_ENDPOINTS[endpointIndex];

      try {
        socket = new WebSocket(endpoint);
      } catch {
        scheduleNextEndpoint("Your browser could not create a Deriv WebSocket connection.");
        return;
      }

      connectTimeout = setTimeout(() => {
        if (!symbolsLoaded && !disposed) {
          scheduleNextEndpoint("Deriv connected too slowly or did not return its active-symbol list. Allow WebSocket traffic on your network.");
        }
      }, 12000);

      socket.onopen = () => {
        if (disposed) return;
        setConnected(true);
        setError("");
        socket.send(JSON.stringify({ active_symbols: "brief", req_id: 1 }));
      };

      socket.onmessage = event => {
        if (disposed) return;
        try {
          const message = JSON.parse(event.data);

          if (message.error) {
            const messageText = message.error.message || message.error.code || "Deriv returned a market-data error.";
            if (message.req_id === 1) {
              setLoading(false);
              setDiscoveryComplete(false);
              setError(`Deriv market discovery failed: ${messageText}`);
              clearConnectionTimeout();
            } else if (message.msg_type === "tick") {
              setError(`A live price subscription failed: ${messageText}`);
            }
            return;
          }

          if (message.msg_type === "active_symbols" && Array.isArray(message.active_symbols)) {
            const discovered = message.active_symbols.map(item => ({
              symbol: item.underlying_symbol ?? item.symbol,
              name: item.underlying_symbol_name ?? item.display_name ?? item.symbol,
              market: item.market_display_name ?? item.market ?? item.symbol_type ?? "Other",
              subgroup: item.subgroup ?? item.submarket ?? ""
            })).filter(item => item.symbol && item.name);
            const unique = Array.from(new Map(discovered.map(item => [item.symbol, item])).values());
            symbolsLoaded = true;
            clearConnectionTimeout();
            setMarkets(unique);
            setLoading(false);
            setDiscoveryComplete(true);
            setConnected(true);
            setError(unique.length ? "" : "Deriv connected, but returned an empty active-symbol list.");

            // Queue a modest number of tick subscriptions to avoid flooding the public socket.
            tickTimers.forEach(clearTimeout);
            tickTimers = [];
            unique.slice(0, 80).forEach((item, index) => {
              tickTimers.push(setTimeout(() => {
                if (!disposed && socket?.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ ticks: item.symbol, subscribe: 1, req_id: 1000 + index }));
                }
              }, index * 80));
            });
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
          setError("Deriv returned a response that could not be read.");
        }
      };

      socket.onerror = () => {
        if (disposed) return;
        scheduleNextEndpoint("Unable to establish a WebSocket connection to Deriv. Check whether your network blocks WebSockets.");
      };

      socket.onclose = () => {
        if (disposed) return;
        setConnected(false);
        clearConnectionTimeout();
        if (!symbolsLoaded) {
          scheduleNextEndpoint("Deriv closed the connection before sending active markets. Check network WebSocket access.");
        } else {
          retryTimer = setTimeout(() => {
            endpointIndex = 0;
            connect();
          }, Math.min(30000, 2000 * (2 ** Math.min(retryCount++, 4))));
        }
      };
    };

    connect();
    return () => {
      disposed = true;
      clearConnectionTimeout();
      if (retryTimer) clearTimeout(retryTimer);
      tickTimers.forEach(clearTimeout);
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
    {error && <div className="market-error" role="status">{error}</div>}
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
    {!loading && discoveryComplete && visibleMarkets.length === 0 && <div className="market-empty">No active Deriv symbols match this filter.</div>}
    {!loading && !discoveryComplete && markets.length === 0 && <div className="market-empty">Market list is unavailable until the Deriv connection succeeds. The diagnostic above explains the latest failure.</div>}
    <div className="market-footnote">Dynamically discovered from Deriv <code>active_symbols</code>. Public live market data only; trading credentials remain server-side.</div>
  </section>;
}
