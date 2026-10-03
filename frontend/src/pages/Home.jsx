import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../supabaseClient";

const money=(value,currency="USD")=>value==null||!Number.isFinite(Number(value))?"Unavailable":Number(value).toLocaleString("en-US",{style:"currency",currency,minimumFractionDigits:2});
const display=value=>value==null||value===""?"Unavailable":String(value);

async function fetchHomeSummary(){
 const { data:{session} }=await supabase.auth.getSession();
 if(!session?.access_token) throw new Error("Your admin session is not available. Please sign in again.");
 const response=await fetch(`${SUPABASE_URL}/functions/v1/home-summary`,{
  method:"POST",
  headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json",Accept:"application/json"},
  body:"{}",cache:"no-store"
 });
 const text=await response.text(); let data={};
 try{data=text?JSON.parse(text):{}}catch{throw new Error("Invalid Home Summary response");}
 if(!response.ok) throw new Error(data?.error||`Home Summary HTTP ${response.status}`);
 return data;
}

export default function Home(){
 const navigate=useNavigate();
 const [state,setState]=useState({loading:true,error:"",data:null});
 const load=useCallback(async()=>{setState({loading:true,error:"",data:null});try{const data=await fetchHomeSummary();setState({loading:false,error:"",data});}catch(e){setState({loading:false,error:e?.message||"Unable to retrieve Home Summary.",data:null});}},[]);
 useEffect(()=>{load();},[load]);
 const data=state.data,sandbox=data?.sandbox||{},currency=sandbox.currency||"USD";
 return <div className="vel-page vel-home-page">
  <div className="vel-page-heading">
   <div><div className="vel-eyebrow">VELTRION / HOME</div><h1>Welcome back</h1><p>A simple overview of your account, markets and trading access.</p></div>
   <span className="vel-data-source">LIVE DATA · SUPABASE</span>
  </div>
  {state.loading?<div className="vel-panel vel-state">Loading authenticated Home Summary…</div>:state.error?<div className="vel-panel vel-error"><b>Home summary unavailable</b><p>{state.error}</p><button className="vel-button" onClick={load}>Retry connection</button></div>:<>
   <div className="vel-metric-grid">
    <Metric label="SANDBOX BALANCE" value={money(sandbox.availableCapital,currency)} detail="Virtual account only"/>
    <Metric label="PORTFOLIO VALUE" value={money(sandbox.equity,currency)} detail="Current sandbox equity"/>
    <Metric label="FLOATING P/L" value={money(sandbox.floatingPnl,currency)} detail="Open sandbox positions"/>
    <Metric label="OPEN POSITIONS" value={sandbox.openPositionsCount==null?"Unavailable":String(sandbox.openPositionsCount)} detail="Authenticated account"/>
   </div>
   <section className="vel-home-primary">
    <button className="vel-home-primary-card" onClick={()=>navigate("/app/trading/markets")}><span className="home-card-kicker">TRADE</span><strong>Markets</strong><small>Select a market first, then choose your terminal.</small><b>Open Markets →</b></button>
    <button className="vel-home-primary-card" onClick={()=>navigate("/app/wallet/overview")}><span className="home-card-kicker">MONEY</span><strong>Wallet</strong><small>Balances and transaction activity, separate from positions.</small><b>Open Wallet →</b></button>
    <button className="vel-home-primary-card" onClick={()=>navigate("/app/trading/positions")}><span className="home-card-kicker">ACCOUNT</span><strong>Portfolio</strong><small>Accounts, balances, positions, orders and P/L.</small><b>Open Portfolio →</b></button>
   </section>
   <section className="vel-panel home-terminal-panel">
    <div className="vel-panel-title">TERMINALS <span>SECONDARY TRADING EXPERIENCE</span></div>
    <div className="home-terminal-grid">
     <button onClick={()=>navigate("/app/trading/markets")}><div><strong>Web Terminal</strong><small>Opened after selecting a market.</small></div><span>→</span></button>
     <button disabled><div><strong>MT5 Terminal</strong><small>Coming later · licensing and integration required.</small></div><span>—</span></button>
    </div>
   </section>
   <div className="vel-home-columns">
    <section className="vel-panel"><div className="vel-panel-title">ACCOUNT & CONNECTIONS <span>STATUS</span></div>
     <StatusRow label="Sandbox account" value={display(sandbox.accountStatus)}/>
     <StatusRow label="Deriv connection" value={display(data?.deriv?.status)}/>
     <StatusRow label="MT5 infrastructure" value={display(data?.mt5?.status)}/>
     <StatusRow label="Environment" value={display(data?.system?.environment)}/>
    </section>
    <section className="vel-panel"><div className="vel-panel-title">MARKET SNAPSHOT <span>{display(data?.market?.status)}</span></div>
     {data?.market?.symbols?.length?data.market.symbols.slice(0,5).map((item,index)=><div className="vel-market-row" key={item.symbol||index}><div><b>{display(item.symbol)}</b><small>Supabase market data</small></div><strong>{item.bid==null?"Unavailable":String(item.bid)}</strong><span>ASK {item.ask==null?"—":String(item.ask)}</span></div>):<div className="vel-empty-inline">No market symbols returned by the backend.</div>}
    </section>
   </div>
   <div className="vel-footnote">Updated {data?.timestamp?new Date(data.timestamp).toLocaleString():"time unavailable"} · Home remains an overview; AI assistance belongs inside the market/trading flow.</div>
  </>}
 </div>;
}
function Metric({label,value,detail}){return <div className="vel-metric-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;}
function StatusRow({label,value}){const okay=/connected|active|enabled|ready|live|healthy/i.test(value)&&!/not connected|disabled/i.test(value);return <div className="vel-status-row"><span>{label}</span><b className={okay?"is-good":"is-neutral"}><i/>{value}</b></div>;}