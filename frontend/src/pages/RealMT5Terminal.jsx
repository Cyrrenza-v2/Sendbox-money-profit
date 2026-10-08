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
  const [channels,setChannels]=useState({});
  const [derivAccounts,setDerivAccounts]=useState([]);\n  const [demoVolume,setDemoVolume]=useState("0.01");\n  const [demoMessage,setDemoMessage]=useState("");\n  const [demoBusy,setDemoBusy]=useState(false);

  const refresh=async()=>{
    try{
      const data=await invokeMt5Bridge();
      setSnapshot(data?.snapshot||null);
      setChannels(data?.connections||{});
      const {data:registry,error:registryError}=await supabase.from("deriv_accounts").select("deriv_account_id,account_type,currency,status,last_synced_at").order("last_synced_at",{ascending:false});
      if(registryError) throw registryError;
      setDerivAccounts(registry||[]);
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

  const realConnection=channels?.real||null;
  const demoConnection=channels?.sandbox||null;
  const connection=realConnection||null;
  const meta=connection?.metadata||{};
  const account={balance:meta.balance,equity:meta.equity,margin:meta.margin,free_margin:meta.free_margin};
  const positions=Array.isArray(meta?.positions)?meta.positions:[];
  const orders=Array.isArray(meta?.orders)?meta.orders:[];
  const deals=Array.isArray(meta?.deals)?meta.deals:[];
  const historyOrders=Array.isArray(meta?.history_orders)?meta.history_orders:[];
  const historyDeals=Array.isArray(meta?.history_deals)?meta.history_deals:[];
  const environment=String(connection?.environment||meta?.environment||"real").toLowerCase();
  const connected=realConnection?.status==="connected";
  const demoConnected=demoConnection?.status==="connected";
  const displayStatus=connected?"MT5 REAL BRIDGE CONNECTED":loading?"CONNECTING":"MT5 REAL BRIDGE NOT CONNECTED";
  const syncTime=lastSync?lastSync.toLocaleTimeString():"Not synchronized";
  const terminalSymbol=useMemo(()=>symbol,[symbol]);

  const openOfficialMt5=()=>window.open(DERIV_MT5_WEB,"_blank","noopener,noreferrer");\n  const submitDemoOrder=async(nextSide)=>{\n    if(!demoConnection?.id){setDemoMessage("Connect a DEMO MT5 bridge first.");return}\n    const volume=Number(demoVolume);\n    if(!Number.isFinite(volume)||volume<=0){setDemoMessage("Enter a valid demo volume.");return}\n    setDemoBusy(true);setDemoMessage("");\n    try{\n      const {data,error}=await supabase.functions.invoke("mt5-command",{method:"POST",body:{connection_id:demoConnection.id,symbol:terminalSymbol,side:nextSide,volume,client_order_id:crypto.randomUUID()}});\n      if(error)throw error;\n      setDemoMessage(data?.ok?"Demo order queued for MT5 execution.":"Demo order was not accepted.");\n      await refresh();\n    }catch(e){setDemoMessage(e?.message||"MT5 demo command failed.");}\n    finally{setDemoBusy(false)}\n  };\n\n

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
          <div className="vt-section-title"><div><h2>Mobile Trading Test</h2><p>Tecno Pop 10 trades; Samsung tablet monitors VELTRION</p></div><span className="vt-ai-tag">MOBILE + MONITOR</span></div>
          <div className="market-detail-note">
            <strong>Trading device:</strong> Log the same Deriv MT5 account into the official MT5 Android app on your Tecno Pop 10. MetaTrader 5 Android supports real and demo accounts and can place trades from the mobile app. VELTRION does not receive the MT5 password.
          </div>
          <div className="metric-grid">
            <div className="metric-card"><span>TECNO POP 10</span><strong>TRADING DEVICE</strong><small>Use the official Deriv MT5 mobile terminal for the test trade.</small></div>
            <div className="metric-card"><span>SAMSUNG TABLET</span><strong>MONITOR DEVICE</strong><small>Open this VELTRION page to watch heartbeat, balance, positions and history.</small></div>
            <div className="metric-card"><span>ACCOUNT SOURCE</span><strong>{connected?"BRIDGE LIVE":"WAITING"}</strong><small>{connected?"The private MT5 bridge is supplying account telemetry.":"Mobile MT5 alone cannot supply VELTRION telemetry; an authorized MT5 bridge heartbeat is required."}</small></div>
            <div className="metric-card"><span>EXECUTION</span><strong>OFFICIAL MT5</strong><small>VELTRION remains read-only and does not fabricate or place MT5 orders.</small></div>
          </div>
          <div className="vt-header-actions">
            <button className="market-open-terminal" onClick={openOfficialMt5}>Open Deriv MT5 Web <span>→</span></button>
          </div>
          <div className="market-detail-note">
            <strong>Verification sequence:</strong> 1) login on Tecno, 2) confirm the same account/server, 3) keep the VELTRION bridge connected, 4) open one small demo trade, 5) watch the Samsung tablet for the position, 6) close it, 7) confirm the closed deal appears in history. No real-money trade should be used for this heartbeat test.
          </div>
        </section>

        <section className="vt-panel">
          <div className="vt-section-title"><div><h2>Verified Deriv Account Registry</h2><p>Canonical Deriv IDs currently stored by VELTRION</p></div><span className="vt-ai-tag">BACKEND SOURCE</span></div>
          <div className="metric-grid">
            <div className="metric-card"><span>DERIV DEMO</span><strong>{derivAccounts.find(x=>x.account_type==="demo")?.deriv_account_id||"NOT REGISTERED"}</strong><small>{derivAccounts.find(x=>x.account_type==="demo")?.status||"No backend demo account record"}</small></div>
            <div className="metric-card"><span>DERIV REAL</span><strong>{derivAccounts.find(x=>x.account_type==="real")?.deriv_account_id||"NOT REGISTERED"}</strong><small>{derivAccounts.find(x=>x.account_type==="real")?.status||"No backend real account record"}</small></div>
            <div className="metric-card"><span>MT5 DEMO</span><strong>{demoConnection?.login||"NOT CONNECTED"}</strong><small>{demoConnected?"Live bridge · "+(demoConnection.server||"server unavailable"):"No MT5 heartbeat exists yet"}</small></div>
            <div className="metric-card"><span>MT5 REAL</span><strong>{realConnection?.login||"NOT CONNECTED"}</strong><small>{connected?"Live bridge · "+(realConnection.server||"server unavailable"):"No MT5 heartbeat exists yet"}</small></div>
          </div>
          <div className="market-detail-note"><strong>Important:</strong> The Deriv IDs shown above are read directly from the VELTRION backend account registry. An MT5 login is a separate credential and is only considered verified by VELTRION after an MT5 bridge heartbeat supplies the login and server. VELTRION will not substitute an old or guessed MT5 ID.</div>
        </section>

        <section className="vt-panel">
          <div className="vt-section-title">
            <div><h2>MT5 Connection</h2><p>Server/account telemetry supplied by the VELTRION MT5 bridge</p></div>
            <span className="vt-ai-tag">{connected?"CONNECTED":"WAITING FOR MT5 BRIDGE"}</span>
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
            <div className="vt-section-title"><div><h2>Orders & Trade History</h2><p>Active orders plus recent synchronized MT5 history</p></div><span className="vt-ai-tag">{orders.length+deals.length+historyOrders.length+historyDeals.length}</span></div>
            {orders.length||deals.length||historyOrders.length||historyDeals.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Type</th><th>Ticket</th><th>Symbol</th><th>Volume</th><th>Price</th></tr></thead><tbody>{[...orders.map(x=>({...x,__kind:"ORDER"})),...deals.map(x=>({...x,__kind:"DEAL"})),...historyOrders.map(x=>({...x,__kind:"HISTORY ORDER"})),...historyDeals.map(x=>({...x,__kind:"HISTORY DEAL"}))].slice(0,50).map((x,i)=><tr key={String(x.ticket??x.order??x.deal??i)+x.__kind}><td>{x.__kind}</td><td>{x.ticket??x.order??x.deal??"—"}</td><td>{x.symbol??"—"}</td><td>{x.volume??"—"}</td><td>{x.price??"—"}</td></tr>)}</tbody></table></div>:<div className="vt-empty">{connected?"No orders/deals in the latest snapshot.":"Connect the VELTRION MT5 bridge to display orders and deals."}</div>}
          </section>
        </div>

        <section className="vt-panel">\n          <div className="vt-section-title"><div><h2>MT5 Account Channels</h2><p>Separate telemetry for the Deriv demo and real MT5 accounts</p></div><span className="vt-ai-tag">READ ONLY</span></div>\n          <div className="metric-grid">\n            {["sandbox","real"].map(env=>{const c=channels[env];const m=c?.metadata||{};const fresh=c?.last_heartbeat_at&&Date.parse(c.last_heartbeat_at)>Date.now()-45000;return <div className="metric-card" key={env}><span>{env==="sandbox"?"DEMO":"REAL"} MT5</span><strong>{c?(fresh?"CONNECTED":"STALE"):"NOT CONNECTED"}</strong><small>{c?((c.broker||"MT5")+" · "+(c.server||"—")+" · login "+(c.login||"—")+" · balance "+fmt(m.balance,2)+" "+(c.account_currency||"USD")):"Waiting for an authenticated MT5 bridge heartbeat"}</small></div>})}\n          </div>\n          <div className="market-detail-note"><strong>Recording:</strong> each authenticated MT5 heartbeat is stored as a connection snapshot, heartbeat record, account snapshot, sync event, and integration event. No synthetic trade records are created.</div>\n        </section>\n        <section className="vt-panel">
          <div className="vt-section-title"><div><h2>Real Trading Gate</h2><p>Production execution remains deliberately locked</p></div><span className="vt-ai-tag">LOCKED</span></div>
          <div className="market-detail-note">
            VELTRION will not place a real MT5 order from this page. Your real MT5 account can be traded through the official Deriv MT5 terminal, while VELTRION can retain the private monitoring/reconciliation layer. This prevents the previous mismatch where the page called Deriv's Options trading API while presenting itself as an MT5 terminal.
          </div>
        </section>

        <section className="vt-panel">\n          <div className="vt-section-title"><div><h2>VELTRION Demo Execution</h2><p>Command bridge test — demo MT5 only</p></div><span className="vt-ai-tag">SANDBOX</span></div>\n          <div className="market-detail-note"><strong>Safety gate:</strong> this panel can only queue commands for a connected sandbox/demo MT5 bridge. Real-account execution is rejected by both the Edge Function and the EA. Never enter your MT5 password here.</div>\n          <div className="metric-grid">\n            <div className="metric-card"><span>SYMBOL</span><strong>{terminalSymbol}</strong><small>Current terminal symbol</small></div>\n            <div className="metric-card"><span>VOLUME</span><input value={demoVolume} onChange={e=>setDemoVolume(e.target.value)} inputMode="decimal" className="terminal-input" aria-label="Demo volume"/></div>\n            <div className="metric-card"><span>DEMO BRIDGE</span><strong>{demoConnected?"CONNECTED":"NOT CONNECTED"}</strong><small>{demoConnection?.login||"Waiting for demo heartbeat"}</small></div>\n            <div className="metric-card"><span>REAL EXECUTION</span><strong>LOCKED</strong><small>Production gate remains closed</small></div>\n          </div>\n          <div className="vt-header-actions">\n            <button className="market-open-terminal" disabled={demoBusy||!demoConnected} onClick={()=>submitDemoOrder("SELL")}>SELL / DEMO</button>\n            <button className="market-open-terminal" disabled={demoBusy||!demoConnected} onClick={()=>submitDemoOrder("BUY")}>BUY / DEMO</button>\n          </div>\n          {demoMessage&&<div className="market-detail-note">{demoMessage}</div>}\n        </section>\n        <footer className="vt-footer">REAL MT5 ACCOUNT — READ ONLY · No MT5 password is stored in the browser · Account data comes from the private bridge · Real execution remains in the official Deriv MT5 terminal.</footer>
      </main>
    </div>
  </div>;
}
