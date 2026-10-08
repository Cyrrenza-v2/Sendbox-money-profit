import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { sandboxEngine } from "../services/sandboxEngine";

const fmt=(n,d=5)=>Number.isFinite(Number(n))?Number(n).toLocaleString("en-US",{minimumFractionDigits:Math.min(2,d),maximumFractionDigits:d}):"—";
const TIMEFRAMES=[{label:"M1",seconds:60},{label:"M5",seconds:300},{label:"M15",seconds:900},{label:"M30",seconds:1800},{label:"H1",seconds:3600},{label:"H4",seconds:14400},{label:"D1",seconds:86400}];

function IndicatorPane({title,values,min,max,color="currentColor"}) {
  const w=900,h=100,p=8,range=(max-min)||1;
  const points=values.map((v,i)=>`${p+(i/Math.max(1,values.length-1))*(w-p*2)},${p+((max-v)/range)*(h-p*2)}`).join(" ");
  return <div className="mmt5-indicator"><div className="mmt5-indicator-title">{title}</div><svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><line x1="0" y1="50" x2={w} y2="50"/>{values.length>1&&<polyline points={points} fill="none" stroke={color} strokeWidth="2"/>}</svg></div>;
}

function MobileCandles({candles,price}) {
  const data=candles.slice(-70),w=900,h=360,left=8,right=66,top=8,bottom=20;
  if(!data.length)return <div className="mmt5-empty">Waiting for live Deriv candles…</div>;
  const hi=Math.max(...data.map(c=>c.high),Number(price)||-Infinity),lo=Math.min(...data.map(c=>c.low),Number(price)||Infinity),range=hi-lo||1;
  const x=i=>left+(i/Math.max(1,data.length-1))*(w-left-right),y=v=>top+((hi-v)/range)*(h-top-bottom);
  return <svg className="mmt5-candles" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
    {[0,1,2,3,4].map(i=>{const v=hi-range*i/4;return <g key={i}><line x1={left} x2={w-right} y1={y(v)} y2={y(v)}/><text x={w-right+5} y={y(v)+4}>{fmt(v,Math.abs(v)<10?5:2)}</text></g>})}
    {data.map((c,i)=>{const up=c.close>=c.open,cx=x(i),bw=Math.max(2,Math.min(10,(w-left-right)/data.length*.62));return <g key={c.time}><line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} className={up?"up":"down"}/><rect x={cx-bw/2} y={Math.min(y(c.open),y(c.close))} width={bw} height={Math.max(1,Math.abs(y(c.close)-y(c.open)))} className={up?"up-fill":"down-fill"}/></g>})}
    {Number.isFinite(Number(price))&&<line x1={left} x2={w-right} y1={y(Number(price))} y2={y(Number(price))} className="mmt5-price"/>}
  </svg>;
}

