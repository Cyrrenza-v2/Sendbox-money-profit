import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { derivMarketService } from "../services/derivWebSocket";

const TARGETS = [
  { key: "EURUSD", label: "EUR/USD", pattern: "EUR/USD" },
  { key: "GBPUSD", label: "GBP/USD", pattern: "GBP/USD" },
  { key: "USDJPY", label: "USD/JPY", pattern: "USD/JPY" },
  { key: "XAUUSD", label: "Gold (XAU/USD)", pattern: "Gold" }
];

export default function Markets() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("CONNECTING");
  const [prices, setPrices] = useState({});
  const [resolved, setResolved] = useState({});

  useEffect(() => {
    const off = derivMarketService.onStatus(setStatus);
    derivMarketService.connect();
    const timer = setInterval(() => {
      const next = {};
      TARGETS.forEach((target) => {
        const item = derivMarketService.getSymbolByName(target.pattern);
        if (item) next[target.key] = item.code;
      });
      setResolved(next);
    }, 1000);
    return () => {
      off();
      clearInterval(timer);
      derivMarketService.disconnect();
    };
  }, []);

  useEffect(() => {
    Object.entries(resolved).forEach(([key, code]) => {
      derivMarketService.subscribeTick(code, (tick) => {
        setPrices((prev) => ({
          ...prev,
          [key]: {
            price: Number(tick.quote),
            time: new Date(Number(tick.epoch) * 1000).toLocaleTimeString()
          }
        }));
      });
    });
  }, [resolved]);

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="main">
        <header>
          <button className="menu" onClick={() => setOpen(true)}>☰</button>
          <b>LIVE MARKETS</b>
          <span className="online">● {status}</span>
        </header>
        <section className="content">
          <div className="hero">
            <span className="secure-badge">LIVE PUBLIC MARKET DATA • NO TRADE EXECUTION</span>
            <h1>Deriv market monitor</h1>
            <p className="muted">Public market ticks stream directly from Deriv. They do not change the VELTRION sandbox ledger.</p>
          </div>
          <div className="card">
            {TARGETS.map((target) => {
              const data = prices[target.key];
              return (
                <div className="row" key={target.key}>
                  <div>
                    <b>{target.label}</b>
                    <small>{resolved[target.key] || "Resolving symbol…"}</small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{data ? data.price.toFixed(5) : "—"}</strong>
                    <small>{data ? "● LIVE " + data.time : status}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
