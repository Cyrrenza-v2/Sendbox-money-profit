import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { supabase } from "../supabaseClient";

const DERIV_MT5_WEB = "https://deriv.com/trading-platforms/mt5/web-terminal";
const fmt=(n,d=2)=>Number.isFinite(Number(n))?Number(n).toLocaleString("en-US",{maximumFractionDigits:d}):"—";

async function invokeMt5Bridge(){
  let {data:sessionData,error:sessionError}=await supabase.auth.getSession();
  let session=sessionData?.session||null;
  if(sessionError) throw new Error("AUTH_SESSION_LOOKUP_FAILED");
  if(!session) throw new Error("AUTH_SESSION_REQUIRED");
  const expiresAtMs=Number(session.expires_at||0)*1000;
  if(expiresAtMs&&expiresAtMs<Date.now()+60000){
    const refreshed=await supabase.auth.refreshSession();
    if(refreshed.error||!refreshed.data?.session) throw new Error("AUTH_SESSION_REFRESH_FAILED");
    session=refreshed.data.session;
  }
  const {data,error}=await supabase.functions.invoke("mt5-bridge",{
    method:"GET",
    headers:{Authorization:`Bearer ${session.access_token}`}
  });
  if(error){
    let detail=data?.error||"";
    try{
      const response=error?.context;
      if(!detail&&response?.json){
        const body=await response.clone().json();
        detail=body?.error||body?.message||"";
      }
    }catch{}
    throw new Error(String(detail||error.message||"MT5_BRIDGE_UNAVAILABLE"));
  }
  return data;
}