export default function MobileTradingChart(){
  const [params]=useSearchParams(),navigate=useNavigate();
  const [symbol,setSymbol]=useState(params.get("symbol")||"frxAUDUSD"),[mode,setMode]=useState(params.get("mode")==="real"?"real":"demo");
  const [timeframe,setTimeframe]=useState("M1"),[candles,setCandles]=useState([]),[price,setPrice]=useState(null),[feed,setFeed]=useState("CONNECTING");
  const [account,setAccount]=useState(null),[positions,setPositions]=useState([]),[active,setActive]=useState("Charts"),[error,setError]=useState("");
  const socketRef=useRef(null),retryRef=useRef(null);

  const invoke=async body=>{const {data,error}=await supabase.functions.invoke("trading-service",{body});if(error)throw error;if(data?.ok===false)throw new Error(data.error||"TRADING_SERVICE_FAILED");return data?.data??data;};
  const refresh=async()=>{if(mode==="demo"){const r=await sandboxEngine.snapshot();const d=r.data||{};setAccount(d.accounts?.[0]||d.account||null);setPositions(d.positions||[]);return;}const d=await invoke({operation:"real_snapshot"});const b=Number(d?.balance?.balance);setAccount({currency:d?.balance?.currency||"USD",available_capital:Number.isFinite(b)?b:0,balance:b});setPositions(Array.isArray(d?.portfolio?.contracts)?d.portfolio.contracts:[]);};

  useEffect(()=>{void refresh().catch(e=>setError(e.message||"Account unavailable"));const t=setInterval(()=>void refresh().catch(()=>{}),15000);return()=>clearInterval(t)},[mode]);
  useEffect(()=>{
    let dead=false;
    const connect=()=>{if(dead)return;try{const ws=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");socketRef.current=ws;
      ws.onopen=()=>{setFeed("LIVE");ws.send(JSON.stringify({ticks_history:symbol,adjust_start_time:1,count:120,end:"latest",style:"candles",granularity:(TIMEFRAMES.find(x=>x.label===timeframe)||TIMEFRAMES[0]).seconds,req_id:1}));ws.send(JSON.stringify({ticks:symbol,subscribe:1,req_id:2}))};
      ws.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.req_id===1&&m.candles){setCandles(m.candles.map(c=>({time:Number(c.epoch),open:Number(c.open),high:Number(c.high),low:Number(c.low),close:Number(c.close)})));}if(m.req_id===2&&m.tick){const p=Number(m.tick.quote);if(!Number.isFinite(p))return;setPrice(p);const sec=(TIMEFRAMES.find(x=>x.label===timeframe)||TIMEFRAMES[0]).seconds,b=Math.floor(Number(m.tick.epoch)/sec)*sec;setCandles(cs=>{const last=cs[cs.length-1];if(!last||last.time!==b)return [...cs,{time:b,open:p,high:p,low:p,close:p}].slice(-160);return [...cs.slice(0,-1),{...last,high:Math.max(last.high,p),low:Math.min(last.low,p),close:p}]})}}catch{}}; 
      ws.onerror=()=>setFeed("RECONNECTING");ws.onclose=()=>{if(!dead){setFeed("RECONNECTING");retryRef.current=setTimeout(connect,1200)}};
    }catch{setFeed("RECONNECTING");retryRef.current=setTimeout(connect,1200)}};
    connect();return()=>{dead=true;if(retryRef.current)clearTimeout(retryRef.current);try{socketRef.current?.close()}catch{}};
  },[symbol,timeframe]);

  const rsi=useMemo(()=>{const c=candles.slice(-40).map(x=>x.close);if(c.length<15)return [];let gains=0,losses=0;for(let i=1;i<=14;i++){const d=c[i]-c[i-1];if(d>=0)gains+=d;else losses-=d}let avgG=gains/14,avgL=losses/14,out=[];for(let i=15;i<c.length;i++){const d=c[i]-c[i-1];avgG=(avgG*13+Math.max(0,d))/14;avgL=(avgL*13+Math.max(0,-d))/14;out.push(avgL===0?100:100-(100/(1+avgG/avgL)))}return out},[candles]);
  const macd=useMemo(()=>{const c=candles.map(x=>x.close),ema=(arr,n)=>{if(arr.length<n)return null;let e=arr.slice(0,n).reduce((a,b)=>a+b,0)/n,k=2/(n+1);for(let i=n;i<arr.length;i++)e=arr[i]*k+e*(1-k);return e};if(c.length<26)return [];const out=[];for(let i=26;i<=c.length;i++){const a=ema(c.slice(0,i),12),b=ema(c.slice(0,i),26);if(Number.isFinite(a)&&Number.isFinite(b))out.push(a-b)}return out},[candles]);
  const side=active==="Trade"?"Trade":"Charts";
  const submit=async s=>{if(!price||!account)return;setError("");try{if(mode==="demo")await sandboxEngine.executeOrder({account_id:account.id,symbol,side:s,quantity:.01,price,idempotency_key:crypto.randomUUID()});else{const p=await invoke({operation:"proposal",symbol,side:s,stake:.01,duration:5,duration_unit:"m"});const id=p?.proposal?.id??p?.id;if(!id)throw new Error("REAL_PROPOSAL_UNAVAILABLE");await invoke({operation:"buy",proposal_id:id,price:Number(p?.proposal?.ask_price??price),stake:.01,symbol,client_order_id:crypto.randomUUID()})}await refresh()}catch(e){setError(e.message||"Order failed")}};
  return <main className="mmt5-shell">
    <header className="mmt5-top"><button onClick={()=>navigate(-1)} aria-label="Back">‹</button><div><strong>{symbol.replace(/^frx/,"")} · {timeframe}</strong><small>{mode==="real"?"REAL LIVE":"DEMO SANDBOX"} · {feed}</small></div><button onClick={()=>{const n=mode==="real"?"demo":"real";setMode(n);navigate(`/app/trading/mobile-chart?mode=${n}&symbol=${encodeURIComponent(symbol)}`)}}>⇄</button></header>
    <div className="mmt5-tools"><button>＋</button>{TIMEFRAMES.map(t=><button className={timeframe===t.label?"active":""} key={t.label} onClick={()=>setTimeframe(t.label)}>{t.label}</button>)}<button>⌖</button></div>
    <section className="mmt5-chart-card"><div className="mmt5-chart-head"><span>AUDUSD / {symbol}</span><b>{price?fmt(price,5):"—"}</b></div><MobileCandles candles={candles} price={price}/></section>
    <IndicatorPane title={`MACD(12,26,9) ${macd.length?fmt(macd.at(-1),6):"—"}`} values={macd.slice(-50)} min={Math.min(...macd,-1)} max={Math.max(...macd,1)} color="#60a5fa"/>
    <IndicatorPane title={`RSI(14) ${rsi.length?fmt(rsi.at(-1),2):"—"}`} values={rsi.slice(-50)} min={0} max={100} color="#d9a441"/>
    {error&&<div className="mmt5-error">{error}</div>}
    <section className="mmt5-ticket"><div><small>{mode==="real"?"REAL BROKER BALANCE":"SANDBOX BALANCE"}</small><strong>{account?.currency||"USD"} {fmt(account?.available_capital,2)}</strong></div><div className="mmt5-order-buttons"><button className="sell" onClick={()=>submit("SELL")}>SELL<br/><small>{price?fmt(price,5):"—"}</small></button><button className="buy" onClick={()=>submit("BUY")}>BUY<br/><small>{price?fmt(price,5):"—"}</small></button></div></section>
    <nav className="mmt5-nav">{["Quotes","Charts","Trade","History","News","Mailbox","Messages","Accounts","Settings"].map(x=><button className={active===x?"active":""} key={x} onClick={()=>setActive(x)}><span>{x==="Quotes"?"⇅":x==="Charts"?"▥":x==="Trade"?"◉":x==="History"?"◷":x==="News"?"▤":x==="Mailbox"?"✉":x==="Messages"?"◌":x==="Accounts"?"♙":"⚙"}</span><small>{x}</small></button>)}</nav>
  </main>;
}
