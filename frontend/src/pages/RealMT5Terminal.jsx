import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { supabase } from "../supabaseClient";

const fn = "trading-service";
const walletFn = "wallet-service";
const TIMEFRAMES = [
  {label:"1m",seconds:60},{label:"5m",seconds:300},{label:"15m",seconds:900},
  {label:"1h",seconds:3600},{label:"4h",seconds:14400},{label:"1d",seconds:86400}
];
const fmt=(n,d=5)=>Number.isFinite(Number(n))?Number(n).toLocaleString("en-US",{maximumFractionDigits:d}):"—";
async function invoke(name, body){
  const {data,error}=await supabase.functions.invoke(name,{body});
  if(error) throw new Error(data?.error||error.message||"REQUEST_FAILED");
  if(!data?.ok) throw new Error(data?.error||"REQUEST_FAILED");
  return data.data;
}
function Chart({candles,price,symbol}){
  const data=candles.slice(-100),w=1100,h=360,p=18;
  if(!data.length)return <div className="vt-chart-empty"><span className="vt-live-dot"/> Loading {symbol} candles…</div>;
  const lo=Math.min(...data.map(x=>x.low),Number(price)||Infinity),hi=Math.max(...data.map(x=>x.high),Number(price)||-Infinity),range=hi-lo||1,step=(w-90)/data.length,y=v=>p+(hi-v)/range*(h-45);
  return <svg className="vt-chart-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Live chart for ${symbol}`}>
    {[0,1,2,3,4].map(i=><line key={i} x1={p} x2={w-72} y1={p+(h-45)*i/4} y2={p+(h-45)*i/4} stroke="currentColor" opacity=".12" strokeDasharray="3 5"/>)}
    {data.map((c,i)=>{const x=p+i*step+step/2,up=c.close>=c.open,col=up?"#34d399":"#f87171",bw=Math.max(2,Math.min(10,step*.62));return <g key={c.time}><line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={col}/><rect x={x-bw/2} y={y(Math.max(c.open,c.close))} width={bw} height={Math.max(1,Math.abs(y(c.open)-y(c.close)))} fill={col}/></g>})}
    {Number.isFinite(Number(price))&&<><line x1={p} x2={w-72} y1={y(Number(price))} y2={y(Number(price))} stroke="#60a5fa" strokeDasharray="5 4"/><text x={w-65} y={y(Number(price))+4} fill="#93c5fd" fontSize="11">{fmt(price,8)}</text></>}
  </svg>;
}
export default function RealMT5Terminal(){
 const [params]=useSearchParams();
 const initialSymbol=params.get("symbol")||"1HZ100V";
 const [side,setSide]=useState(false),[symbol,setSymbol]=useState(initialSymbol),[price,setPrice]=useState(null),[feed,setFeed]=useState("CONNECTING");
 const [candles,setCandles]=useState([]),[ticks,setTicks]=useState([]),[tf,setTf]=useState(300),[account,setAccount]=useState(null),[portfolio,setPortfolio]=useState([]),[history,setHistory]=useState([]),[statements,setStatements]=useState([]);
 const historySocketRef=useRef(null),refreshBusy=useRef(false),retryRef=useRef(null),realRetryRef=useRef(null),realRetryAttemptRef=useRef(0),lastTickRef=useRef(0),tickWatchdogRef=useRef(null),tfRef=useRef(300);
 const lastGoodSnapshotRef=useRef(null),refreshDelayRef=useRef(15000);
 useEffect(()=>{tfRef.current=tf},[tf]);
 const [error,setError]=useState(""),[lastSync,setLastSync]=useState(null),[syncStatus,setSyncStatus]=useState("PENDING"),[syncOpen,setSyncOpen]=useState(0),[syncClosed,setSyncClosed]=useState(0);

 const refresh=async()=>{
   if(refreshBusy.current)return;
   refreshBusy.current=true;
   try{
     const s=await invoke(fn,{operation:"real_snapshot"});
     if(s){
       setAccount(s);
       const { data: syncedPositions, error: positionsError } = await supabase
         .from("positions")
         .select("external_position_id,symbol,side,quantity,entry_price,current_price,unrealized_pnl,status,observed_at")
         .eq("source","deriv")
         .eq("environment","real")
         .order("observed_at",{ascending:false});
       if (positionsError) throw positionsError;
       setPortfolio(Array.isArray(syncedPositions) ? syncedPositions : []);
       setHistory(Array.isArray(s?.profit_table?.transactions)?s.profit_table.transactions:[]);
       setStatements(Array.isArray(s?.statement?.transactions)?s.statement.transactions:[]);
       setSyncStatus(s?.supabase_sync?.status||"PENDING");
       setSyncOpen(Number(s?.supabase_sync?.open_positions||0));
       setSyncClosed(Number(s?.supabase_sync?.closed_orders||0));
       setLastSync(new Date());
       setError("");
     }
   }catch(e){
     setError(e.message||"REAL_ACCOUNT_SYNC_FAILED");
   }finally{refreshBusy.current=false}
 };

 useEffect(()=>{
   let dead=false;
   let scheduled=null;

   const schedule=(delay=refreshDelayRef.current)=>{
     if(dead)return;
     clearTimeout(scheduled);
     scheduled=setTimeout(async()=>{
       if(dead)return;
       await refresh();
       schedule();
     },delay);
   };

   const run=async()=>{
     await refresh();
     schedule();
   };

   const wake=async()=>{
     if(dead)return;
     await refresh();
     schedule();
   };

   run();
   const onVisibility=()=>{if(!document.hidden)wake()};
   const onFocus=()=>wake();
   document.addEventListener("visibilitychange",onVisibility);
   window.addEventListener("focus",onFocus);

   return()=>{
     dead=true;
     clearTimeout(scheduled);
     clearTimeout(retryRef.current);
     document.removeEventListener("visibilitychange",onVisibility);
     window.removeEventListener("focus",onFocus);
   };
 },[]);

 useEffect(()=>{
   let dead=false,retryTimer=null,ws=null,endpointIndex=0;
   const historyEndpoints=[
     "wss://ws.derivws.com/websockets/v3?app_id=1089",
     "wss://ws.binaryws.com/websockets/v3"
   ];
   setCandles([]);setFeed("LOADING_HISTORY");
   const loadHistory=()=>{
     if(dead)return;
     try{ws=new WebSocket(historyEndpoints[endpointIndex]);historySocketRef.current=ws}
     catch{endpointIndex=(endpointIndex+1)%historyEndpoints.length;setFeed("HISTORY_RECONNECTING");retryTimer=setTimeout(loadHistory,2000);return}
     const timeout=setTimeout(()=>{try{ws.close()}catch{}},12000);
     ws.onopen=()=>{setFeed(current=>current==="LIVE"?"LIVE":"WAITING_FOR_TICK");ws.send(JSON.stringify({ticks_history:symbol,adjust_start_time:1,count:180,end:"latest",style:"candles",granularity:tf,req_id:7001}))};
     ws.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.error){setFeed("HISTORY_RECONNECTING");return}if(m.msg_type==="history"||m.msg_type==="candles"){const raw=m.candles||m.history?.candles||[];if(raw.length){setCandles(raw.map(c=>({time:Number(c.epoch),open:Number(c.open),high:Number(c.high),low:Number(c.low),close:Number(c.close)})).filter(c=>[c.time,c.open,c.high,c.low,c.close].every(Number.isFinite)).sort((a,b)=>a.time-b.time).slice(-180));setFeed(current=>current==="LOADING_HISTORY"||current==="HISTORY_RECONNECTING"?"WAITING_FOR_TICK":current)}}}catch{}};
     ws.onerror=()=>setFeed("HISTORY_RECONNECTING");
     ws.onclose=()=>{clearTimeout(timeout);if(!dead){endpointIndex=(endpointIndex+1)%historyEndpoints.length;setFeed("HISTORY_RECONNECTING");retryTimer=setTimeout(loadHistory,2000)}};
   };
   loadHistory();
   return()=>{dead=true;clearTimeout(retryTimer);try{ws?.close()}catch{}historySocketRef.current=null};
 },[symbol,tf]);


 useEffect(()=>{
   let dead=false,ws=null,retryTimer=null,serverTimer=null,connectTimeout=null;
   let serverFallbackActive=false;
   let endpointIndex=0;

   const pollServerMarket=()=>{
     if(dead||serverFallbackActive)return;
     serverFallbackActive=true;
     setFeed("CONNECTING_PUBLIC_MARKET");
     const poll=async()=>{
       if(dead||!serverFallbackActive)return;
       try{
         const {data,error:invokeError}=await supabase.functions.invoke("market-data",{body:{operation:"tick",symbol}});
         const t=data?.ok?data.data:null;
         const q=Number(t?.quote),epoch=Number(t?.epoch);
         if(!invokeError&&Number.isFinite(q)&&Number.isFinite(epoch)){
           setFeed("LIVE_PUBLIC_MARKET");
           setError("");
           onTick({quote:q,epoch,pip_size:t?.pipSize??null});
         }
       }catch{}
       if(!dead&&serverFallbackActive)serverTimer=setTimeout(poll,1000);
     };
     poll();
   };

   const stopServerFallback=()=>{
     serverFallbackActive=false;
     clearTimeout(serverTimer);
     serverTimer=null;
   };

   const connect=()=>{
     if(dead)return;
     clearTimeout(connectTimeout);
     try{
       setFeed("CONNECTING_PUBLIC_MARKET");
       ws=new WebSocket(historyEndpoints[endpointIndex]);
       historySocketRef.current=ws;
       connectTimeout=setTimeout(()=>{
         if(!dead&&Date.now()-lastTickRef.current>7000){
           try{ws?.close()}catch{}
           pollServerMarket();
         }
       },8000);
       ws.onopen=()=>{
         if(dead){try{ws.close()}catch{};return}
         setFeed("LIVE_PUBLIC_MARKET");
         lastTickRef.current=Date.now();
         ws.send(JSON.stringify({ticks_history:symbol,adjust_start_time:1,count:180,end:"latest",style:"candles",granularity:tf,req_id:7001}));
         ws.send(JSON.stringify({ticks:symbol,subscribe:1,req_id:91001}));
         clearTimeout(connectTimeout);
       };
       ws.onmessage=e=>{
         try{
           const msg=JSON.parse(e.data);
           if(msg.error){try{ws.close()}catch{};return}
           if(msg.msg_type==="history"||msg.msg_type==="candles"){
             const raw=msg.candles||msg.history?.candles||[];
             if(raw.length){
               setCandles(raw.map(c=>({time:Number(c.epoch),open:Number(c.open),high:Number(c.high),low:Number(c.low),close:Number(c.close)}))
                 .filter(c=>[c.time,c.open,c.high,c.low,c.close].every(Number.isFinite))
                 .sort((a,b)=>a.time-b.time).slice(-180));
             }
           }
           if(msg.msg_type==="tick"&&(msg.tick?.symbol===symbol||msg.tick?.underlying_symbol===symbol)){
             lastTickRef.current=Date.now();
             clearTimeout(connectTimeout);
             stopServerFallback();
             setFeed("LIVE_PUBLIC_MARKET");
             setError("");
             onTick(msg.tick);
           }
         }catch{}
       };
       ws.onerror=()=>setFeed("PUBLIC_MARKET_RECONNECTING");
       ws.onclose=()=>{
         clearTimeout(connectTimeout);
         if(!dead){
           stopServerFallback();
           endpointIndex=(endpointIndex+1)%historyEndpoints.length;
           setFeed("PUBLIC_MARKET_RECONNECTING");
           retryTimer=setTimeout(connect,1000);
         }
       };
     }catch{
       endpointIndex=(endpointIndex+1)%historyEndpoints.length;
       setFeed("PUBLIC_MARKET_RECONNECTING");
       retryTimer=setTimeout(connect,1000);
     }
   };

   setCandles([]);
   setTicks([]);
   setPrice(null);
   setFeed("CONNECTING_PUBLIC_MARKET");
   connect();

   return()=>{
     dead=true;
     clearTimeout(retryTimer);
     clearTimeout(connectTimeout);
     stopServerFallback();
     try{ws?.close()}catch{}
     historySocketRef.current=null;
   };
 },[symbol,tf]);

 const onTick=t=>{
   const q=Number(t?.quote),epoch=Number(t?.epoch);
   if(!Number.isFinite(q)||!Number.isFinite(epoch))return;
   setPrice(q);setFeed("LIVE");setTicks(a=>[{quote:q,epoch},...a].slice(0,40));
   const activeTf=tfRef.current;
   const bucket=Math.floor(epoch/activeTf)*activeTf;
   setCandles(a=>{const last=a[a.length-1];if(!last||last.time!==bucket)return [...a,{time:bucket,open:q,high:q,low:q,close:q}].slice(-180);return [...a.slice(0,-1),{...last,high:Math.max(last.high,q),low:Math.min(last.low,q),close:q}]});
 };

 const balance=Number(account?.balance?.balance ?? account?.balance ?? 0);
 const eq=Number(account?.balance?.equity ?? account?.equity ?? balance);
 const safeTime=lastSync?lastSync.toLocaleTimeString():"Not synchronized";

 return <div className="app-layout">
  <Sidebar isOpen={side} onClose={()=>setSide(false)}/>
  <div className="app-main"><header className="topbar"><button className="menu-button" onClick={()=>setSide(true)}>☰</button><span className="topbar-brand">VELTRION REAL ACCOUNT</span><span className="admin-badge real-badge">● READ ONLY</span></header>
  <main className="content vt-page">
   <header className="vt-heading"><div><span className="eyebrow real-eyebrow">PHASE 2 / DERIV REAL</span><h1>Real Account — Read Only</h1><p>Authenticated Deriv account, live market data, positions, orders/history and reconciliation. Temporary connection loss never clears the last valid account state.</p></div><div className="vt-header-actions"><span className={feed==="LIVE"?"vt-feed live":"vt-feed"}><i/> {feed==="LIVE_REAL_MARKET"||feed==="LIVE"?"LIVE REAL MARKET DATA":feed}</span>{account?.stale&&<span className="vt-feed">LAST VERIFIED SNAPSHOT</span>}</div></header>
   {error&&<div className="market-detail-note">Connection warning: {error} · Retaining last valid data and retrying automatically.</div>}
   <div className="market-account-strip"><div className="market-account-card"><span>REAL BALANCE</span><strong>{account?.currency||"USD"} {fmt(balance,2)}</strong><small>{account?.loginid||account?.login||"Real account"} · synced {safeTime}</small></div><div className="market-account-card"><span>EQUITY</span><strong>{account?.currency||"USD"} {fmt(eq,2)}</strong><small>Server-reconciled</small></div><div className="market-account-card market-account-state"><span>PORTFOLIO SYNC</span><strong>{syncStatus}</strong><small>{syncOpen} open positions · {syncClosed} closed records synced</small></div></div>
   <LiveMarketPanel selectedSymbol={symbol} onSymbolChange={setSymbol} onPriceChange={()=>{}}/>
   <section className="vt-panel vt-chart-panel"><div className="vt-panel-head"><div><h2>{symbol} Live Chart</h2><p>Deriv OHLC history + current tick stream</p></div><div className="vt-timeframes">{TIMEFRAMES.map(x=><button key={x.seconds} className={tf===x.seconds?"active":""} onClick={()=>setTf(x.seconds)}>{x.label}</button>)}</div></div><Chart candles={candles} price={price} symbol={symbol}/></section>
   <section className="vt-panel vt-tick-tape"><div className="vt-section-title"><div><h2>Live Tick Tape</h2><p>Real-time quotes for the selected market</p></div><span className="vt-ai-tag">{ticks.length} TICKS</span></div><div className="vt-tick-grid">{ticks.slice(0,20).map((t,i)=><div className="vt-tick-row" key={t.epoch+"-"+i}><span>{new Date(t.epoch*1000).toLocaleTimeString()}</span><strong>{fmt(t.quote,8)}</strong><small>{i===0?"LATEST":"TICK"}</small></div>)}</div>{!ticks.length&&<div className="vt-empty">Waiting for live ticks…</div>}</section>
   <section className="vt-panel"><div className="vt-section-title"><div><h2>Open Real Positions</h2><p>Authenticated Deriv portfolio</p></div><span className="vt-ai-tag">READ ONLY</span></div>{portfolio.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Contract</th><th>Market</th><th>Buy</th><th>Current</th><th>P/L</th></tr></thead><tbody>{portfolio.map(p=><tr key={p.contract_id||p.id}><td>{p.external_position_id||"—"}</td><td>{p.symbol||"—"}</td><td>{p.entry_price??"—"}</td><td>{p.current_price??"—"}</td><td className={Number(p.unrealized_pnl)>=0?"vt-positive":"vt-negative"}>{p.unrealized_pnl??"—"}</td></tr>)}</tbody></table></div>:<div className="vt-empty">No open real positions returned by Deriv.</div>}</section>
   <div className="vt-lower-grid">
    <section className="vt-panel"><div className="vt-section-title"><div><h2>Closed Orders / Profit History</h2><p>Server-reconciled Deriv profit table</p></div></div>{history.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Contract</th><th>Market</th><th>Buy</th><th>Sell</th><th>P/L</th></tr></thead><tbody>{history.slice(0,50).map((p,i)=><tr key={(p.contract_id||p.id||"h")+"-"+i}><td>{p.contract_id||p.id||"—"}</td><td>{p.underlying_symbol||p.symbol||"—"}</td><td>{p.buy_price??"—"}</td><td>{p.sell_price??"—"}</td><td className={Number(p.profit)>=0?"vt-positive":"vt-negative"}>{p.profit??"—"}</td></tr>)}</tbody></table></div>:<div className="vt-empty">No closed real trades returned by Deriv.</div>}</section>
    <section className="vt-panel"><div className="vt-section-title"><div><h2>Account Statements</h2><p>Read-only reconciliation trail</p></div></div>{statements.length?<div className="vt-data-list">{statements.slice(0,30).map((s,i)=><div className="audit-row" key={(s.transaction_id||s.id||"s")+"-"+i}><span>{s.action||s.description||s.type||"Transaction"}</span><b>{s.amount??s.balance??"—"}</b></div>)}</div>:<div className="vt-empty">No statement transactions returned.</div>}</section>
   </div>
   <div className="market-detail-note">REAL ACCOUNT — READ ONLY · OAuth/server verification stays active · browser has no Deriv private credentials · real execution, transfers and withdrawals remain locked.</div>
  </main></div></div>;
}