function Metric({label,value,detail}){return <div className="market-account-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>}

export default function RealMT5Terminal(){
  const [params,setParams]=useSearchParams();
  const symbol=params.get("symbol")||"frxEURUSD";
  const [side,setSide]=useState(false);
  const [snapshot,setSnapshot]=useState(null);
  const [error,setError]=useState("");
  const [lastSync,setLastSync]=useState(null);
  const [loading,setLoading]=useState(true);

  const refresh=async()=>{
    try{
      const data=await invokeMt5Bridge();
      setSnapshot(data?.snapshot||null);
      setError("");
      setLastSync(new Date());
    }catch(e){
      setError(e.message||"MT5_BRIDGE_UNAVAILABLE");
    }finally{setLoading(false)}
  };

  useEffect(()=>{
    let dead=false;
    const run=async()=>{if(!dead)await refresh()};
    run();
    const id=setInterval(run,5000);
    const wake=()=>{if(!document.hidden)run()};
    document.addEventListener("visibilitychange",wake);
    window.addEventListener("focus",wake);
    return()=>{dead=true;clearInterval(id);document.removeEventListener("visibilitychange",wake);window.removeEventListener("focus",wake)};
  },[]);

  const connection=snapshot?.connection||null;
  const meta=connection?.metadata||{};
  const account=meta?.account||{};
  const positions=Array.isArray(meta?.positions)?meta.positions:[];
  const orders=Array.isArray(meta?.orders)?meta.orders:[];
  const deals=Array.isArray(meta?.deals)?meta.deals:[];
  const environment=String(connection?.environment||meta?.environment||"real").toLowerCase();
  const connected=connection?.status==="connected";
  const displayStatus=connected?"MT5 BRIDGE CONNECTED":loading?"CONNECTING":"MT5 BRIDGE NOT CONNECTED";
  const syncTime=lastSync?lastSync.toLocaleTimeString():"Not synchronized";
  const terminalSymbol=useMemo(()=>symbol,[symbol]);

  const openOfficialMt5=()=>window.open(DERIV_MT5_WEB,"_blank","noopener,noreferrer");

  return <div className="app-layout">
    <Sidebar isOpen={side} onClose={()=>setSide(false)}/>
    <div className="app-main">
      <header className="topbar">
        <button className="menu-button" onClick={()=>setSide(true)}>☰</button>
        <span className="topbar-brand">VELTRION MT5 WORKSPACE</span>
        <span className="admin-badge real-badge">● READ ONLY</span>
      </header>

      <main className="content vt-page">
        <header className="vt-heading">
          <div>
            <span className="eyebrow real-eyebrow">DERIV MT5 STANDARD REAL</span>
            <h1>MT5 Account — Read Only</h1>
            <p>VELTRION monitors your Deriv MT5 account through the private bridge. Real MT5 orders are executed only in Deriv MT5's official web, desktop, or mobile terminal.</p>
          </div>
          <div className="vt-header-actions">
            <span className={connected?"vt-feed live":"vt-feed"}><i/> {displayStatus}</span>
            <button className="market-open-terminal" onClick={openOfficialMt5}>Open Deriv MT5 Web <span>→</span></button>
          </div>
        </header>

        {error&&<div className="market-detail-note">MT5 bridge: {error}. The terminal will retry automatically and will not invent account data.</div>}

        <div className="market-account-strip">
          <Metric label="MT5 BALANCE" value={fmt(account.balance,2)} detail={`${connection?.account_currency||"USD"} · ${syncTime}`}/>
          <Metric label="EQUITY" value={fmt(account.equity,2)} detail="Last bridge snapshot"/>
          <Metric label="MARGIN" value={fmt(account.margin,2)} detail={`Free margin ${fmt(account.free_margin,2)}`}/>
          <Metric label="CONNECTION" value={connected?"CONNECTED":"NOT CONNECTED"} detail={`Environment: ${environment.toUpperCase()}`}/>
        </div>

        <LiveMarketPanel selectedSymbol={terminalSymbol} onSymbolChange={next=>{
          const p=new URLSearchParams(params);
          p.set("symbol",next);
          setParams(p,{replace:true});
        }} onPriceChange={()=>{}}/>

        <section className="vt-panel">
          <div className="vt-section-title">
            <div><h2>MT5 Connection</h2><p>Server/account telemetry supplied by the VELTRION MT5 bridge</p></div>
            <span className="vt-ai-tag">{connected?"CONNECTED":"WAITING"}</span>
          </div>
          <div className="metric-grid">
            <div className="metric-card"><span>Broker</span><strong>{connection?.broker||"—"}</strong><small>MT5 broker identity</small></div>
            <div className="metric-card"><span>Server</span><strong>{connection?.server||"—"}</strong><small>Use the exact server shown in Deriv Trader's Hub</small></div>
            <div className="metric-card"><span>Login</span><strong>{connection?.login||"—"}</strong><small>MT5 account login</small></div>
            <div className="metric-card"><span>Last heartbeat</span><strong>{connection?.last_heartbeat_at?new Date(connection.last_heartbeat_at).toLocaleTimeString():"—"}</strong><small>{connection?.last_heartbeat_at||"No bridge heartbeat yet"}</small></div>
          </div>
          <div className="market-detail-note">
            <strong>Execution boundary:</strong> Deriv documents that MT5 trading itself is not supported through its APIs; MT5 trading is performed in the official MT5 application/web terminal. VELTRION therefore stays read-only here and synchronizes account snapshots rather than pretending its Options API is an MT5 execution API.
          </div>
        </section>

        <div className="vt-lower-grid">
          <section className="vt-panel">
            <div className="vt-section-title"><div><h2>Open MT5 Positions</h2><p>Last bridge snapshot</p></div><span className="vt-ai-tag">READ ONLY</span></div>
            {positions.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Ticket</th><th>Symbol</th><th>Type</th><th>Volume</th><th>Profit</th></tr></thead><tbody>{positions.map((p,i)=><tr key={String(p.ticket??p.position_id??i)}><td>{p.ticket??p.position_id??"—"}</td><td>{p.symbol??"—"}</td><td>{p.type??p.side??"—"}</td><td>{p.volume??p.quantity??"—"}</td><td>{fmt(p.profit??p.unrealized_pnl,2)}</td></tr>)}</tbody></table></div>:<div className="vt-empty">{connected?"No open MT5 positions in the latest snapshot.":"Connect the VELTRION MT5 bridge to display positions."}</div>}
          </section>

          <section className="vt-panel">
            <div className="vt-section-title"><div><h2>Orders & Deals</h2><p>Last synchronized MT5 records</p></div><span className="vt-ai-tag">{orders.length+deals.length}</span></div>
            {orders.length||deals.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Type</th><th>Ticket</th><th>Symbol</th><th>Volume</th><th>Price</th></tr></thead><tbody>{[...orders.map(x=>({...x,__kind:"ORDER"})),...deals.map(x=>({...x,__kind:"DEAL"}))].slice(0,50).map((x,i)=><tr key={String(x.ticket??x.order??x.deal??i)+x.__kind}><td>{x.__kind}</td><td>{x.ticket??x.order??x.deal??"—"}</td><td>{x.symbol??"—"}</td><td>{x.volume??"—"}</td><td>{x.price??"—"}</td></tr>)}</tbody></table></div>:<div className="vt-empty">{connected?"No orders/deals in the latest snapshot.":"Connect the VELTRION MT5 bridge to display orders and deals."}</div>}
          </section>
        </div>

        <section className="vt-panel">
          <div className="vt-section-title"><div><h2>Real Trading Gate</h2><p>Production execution remains deliberately locked</p></div><span className="vt-ai-tag">LOCKED</span></div>
          <div className="market-detail-note">
            VELTRION will not place a real MT5 order from this page. Your real MT5 account can be traded through the official Deriv MT5 terminal, while VELTRION can retain the private monitoring/reconciliation layer. This prevents the previous mismatch where the page called Deriv's Options trading API while presenting itself as an MT5 terminal.
          </div>
        </section>

        <footer className="vt-footer">REAL MT5 ACCOUNT — READ ONLY · No MT5 password is stored in the browser · Account data comes from the private bridge · Real execution remains in the official Deriv MT5 terminal.</footer>
      </main>
    </div>
  </div>;
}
