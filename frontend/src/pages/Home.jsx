import { useEffect, useState } from "react";
import { api } from "../lib/api";

const money = (v, currency = "USD") => v == null ? "—" : new Intl.NumberFormat("en-US", {
  style: "currency", currency, minimumFractionDigits: 2
}).format(Number(v));

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    try { setError(""); setData(await api("/home-summary")); }
    catch (e) { setError(e.message || "Unable to load live command data."); }
  };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  if (error) return <div className="page"><div className="panel error-panel"><h1>Command Center unavailable</h1><p>{error}</p><button className="primary" onClick={load}>RETRY</button></div></div>;
  if (!data) return <div className="page"><div className="loading">Loading live command center…</div></div>;
  const s = data.sandbox || {}, currency = s.currency || "USD";
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">OVERVIEW / COMMAND CENTER</span><h1>Home</h1><p>Authoritative operating state from VELTRION backend.</p></div><span className="live-stamp">LIVE DATA</span></div>
    <div className="metric-grid">
      <Metric label="SANDBOX CAPITAL" value={money(s.initialCapital, currency)} sub={s.accountStatus || "—"} />
      <Metric label="AVAILABLE CAPITAL" value={money(s.availableCapital, currency)} sub="Database balance" />
      <Metric label="EQUITY" value={money(s.equity, currency)} sub="Current equity" />
      <Metric label="WITHDRAWABLE" value={money(s.withdrawable, currency)} sub="Sandbox accounting" />
    </div>
    <div className="metric-grid compact">
      <Metric label="OPEN POSITIONS" value={String(s.openPositionsCount ?? "—")} sub="Sandbox" />
      <Metric label="FLOATING P/L" value={money(s.floatingPnl, currency)} sub="Live stored positions" />
      <Metric label="DERIV" value={String(data.deriv?.status || "—").toUpperCase()} sub={data.deriv?.account || "Account not connected"} />
      <Metric label="MT5" value={String(data.mt5?.status || "—").toUpperCase()} sub={data.mt5?.server || "Gateway not connected"} />
    </div>
    <div className="two-col">
      <section className="panel"><div className="panel-title"><h2>Market Overview</h2><span>BACKEND SNAPSHOT</span></div>
        {(data.market?.symbols || []).length ? <div className="market-list">{data.market.symbols.map(x => <div className="market-row" key={x.symbol}><b>{x.symbol}</b><span>{x.bid ?? "—"}</span><span>{x.ask ?? "—"}</span><em>{x.updatedAt ? new Date(x.updatedAt).toLocaleTimeString() : "—"}</em></div>)}</div> : <div className="empty">No market snapshot is available from the backend.</div>}
      </section>
      <section className="panel"><div className="panel-title"><h2>System Health</h2><span>{data.system?.status || "—"}</span></div>
        <div className="health-card"><b>{data.system?.status || "UNKNOWN"}</b><p>{data.system?.message || "Backend health endpoint responded."}</p></div>
        <div className="row-line"><span>Real trading</span><b>{data.realTrading?.enabled ? "ENABLED" : "LOCKED"}</b></div>
        <div className="row-line"><span>Trading mode</span><b>{data.realTrading?.mode || "—"}</b></div>
      </section>
    </div>
    <section className="panel"><div className="panel-title"><h2>Connections</h2><span>AUTHENTICATED STATE</span></div>
      <div className="connection-grid">
        <button className="connection-card" onClick={() => location.href="/Sendbox-money-profit/app/deriv/account"}><b>DERIV</b><span>{data.deriv?.status || "NOT CONNECTED"}</span><small>{data.deriv?.account || "Connect a real Deriv account"}</small></button>
        <button className="connection-card" onClick={() => location.href="/Sendbox-money-profit/app/mt5/overview"}><b>MT5</b><span>{data.mt5?.status || "NOT CONNECTED"}</span><small>{data.mt5?.server || "Bridge not connected"}</small></button>
      </div>
    </section>
  </div>;
}
function Metric({label,value,sub}) { return <div className="metric"><small>{label}</small><strong>{value}</strong><span>{sub}</span></div>; }
