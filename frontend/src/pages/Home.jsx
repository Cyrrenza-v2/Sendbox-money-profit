import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const money = (value, currency = "USD") => value == null || !Number.isFinite(Number(value)) ? "Unavailable" : Number(value).toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: 2 });
const display = value => value == null || value === "" ? "Unavailable" : String(value);

export default function Home() {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const load = useCallback(async () => {
    setState({ loading: true, error: "", data: null });
    try {
      const { data, error } = await supabase.functions.invoke("home-summary");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setState({ loading: false, error: "", data });
    } catch (e) {
      setState({ loading: false, error: e?.message || "Unable to retrieve Home Summary.", data: null });
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const data = state.data;
  const sandbox = data?.sandbox || {};
  const currency = sandbox.currency || "USD";
  return <div className="vel-page">
    <div className="vel-page-heading"><div><div className="vel-eyebrow">PHASE 17 / COMMAND CENTER</div><h1>Home Command Center</h1><p>Authenticated account, infrastructure, and market summary from Supabase.</p></div><span className="vel-data-source">LIVE DATA · NO MOCK VALUES</span></div>
    {state.loading ? <div className="vel-panel vel-state">Loading authenticated Home Summary…</div> :
    state.error ? <div className="vel-panel vel-error"><b>Home summary unavailable</b><p>{state.error}</p><button className="vel-button" onClick={load}>Retry connection</button></div> : <>
      <div className="vel-metric-grid">
        <Metric label="SANDBOX AVAILABLE CAPITAL" value={money(sandbox.availableCapital, currency)} detail="Virtual account only" />
        <Metric label="SANDBOX EQUITY" value={money(sandbox.equity, currency)} detail="Reported by backend" />
        <Metric label="FLOATING P/L" value={money(sandbox.floatingPnl, currency)} detail="Open sandbox positions" />
        <Metric label="OPEN POSITIONS" value={sandbox.openPositionsCount == null ? "Unavailable" : String(sandbox.openPositionsCount)} detail="Authenticated account" />
      </div>
      <div className="vel-home-columns">
        <section className="vel-panel"><div className="vel-panel-title">ACCOUNT & CONNECTIONS <span>SUPABASE</span></div>
          <StatusRow label="Sandbox account" value={display(sandbox.accountStatus)} />
          <StatusRow label="Deriv connection" value={display(data?.deriv?.status)} />
          <StatusRow label="MT5 infrastructure" value={display(data?.mt5?.status)} />
          <StatusRow label="Real trading" value={data?.realTrading?.enabled === true ? "Enabled in configuration" : data?.realTrading?.enabled === false ? "Disabled" : "Unavailable"} />
          <StatusRow label="Environment" value={display(data?.system?.environment)} />
        </section>
        <section className="vel-panel"><div className="vel-panel-title">MARKET SNAPSHOT <span>{display(data?.market?.status)}</span></div>
          {data?.market?.symbols?.length ? data.market.symbols.slice(0, 6).map((item, index) => <div className="vel-market-row" key={item.symbol || index}><div><b>{display(item.symbol)}</b><small>Supabase market data</small></div><strong>{item.bid == null ? "Unavailable" : String(item.bid)}</strong><span>ASK {item.ask == null ? "—" : String(item.ask)}</span></div>) : <div className="vel-empty-inline">No market symbols returned by the backend.</div>}
        </section>
      </div>
      <div className="vel-footnote">Updated {data?.timestamp ? new Date(data.timestamp).toLocaleString() : "time unavailable"} · Source: authenticated Supabase Edge Function <code>home-summary</code></div>
    </>}
  </div>;
}
function Metric({ label, value, detail }) { return <div className="vel-metric-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function StatusRow({ label, value }) { const okay = /connected|active|enabled|ready|live|healthy/i.test(value) && !/not connected|disabled/i.test(value); return <div className="vel-status-row"><span>{label}</span><b className={okay ? "is-good" : "is-neutral"}><i />{value}</b></div>; }
