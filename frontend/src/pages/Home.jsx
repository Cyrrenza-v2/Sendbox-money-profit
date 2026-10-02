import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { supabase } from "../supabaseClient";

const money = (value) => value == null ? "$0.00" : Number(value).toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2});

export default function Home() {
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [sandbox,setSandbox]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function loadSandbox(){
    setLoading(true); setError("");
    try{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error("AUTH_REQUIRED");
      const {data,error:queryError}=await supabase.from("sandbox_accounts")
        .select("id,currency,initial_capital,available_capital,allocated_capital,withdrawable,status,updated_at")
        .eq("user_id",user.id).maybeSingle();
      if(queryError) throw queryError;
      setSandbox(data||{currency:"USD",initial_capital:100000,available_capital:100000,allocated_capital:0,withdrawable:0,status:"active"});
    }catch(err){setError(err?.message||"Unable to load sandbox account.");}
    finally{setLoading(false);}
  }

  useEffect(()=>{loadSandbox();},[]);
  const initial=Number(sandbox?.initial_capital??100000);
  const available=Number(sandbox?.available_capital??initial);
  const profit=available-initial;

  return <div className="app-layout">
    <Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
    <div className="app-main">
      <header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}>☰</button><span className="topbar-brand">VELTRION</span><span className="admin-badge">● ADMIN</span></header>
      <main className="content">
        <section className="page-heading"><div><span className="eyebrow">PHASE 6 / COMMAND CENTER</span><h1>Home</h1><p>Sandbox capital stays virtual while live Deriv market data streams below.</p></div><span className="live-badge">● SUPABASE AUTHENTICATED</span></section>
        {error&&<div className="error-panel"><b>Sandbox data unavailable</b><p>{error}</p><button className="button primary" onClick={loadSandbox}>RETRY</button></div>}
        {loading?<div className="loading-panel">Loading VELTRION…</div>:<>
          <div className="metric-grid">
            <Metric label="SANDBOX PROFIT WALLET" value={money(profit)} sub="Virtual P/L only" positive={profit>=0}/>
            <Metric label="VIRTUAL CAPITAL" value={money(available)} sub="Available sandbox balance"/>
            <Metric label="STARTING CAPITAL" value={money(initial)} sub="Initial virtual capital"/>
            <Metric label="STATUS" value={String(sandbox?.status||"ACTIVE").toUpperCase()} sub="Sandbox account"/>
          </div>
          <LiveMarketPanel compact />
          <div className="panel"><div className="panel-title">CONNECTIONS</div>
            <div className="connection-row"><div><strong>SUPABASE</strong><span>Auth and sandbox data are connected to the project database.</span></div><b className="active-text">● CONNECTED</b></div>
            <div className="divider"/>
            <div className="connection-row"><div><strong>DERIV MARKET</strong><span>Public live quotes stream directly from Deriv's no-auth market channel.</span></div><b className="active-text">● STREAMING</b></div>
            <div className="divider"/>
            <div className="connection-row"><div><strong>REAL EXECUTION</strong><span>Server-side credentials are isolated; live execution remains locked until configured.</span></div><b className="offline">● LOCKED</b></div>
          </div>
          <div className="panel"><div className="panel-title">TRADING OVERVIEW</div>
            <div className="metric-list"><div><span>Today's P/L</span><strong>{money(0)}</strong></div><div><span>Open Positions</span><strong>0</strong></div><div><span>Available Capital</span><strong>{money(available)}</strong></div></div>
            <button className="button danger full" onClick={()=>window.location.hash="/real-trading"}>OPEN REAL TRADING TERMINAL</button>
          </div>
        </>}
      </main>
    </div>
  </div>;
}
function Metric({label,value,sub,positive}){return <div className="metric-card"><small>{label}</small><strong className={positive===false?"negative":positive?"positive":""}>{value}</strong><span>{sub}</span></div>}
