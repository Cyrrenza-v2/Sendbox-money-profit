import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";


const DERIV_MARKET_CATEGORIES = [
  "Basket Indices","Conversions","Crash Boom Flip Indices","Crash Boom Indices","Crypto","DEX Indices",
  "Drift Switching Indices","ETFs","Energies","Equities","Exponential Growth Indices","Forex Exotic",
  "Forex Major","Forex Micro","Forex Minor","Hybrid Indices","Indices","Jump Indices","Laddered Volatility Indices",
  "Metals","Multi Step Indices","Range Break","Skewed Step","Soft Commodities","Spot Volatility Indices",
  "Step Indices","Stock Indices","Trek Indices","Volatility Crash/Boom Indices","Volatility Indices","Volatility Switch Indices"
];

const CATEGORY_ALIASES = {
  basket_indices: "Basket Indices", basket: "Basket Indices",
  conversions: "Conversions", conversion: "Conversions", currency_conversion: "Conversions",
  crash_boom_flip_indices: "Crash Boom Flip Indices", crash_boom_flip: "Crash Boom Flip Indices",
  crash_boom_indices: "Crash Boom Indices", crash_boom: "Crash Boom Indices",
  crypto: "Crypto", cryptocurrency: "Crypto", cryptocurrencies: "Crypto",
  dex_indices: "DEX Indices", dex: "DEX Indices",
  drift_switching_indices: "Drift Switching Indices", drift_switching: "Drift Switching Indices",
  etfs: "ETFs", etf: "ETFs",
  energies: "Energies", energy: "Energies",
  equities: "Equities", equity: "Equities",
  exponential_growth_indices: "Exponential Growth Indices", exponential_growth: "Exponential Growth Indices",
  forex_exotic: "Forex Exotic", exotic_pairs: "Forex Exotic", exotic: "Forex Exotic",
  forex_major: "Forex Major", major_pairs: "Forex Major", major: "Forex Major",
  forex_micro: "Forex Micro", micro_pairs: "Forex Micro", micro: "Forex Micro",
  forex_minor: "Forex Minor", minor_pairs: "Forex Minor", minor: "Forex Minor",
  hybrid_indices: "Hybrid Indices", hybrid: "Hybrid Indices",
  indices: "Indices", index: "Indices",
  jump_indices: "Jump Indices", jump: "Jump Indices",
  laddered_volatility_indices: "Laddered Volatility Indices", laddered_volatility: "Laddered Volatility Indices",
  metals: "Metals", metal: "Metals",
  multi_step_indices: "Multi Step Indices", multi_step: "Multi Step Indices",
  range_break: "Range Break", range_break_indices: "Range Break", range_breaks: "Range Break",
  skewed_step: "Skewed Step", skewed_step_indices: "Skewed Step",
  soft_commodities: "Soft Commodities", soft_commodity: "Soft Commodities",
  spot_volatility_indices: "Spot Volatility Indices", spot_volatility: "Spot Volatility Indices",
  step_indices: "Step Indices", step: "Step Indices",
  stock_indices: "Stock Indices", stock_index: "Stock Indices",
  trek_indices: "Trek Indices", trek: "Trek Indices",
  volatility_crash_boom_indices: "Volatility Crash/Boom Indices", volatility_crash_boom: "Volatility Crash/Boom Indices",
  volatility_indices: "Volatility Indices", volatility: "Volatility Indices",
  volatility_switch_indices: "Volatility Switch Indices", volatility_switch: "Volatility Switch Indices"
};

