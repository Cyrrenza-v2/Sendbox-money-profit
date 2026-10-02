import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Mt5ConnectionView() {
  const [data,setData]=useState(null),[error,setError]=useState("");
  const refresh=()=>api("/mt5/status").then(setData).catch(e=>setError(e.message));
  useEffect(()=>{refresh();const id=setInterval(refresh,5000);return()=>clearInterval(id)},[]);
  const bridge=data?.data||data||{};
  return <div className="page-stack">
    <div className="page-heading"><div><span className="eyebrow">CONNECTIONS / MT5</span><h1>MetaTrader 5 Infrastructure</h1><p>Sandbox bridge telemetry only. No real-money execution is enabled by this view.</p></div><span className="status-pill">{bridge.status||bridge.connection_status||"UNKNOWN"}</span></div>
    {error&&<div className="error-box">{error}</div>}
    <div className="metric-grid">
      <div className="metric-card"><span>Server</span><strong>{bridge.server_name||bridge.server||"VELTRION-VIRTUAL"}</strong><small>Broker/server infrastructure status</small></div>
      <div className="metric-card"><span>Login</span><strong>{bridge.login_id||bridge.login||"—"}</strong><small>Issued sandbox account</small></div>
      <div className="metric-card"><span>Heartbeat</span><strong>{bridge.last_heartbeat||"—"}</strong><small>Latest bridge heartbeat</small></div>
      <div className="metric-card"><span>Balance</span><strong>{bridge.balance==null?"—":Number(bridge.balance).toLocaleString(undefined,{minimumFractionDigits:2})}</strong><small>Backend-reported sandbox balance</small></div>
      <div className="metric-card"><span>Equity</span><strong>{bridge.equity==null?"—":Number(bridge.equity).toLocaleString(undefined,{minimumFractionDigits:2})}</strong><small>Backend-reported sandbox equity</small></div>
      <div className="metric-card"><span>Open positions</span><strong>{bridge.open_positions??"—"}</strong><small>Shared sandbox ledger</small></div>
    </div>
    <section className="panel"><div className="panel-title"><h2>Bridge response</h2><span>/mt5/status</span></div><pre className="data-view">{JSON.stringify(data,null,2)}</pre></section>
  </div>;
}
