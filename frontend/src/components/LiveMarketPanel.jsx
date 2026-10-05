import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const DERIV_PUBLIC_ENDPOINTS = ["wss:" + "//api.derivws.com/trading/v1/options/ws/public", "wss:" + "//ws.binaryws.com/websockets/v3"];\nconst DERIV_DISCOVERY_TIMEOUT_MS = 30000;\nconst DERIV_RETRY_BASE_MS = 1500;
const DERIV_DISCOVERY_TIMEOUT_MS = 30000;
const DERIV_RETRY_BASE_MS = 1500;

export default function LiveMarketPanel({ compact = false, selectedSymbol = null, onSymbolChange, onPriceChange, onOpenTerminal }) {
  const [markets, setMarkets] = useState([]);
  const [ticks, setTicks] = useState({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discoveryComplete, setDiscoveryComplete] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("ALL");
  const [focusedSymbol, setFocusedSymbol] = useState(selectedSymbol || "");
  const selectedSymbolRef = useRef(selectedSymbol);
  const socketRef = useRef(null);
  const onPriceChangeRef = useRef(onPriceChange);
  const subscribeSymbolRef = useRef(null);
  const requestSeqRef = useRef(9000);

  useEffect(() => { if (selectedSymbol) setFocusedSymbol(selectedSymbol); }, [selectedSymbol]);
  useEffect(() => { subscribeSymbolRef.current?.(focusedSymbol); }, [focusedSymbol]);
  useEffect(() => { onPriceChangeRef.current = onPriceChange; }, [onPriceChange]);
  useEffect(() => {
    selectedSymbolRef.current = selectedSymbol;
    subscribeSymbolRef.current?.(selectedSymbol);
  }, [selectedSymbol]);

  useEffect(() => {
    let disposed = false;
    let socket = null;
    let endpointIndex = 0;
    let retryTimer = null;
    let retryCount = 0;
    let symbolsLoaded = false;
    let failureHandled = false;
    let connectTimeout = null;
    let activeSubscription = null;

    const nextReqId = () => ++requestSeqRef.current;

    // Keep exactly one tick subscription per socket. The previous implementation
    // subscribed to up to 80 symbols at once, which could cause duplicate
    // subscription errors and unnecessary public-socket traffic.
    const subscribeSymbol = symbol => {
      if (!symbol || disposed || socket?.readyState !== WebSocket.OPEN) return;
      if (activeSubscription === symbol) return;
      if (activeSubscription === symbol) return;
      activeSubscription = symbol;

      // Clear the socket's existing tick subscription before starting the new
      // selected-market stream. Deriv forget expects a subscription id, not a
      // symbol; forget_all avoids the recurring "already subscribed" state.
      try {
        socket.send(JSON.stringify({ forget_all: "ticks", req_id: nextReqId() }));
      } catch {}

      try {
        socket.send(JSON.stringify({ ticks: symbol, subscribe: 1, req_id: nextReqId() }));
      } catch {
        activeSubscription = null;
        setError("Unable to subscribe to the selected Deriv market price stream.");
      }
    };

    subscribeSymbolRef.current = subscribeSymbol;

    const clearConnectionTimeout = () => {
      if (connectTimeout) clearTimeout(connectTimeout);
      connectTimeout = null;
    };

    const scheduleNextEndpoint = reason => {
      if (disposed || failureHandled) return;
      failureHandled = true;
      clearConnectionTimeout();
      setConnected(false);
      activeSubscription = null;
      try { socket?.close(); } catch {}
      if (endpointIndex < DERIV_PUBLIC_ENDPOINTS.length - 1) {
        endpointIndex += 1;
        retryTimer = setTimeout(connect, 500);
      } else {
        setLoading(false);
        setDiscoveryComplete(false);
        setError(reason || "Could not reach Deriv market data from this browser. Check network WebSocket access.");
        endpointIndex = 0;
        retryTimer = setTimeout(connect, Math.min(30000, DERIV_RETRY_BASE_MS * (2 ** Math.min(retryCount++, 4))));
      }
    };

    const connect = () => {
      if (disposed) return;
      failureHandled = false;
      symbolsLoaded = false;
      activeSubscription = null;
      const endpoint = DERIV_PUBLIC_ENDPOINTS[endpointIndex];

      try {
        socket = new WebSocket(endpoint);
        socketRef.current = socket;
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
        socket.send(JSON.stringify({ active_symbols: "full", req_id: nextReqId() }));
      };

      socket.onmessage = event => {
        if (disposed) return;
        try {
          const message = JSON.parse(event.data);

          if (message.error) {
            const messageText = message.error.message || message.error.code || "Deriv returned a market-data error.";
            const normalizedError = String(messageText).toLowerCase();
            const isClosedMarket =
              normalizedError.includes("market is presently closed") ||
              normalizedError.includes("market will open") ||
              normalizedError.includes("market_is_closed") ||
              normalizedError.includes("market closed");
            const isAlreadySubscribed =
              normalizedError.includes("already subscribed") ||
              normalizedError.includes("already_subscribed");

            if (isAlreadySubscribed) {
              // Another subscription may already exist on this socket. Do not
              // turn that recoverable state into a global market-feed failure.
              setConnected(true);
              setError("");
              return;
            }

            if (message.msg_type === "active_symbols" || message.req_id === 1) {
              setLoading(false);
              setDiscoveryComplete(false);
              setError("Deriv market discovery failed: " + messageText);
              clearConnectionTimeout();
            } else if (message.msg_type === "tick" && !isClosedMarket) {
              setError("A live price subscription failed: " + messageText);
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
            setFocusedSymbol(current => current || selectedSymbolRef.current || unique[0]?.symbol || "");
            setLoading(false);
            setDiscoveryComplete(true);
            setConnected(true);
            setError(unique.length ? "" : "Deriv connected, but returned an empty active-symbol list.");

            if (unique.length) {
              const syncedAt = new Date().toISOString();
              const rows = unique.map(item => ({
                source: "deriv",
                symbol: item.symbol,
                display_name: item.name,
                market: item.market,
                submarket: item.subgroup || "",
                is_active: true,
                raw: item,
                updated_at: syncedAt
              }));
              supabase
                .from("market_symbols")
                .upsert(rows, { onConflict: "symbol" })
                .then(({ error: syncError }) => {
                  if (syncError) console.warn("Supabase market catalog sync failed:", syncError.message);
                })
                .catch(syncError => console.warn("Supabase market catalog sync failed:", syncError?.message || syncError));
            }

            // Only stream the market the user selected. This prevents the
            // previous 80-symbol burst from creating duplicate-subscription
            // failures and keeps the selected price feed responsive.
            subscribeSymbol(selectedSymbolRef.current || focusedSymbol || unique[0]?.symbol);
            return;
          }

          if (message.msg_type === "tick" && message.tick) {
            const tick = message.tick;
            const symbol = tick.underlying_symbol ?? tick.symbol;
            if (!symbol) return;
            const quote = Number(tick.quote);
            if (!Number.isFinite(quote)) return;
            const nextTick = { quote, epoch: Number(tick.epoch), pipSize: tick.pip_size };
            setTicks(prev => ({ ...prev, [symbol]: nextTick }));
            if (symbol === selectedSymbolRef.current || (!selectedSymbolRef.current && symbol === focusedSymbol)) {
              onPriceChangeRef.current?.(nextTick);
            }
          }
        } catch {
          setError("Deriv returned a response that could not be read.");
        }
      };

      socket.onerror = () => {
        if (disposed) return;
        // Give transient browser/network failures a short grace period before\n        // failing over. Some mobile networks establish the socket slightly\n        // after the error event is emitted.\n        if (!failureHandled && !disposed) {\n          retryTimer = setTimeout(() => {\n            if (!symbolsLoaded && !disposed) {\n              scheduleNextEndpoint("Unable to establish a WebSocket connection to Deriv. Check whether your network blocks WebSockets.");\n            }\n          }, 1500);\n        }
      };

      socket.onclose = () => {
        if (disposed) return;
        setConnected(false);
        clearConnectionTimeout();
        activeSubscription = null;
        if (!symbolsLoaded) {
          scheduleNextEndpoint("Deriv closed the connection before sending active markets. Check network WebSocket access.");
        } else {
          retryTimer = setTimeout(() => {
            endpointIndex = 0;
            connect();
          }, Math.min(30000, DERIV_RETRY_BASE_MS * (2 ** Math.min(retryCount++, 4))));
        }
      };
    };

    connect();
    return () => {
      disposed = true;
      clearConnectionTimeout();
      if (retryTimer) clearTimeout(retryTimer);
      try { socket?.close(); } catch {}
      if (socketRef.current === socket) socketRef.current = null;
      subscribeSymbolRef.current = null;
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
  const focusedMarket = markets.find(item => item.symbol === focusedSymbol);

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
      <span className="market-count">{loading ? "Discovering all Deriv markets…" : `${visibleMarkets.length} shown / ${markets.length} active`}</span>
    </div>
    {error && <div className="market-error" role="status">{error}</div>}
    <div className={compact ? "market-grid compact" : "market-grid"}>
      {visibleMarkets.map(item => {
        const tick = ticks[item.symbol];
        return <button key={item.symbol} className={(selectedSymbol === item.symbol || focusedSymbol === item.symbol) ? "market-card selected" : "market-card"} onClick={() => { setFocusedSymbol(item.symbol); onSymbolChange?.(item.symbol); }} title={item.name}>
          <span>{item.name}</span>
          <small>{item.symbol} • {item.market}</small>
          <strong>{tick && Number.isFinite(tick.quote) ? tick.quote.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "—"}</strong>
          <small>{tick ? new Date(tick.epoch * 1000).toLocaleTimeString() : "waiting for tick"}</small>
        </button>;
      })}
    </div>
    {!compact && focusedMarket && <div className="market-detail"><div className="market-detail-heading"><div><span className="market-detail-kicker">SELECTED MARKET</span><h3>{focusedMarket.name}</h3><p>{focusedMarket.symbol} · {focusedMarket.market}</p></div><div className="market-detail-quote"><small>Latest public quote</small><strong>{ticks[focusedMarket.symbol] && Number.isFinite(ticks[focusedMarket.symbol].quote) ? ticks[focusedMarket.symbol].quote.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "Waiting for quote…"} </strong><small>{ticks[focusedMarket.symbol] ? new Date(ticks[focusedMarket.symbol].epoch * 1000).toLocaleTimeString() : "Feed initializing"}</small></div></div><div className="market-detail-actions"><button className="market-open-terminal" onClick={() => onOpenTerminal?.(focusedMarket.symbol)}>Open Web Terminal <span>→</span></button><button className="market-mt5-placeholder" disabled title="MT5 integration is not available yet">MT5 Terminal · Coming later</button></div><p className="market-detail-note">Choose a market here, review its current public price, then open the terminal to view candles and place sandbox orders. Selecting a market does not place an order.</p></div>}
    {!loading && discoveryComplete && visibleMarkets.length === 0 && <div className="market-empty">No active Deriv symbols match this filter.</div>}
    {!loading && !discoveryComplete && markets.length === 0 && <div className="market-empty">Market list is unavailable until the Deriv connection succeeds. The diagnostic above explains the latest failure.</div>}
    <div className="market-footnote">Dynamically discovered from Deriv <code>active_symbols=full</code>. The market list is synchronized to Supabase, while only the selected market receives a live tick subscription to keep the feed stable. Public live market data only; trading credentials remain server-side.</div>
  </section>;
}