function classifyDerivMarket(item) {
  const symbol = String(item?.symbol || "").trim();
  const market = String(item?.market || "").trim().toLowerCase();
  const subgroup = String(item?.subgroup || "").trim().toLowerCase();
  const name = String(item?.name || "").trim().toLowerCase();
  const keys = [subgroup, market].filter(Boolean);
  for (const key of keys) {
    const normalized = key.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (CATEGORY_ALIASES[normalized]) return CATEGORY_ALIASES[normalized];
    for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
      if (normalized.includes(alias)) return category;
    }
  }
  const text = `${name} ${symbol}`;
  if (/exponential growth/.test(text)) return "Exponential Growth Indices";
  if (/crash.*boom.*flip|flip.*crash.*boom/.test(text)) return "Crash Boom Flip Indices";
  if (/crash.*boom/.test(text)) return "Crash Boom Indices";
  if (/range break/.test(text)) return "Range Break";
  if (/skewed step/.test(text)) return "Skewed Step";
  if (/multi step/.test(text)) return "Multi Step Indices";
  if (/drift switching/.test(text)) return "Drift Switching Indices";
  if (/laddered volatility/.test(text)) return "Laddered Volatility Indices";
  if (/volatility switch/.test(text)) return "Volatility Switch Indices";
  if (/volatility.*crash|crash.*volatility|volatility.*boom|boom.*volatility/.test(text)) return "Volatility Crash/Boom Indices";
  if (/spot volatility/.test(text)) return "Spot Volatility Indices";
  if (/volatility/.test(text) || /^r_/.test(symbol.toLowerCase()) || /^1hz/.test(symbol.toLowerCase())) return "Volatility Indices";
  if (/jump/.test(text)) return "Jump Indices";
  if (/step/.test(text)) return "Step Indices";
  if (/trek/.test(text)) return "Trek Indices";
  if (/dex/.test(text)) return "DEX Indices";
  if (/basket/.test(text)) return "Basket Indices";
  if (/crypto|bitcoin|ethereum|litecoin|dogecoin/.test(text)) return "Crypto";
  if (/etf/.test(text)) return "ETFs";
  if (/energy|oil|brent|crude|gas/.test(text)) return "Energies";
  if (/gold|silver|platinum|palladium/.test(text)) return "Metals";
  if (/coffee|cocoa|cotton|sugar|wheat|corn/.test(text)) return "Soft Commodities";
  if (/equity|share/.test(text)) return "Equities";
  if (/forex/.test(market) || /^frx/i.test(symbol) || /\//.test(name)) return "Forex Major";
  return market === "indices" ? "Indices" : "Indices";
}

const DERIV_PUBLIC_ENDPOINTS = [
  "wss:" + "//ws.binaryws.com/websockets/v3",
  "wss:" + "//api.derivws.com/trading/v1/options/ws/public",
  "wss:" + "//ws.derivws.com/websockets/v3?app_id=1089"
];
const DERIV_DISCOVERY_TIMEOUT_MS = 20000;
const DERIV_RETRY_BASE_MS = 2000;

export default function LiveMarketPanel({ compact = false, selectedSymbol = null, onSymbolChange, onPriceChange, onOpenTerminal }) {
  const [markets, setMarkets] = useState([]);
  const [ticks, setTicks] = useState({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discoveryComplete, setDiscoveryComplete] = useState(false);
  const [error, setError] = useState("");
  const [feedMode, setFeedMode] = useState("BROWSER");
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
    let serverPollTimer = null;
    let retryCount = 0;
    let symbolsLoaded = false;
    let failureHandled = false;
    let connectTimeout = null;
    let activeSubscription = null;
    let serverFallbackActive = false;

    const nextReqId = () => ++requestSeqRef.current;

    const applyServerMarkets = markets => {
      const unique = Array.from(new Map(
        (Array.isArray(markets) ? markets : [])
          .map(item => ({
            symbol: item?.symbol,
            name: item?.name || item?.symbol,
            market: item?.market || "Other",
            subgroup: item?.subgroup || "",
            isActive: item?.isActive !== false
          }))
          .filter(item => item.symbol)
          .map(item => [item.symbol, item])
      ).values());
      if (!unique.length) throw new Error("DERIV_PUBLIC_MARKET_CATALOG_EMPTY");
      setMarkets(unique);
      setFocusedSymbol(current => current || selectedSymbolRef.current || unique[0]?.symbol || "");
      setLoading(false);
      setDiscoveryComplete(true);
      return unique;
    };

    const stopServerTickPolling = () => {
      if (serverPollTimer) clearTimeout(serverPollTimer);
      serverPollTimer = null;
      serverFallbackActive = false;
    };

    const startServerTickPolling = () => {
      if (disposed || serverFallbackActive) return;
      serverFallbackActive = true;
      setFeedMode("SERVER");
      const poll = async () => {
        if (disposed || !serverFallbackActive) return;
        const marketSymbol = selectedSymbolRef.current || focusedSymbol;
        if (marketSymbol) {
          try {
            const { data, error: invokeError } = await supabase.functions.invoke("market-data", {
              body: { operation: "tick", symbol: marketSymbol }
            });
            const tick = data?.ok ? data.data : null;
            const quote = Number(tick?.quote);
            const epoch = Number(tick?.epoch);
            if (!invokeError && Number.isFinite(quote) && Number.isFinite(epoch)) {
              const nextTick = { quote, epoch, pipSize: tick?.pipSize ?? null };
              setTicks(prev => ({ ...prev, [marketSymbol]: nextTick }));
              setConnected(true);
              setError("");
              onPriceChangeRef.current?.(nextTick);
            }
          } catch {}
        }
        if (!disposed && serverFallbackActive) serverPollTimer = setTimeout(poll, 2500);
      };
      poll();
    };

    const loadServerCatalog = async () => {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("market-data", {
          body: { operation: "catalog" }
        });
        if (invokeError) throw invokeError;
        const payload = data?.ok ? data.data : null;
        const unique = applyServerMarkets(payload?.markets);
        setFeedMode("SERVER");
        setError("");
        startServerTickPolling();
        return unique;
      } catch {
        return null;
      }
    };

    const subscribeSymbol = symbol => {
      if (!symbol || disposed || socket?.readyState !== WebSocket.OPEN) return;
      if (activeSubscription === symbol) return;
      activeSubscription = symbol;
      try { socket.send(JSON.stringify({ forget_all: "ticks", req_id: nextReqId() })); } catch {}
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
        setDiscoveryComplete(prev => prev || serverFallbackActive);
        if (!serverFallbackActive) {
          setError(reason || "Could not reach Deriv market data. Check network WebSocket access.");
          startServerTickPolling();
        }
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
          scheduleNextEndpoint("Deriv connected too slowly or did not return its active-symbol list. Using the secure server market relay.");
        }
      }, DERIV_DISCOVERY_TIMEOUT_MS);

      socket.onopen = () => {
        if (disposed) return;
        setConnected(true);
        setFeedMode("BROWSER");
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
              setConnected(true);
              setError("");
              return;
            }

            if (message.msg_type === "active_symbols" || message.req_id === 1) {
              setLoading(false);
              setDiscoveryComplete(false);
              if (!serverFallbackActive) setError("Deriv market discovery failed: " + messageText);
              clearConnectionTimeout();
            } else if (message.msg_type === "tick" && !isClosedMarket && !serverFallbackActive) {
              setError("A live price subscription failed: " + messageText);
            }
            return;
          }

          if (message.msg_type === "active_symbols" && Array.isArray(message.active_symbols)) {
            const discovered = message.active_symbols.map(item => ({
              symbol: item.underlying_symbol ?? item.symbol,
              name: item.underlying_symbol_name ?? item.display_name ?? item.symbol,
              market: classifyDerivMarket({ symbol: item.underlying_symbol ?? item.symbol, name: item.underlying_symbol_name ?? item.display_name ?? item.symbol, market: item.market_display_name ?? item.market ?? item.symbol_type ?? item.underlying_symbol_type, subgroup: item.subgroup ?? item.submarket }),
              subgroup: item.subgroup ?? item.submarket ?? ""
            })).filter(item => item.symbol && item.name);
            const unique = Array.from(new Map(discovered.map(item => [item.symbol, item])).values());
            symbolsLoaded = true;
            clearConnectionTimeout();
            setMarkets(currentMarkets => {
              const merged = Array.from(new Map([...currentMarkets, ...unique].map(item => [item.symbol, item])).values());
              return merged;
            });
            setFocusedSymbol(current => current || selectedSymbolRef.current || unique[0]?.symbol || "");
            setLoading(false);
            setDiscoveryComplete(true);
            setConnected(true);
            setFeedMode("BROWSER");
            setError("");
            // Keep the expanded server-discovered catalog; browser discovery only adds/refreshes symbols.
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
              supabase.from("market_symbols").upsert(rows, { onConflict: "symbol" })
                .then(({ error: syncError }) => {
                  if (syncError) console.warn("Supabase market catalog sync failed:", syncError.message);
                })
                .catch(syncError => console.warn("Supabase market catalog sync failed:", syncError?.message || syncError));
            }

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
            stopServerTickPolling();
          }
        } catch {
          if (!serverFallbackActive) setError("Deriv returned a response that could not be read.");
        }
      };

      socket.onerror = () => {
        if (disposed || failureHandled) return;
        retryTimer = setTimeout(() => {
          if (!symbolsLoaded && !disposed) scheduleNextEndpoint("Unable to establish a WebSocket connection to Deriv. Using the secure server market relay.");
        }, 1200);
      };

      socket.onclose = () => {
        if (disposed) return;
        setConnected(false);
        clearConnectionTimeout();
        activeSubscription = null;
        if (!symbolsLoaded) {
          scheduleNextEndpoint("Deriv closed the connection before sending active markets. Using the secure server market relay.");
        } else {
          startServerTickPolling();
          retryTimer = setTimeout(() => {
            endpointIndex = 0;
            connect();
          }, Math.min(30000, DERIV_RETRY_BASE_MS * (2 ** Math.min(retryCount++, 4))));
        }
      };
    };

    loadServerCatalog().then(serverMarkets => {
      if (!disposed && !serverMarkets) connect();
    });

    return () => {
      disposed = true;
      clearConnectionTimeout();
      if (retryTimer) clearTimeout(retryTimer);
      stopServerTickPolling();
      try { socket?.close(); } catch {}
      if (socketRef.current === socket) socketRef.current = null;
      subscribeSymbolRef.current = null;
    };
  }, []);

  const categories = useMemo(
    () => ["ALL", ...DERIV_MARKET_CATEGORIES.filter(category => markets.some(item => item.market === category))],
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
  const activeMarketCount = useMemo(() => markets.filter(item => item.isActive !== false).length, [markets]);
  const focusedMarket = markets.find(item => item.symbol === focusedSymbol);

  return <section className="panel market-panel">
    <div className="panel-title market-title">
      <span>LIVE DERIV MARKET — ALL ACTIVE SYMBOLS</span>
      <span className={connected ? "market-status connected" : "market-status"}>● {connected ? (feedMode === "SERVER" ? "SERVER STREAM" : "STREAMING") : "CONNECTING"}</span>
    </div>
    <div className="market-toolbar">
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search every Deriv market or symbol..." aria-label="Search Deriv markets" />
      <select value={marketFilter} onChange={event => setMarketFilter(event.target.value)}>
        {categories.map(category => <option key={category} value={category}>{category}</option>)}
      </select>
      <span className="market-count">{loading ? "Discovering all Deriv markets…" : `${visibleMarkets.length} shown / ${markets.length} total · ${activeMarketCount} active now`}</span>
    </div>
    {error && <div className="market-error" role="status">{error}</div>}
    <div className={compact ? "market-grid compact" : "market-grid"}>
      {visibleMarkets.map(item => {
        const tick = ticks[item.symbol];
        return <button key={item.symbol} className={(selectedSymbol === item.symbol || focusedSymbol === item.symbol) ? "market-card selected" : "market-card"} onClick={() => { setFocusedSymbol(item.symbol); onSymbolChange?.(item.symbol); }} title={item.name}>
          <span>{item.name}</span>
          <small>{item.symbol} • {item.market} • {item.isActive === false ? "scheduled" : "active now"}</small>
          <strong>{tick && Number.isFinite(tick.quote) ? tick.quote.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "—"}</strong>
          <small>{tick ? new Date(tick.epoch * 1000).toLocaleTimeString() : "waiting for tick"}</small>
        </button>;
      })}
    </div>
    {!compact && focusedMarket && <div className="market-detail"><div className="market-detail-heading"><div><span className="market-detail-kicker">SELECTED MARKET</span><h3>{focusedMarket.name}</h3><p>{focusedMarket.symbol} · {focusedMarket.market}</p></div><div className="market-detail-quote"><small>Latest public quote</small><strong>{ticks[focusedMarket.symbol] && Number.isFinite(ticks[focusedMarket.symbol].quote) ? ticks[focusedMarket.symbol].quote.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "Waiting for quote…"} </strong><small>{ticks[focusedMarket.symbol] ? new Date(ticks[focusedMarket.symbol].epoch * 1000).toLocaleTimeString() : "Feed initializing"}</small></div></div><div className="market-detail-actions"><button className="market-open-terminal" onClick={() => onOpenTerminal?.(focusedMarket.symbol)}>Open Web Terminal <span>→</span></button><button className="market-mt5-placeholder" disabled title="MT5 integration is not available yet">MT5 Terminal · Coming later</button></div><p className="market-detail-note">Choose a market here, review its current public price, then open the terminal to view candles and place sandbox orders. Selecting a market does not place an order.</p></div>}
    {!loading && discoveryComplete && visibleMarkets.length === 0 && <div className="market-empty">No active Deriv symbols match this filter.</div>}
    {!loading && !discoveryComplete && markets.length === 0 && <div className="market-empty">Market list is unavailable until the Deriv connection succeeds. The diagnostic above explains the latest failure.</div>}
    <div className="market-footnote">Dynamically discovered from Deriv <code>active_symbols=full</code> plus the complete <code>trading_times=today</code> symbol hierarchy. The market list is synchronized to Supabase. If a browser WebSocket is unavailable, the authenticated Supabase Edge Function securely relays public Deriv market data instead. Public live market data only; trading credentials remain server-side.</div>
  </section>;
}
