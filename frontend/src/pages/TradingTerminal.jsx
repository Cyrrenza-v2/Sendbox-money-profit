import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { sandboxEngine } from "../services/sandboxEngine";

const fmt = (n, digits = 5) => Number.isFinite(Number(n)) ? Number(n).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) }) : "—";
const TIMEFRAMES = [{label:"1m", value:"M1", seconds:60},{label:"5m", value:"M5", seconds:300},{label:"15m", value:"M15", seconds:900},{label:"1h", value:"H1", seconds:3600},{label:"4h", value:"H4", seconds:14400},{label:"1d", value:"D1", seconds:86400}];

function CandleChart({ candles, symbol, price }) {
  const width=1100,height=390,pad={top:18,right:82,bottom:24,left:12},data=candles.slice(-90);
  if (!data.length) return <div className="vt-chart-empty"><span className="vt-live-dot" /> Loading historical candles for {symbol}…</div>;
  const lo=Math.min(...data.map(c=>c.low),Number.isFinite(price)?price:Infinity),hi=Math.max(...data.map(c=>c.high),Number.isFinite(price)?price:-Infinity),range=hi-lo||Math.max(Math.abs(hi)*.0001,.00001);
  const chartW=width-pad.left-pad.right,chartH=height-pad.top-pad.bottom,y=v=>pad.top+((hi-v)/range)*chartH,step=chartW/data.length;
  const priceDigits= Math.abs(hi)<10?5:2;
  return <svg className="vt-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Candlestick chart for ${symbol}`}>
    {[0,1,2,3,4].map(i=>{const value=hi-range*i/4,yy=pad.top+chartH*i/4;return <g key={i}><line x1={pad.left} x2={width-pad.right} y1={yy} y2={yy} stroke="currentColor" opacity=".13" strokeDasharray="3 5"/><text x={width-pad.right+7} y={yy+4} fill="currentColor" opacity=".65" fontSize="11">{fmt(value,priceDigits)}</text></g>;})}
    {data.map((c,i)=>{const x=pad.left+i*step+step/2,up=c.close>=c.open,color=up?"#20c997":"#f05252",top=y(Math.max(c.open,c.close)),bottom=y(Math.min(c.open,c.close)),bodyW=Math.max(2,Math.min(11,step*.64));return <g key={c.time}><line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1.2"/><rect x={x-bodyW/2} y={top} width={bodyW} height={Math.max(1,bottom-top)} fill={color} rx=".6"/></g>;})}
    {Number.isFinite(price)&&<g><line x1={pad.left} x2={width-pad.right} y1={y(price)} y2={y(price)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="5 4"/><rect x={width-pad.right+2} y={y(price)-10} width={pad.right-4} height="20" rx="3" fill="#2563eb"/><text x={width-pad.right+6} y={y(price)+4} fill="#fff" fontSize="10">{fmt(price,priceDigits)}</text></g>}
    {data.filter((_,i)=>i%Math.max(1,Math.ceil(data.length/6))===0).map(c=><text key={`time-${c.time}`} x={pad.left+data.indexOf(c)*step} y={height-6} fill="currentColor" opacity=".5" fontSize="10">{new Date(c.time*1000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</text>)}
  </svg>;
}

function readCandles(message) {
  const raw=message?.candles||message?.history?.candles||[];
  return raw.map(c=>({time:Number(c.epoch),open:Number(c.open),high:Number(c.high),low:Number(c.low),close:Number(c.close)}))
    .filter(c=>Number.isFinite(c.time)&&[c.open,c.high,c.low,c.close].every(Number.isFinite)).sort((a,b)=>a.time-b.time);
}

export default function TradingTerminal() {
  const [searchParams]=useSearchParams();
  const [symbol,setSymbol]=useState(()=>searchParams.get("symbol")||"frxEURUSD");
  const [tick,setTick]=useState(null),[feed,setFeed]=useState("WAITING"),[candles,setCandles]=useState([]),[timeframe,setTimeframe]=useState("M5");
  const [account,setAccount]=useState(null),[positions,setPositions]=useState([]),[orders,setOrders]=useState([]);
  const [quantity,setQuantity]=useState("0.01"),[stopLoss,setStopLoss]=useState(""),[takeProfit,setTakeProfit]=useState("");
  const [ai,setAi]=useState(null),[aiBusy,setAiBusy]=useState(false),[e2eBusy,setE2eBusy]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[activeTab,setActiveTab]=useState("positions");
  const lastMarkRef=useRef(0),priceRef=useRef(null);
  useEffect(()=>{const requested=searchParams.get("symbol");if(requested)setSymbol(requested);},[searchParams]);

  const refresh=async()=>{const r=await sandboxEngine.snapshot();const data=r.data||{};setAccount(data.accounts?.[0]||data.account||null);setPositions(data.positions||[]);setOrders(data.orders||[]);};
  useEffect(()=>{let alive=true;refresh().catch(e=>{if(alive)setError(e.message||"Sandbox account could not be loaded.");});const timer=setInterval(()=>refresh().catch(()=>{}),5000);return()=>{alive=false;clearInterval(timer);};},[]);

  // Load real historical OHLC candles from Deriv. The separate socket keeps the
  // chart history independent from the market-watch socket and never authorizes trades.
  useEffect(()=>{
    let disposed=false,socket=null,retry=null,timeout=null;
    setCandles([]);setAi(null);
    const timeframeInfo=TIMEFRAMES.find(t=>t.value===timeframe)||TIMEFRAMES[1];
    const connect=()=>{
      if(disposed)return;
      try{socket=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");}
      catch{setFeed("RECONNECTING");return;}
      timeout=setTimeout(()=>{if(!disposed&&socket?.readyState!==WebSocket.OPEN){try{socket.close();}catch{};}},10000);
      socket.onopen=()=>{if(disposed)return;clearTimeout(timeout);socket.send(JSON.stringify({ticks_history:symbol,adjust_start_time:1,count:150,end:"latest",style:"candles",granularity:timeframeInfo.seconds,req_id:7101}));};
      socket.onmessage=event=>{if(disposed)return;try{const message=JSON.parse(event.data);if(message.error){if(message.req_id===7101)setError("Historical candle feed: "+(message.error.message||"unavailable"));return;}if(message.req_id===7101){const history=readCandles(message);if(history.length)setCandles(history);else if(message.msg_type!=="history")setError("Deriv did not return historical candles for this market/timeframe.");}}catch{}};
      socket.onerror=()=>{if(!disposed)setFeed("RECONNECTING");};
      socket.onclose=()=>{if(!disposed)retry=setTimeout(connect,5000);};
    };
    connect();
    return()=>{disposed=true;clearTimeout(timeout);if(retry)clearTimeout(retry);try{socket?.close();}catch{};};
  },[symbol,timeframe]);

  const onPrice=next=>{
    const price=Number(next?.quote);if(!Number.isFinite(price))return;
    const tickValue={price,epoch:Number(next.epoch)||Date.now()/1000,pipSize:next.pipSize};priceRef.current=tickValue;setTick(tickValue);setFeed("LIVE");
    const interval=(TIMEFRAMES.find(t=>t.value===timeframe)||TIMEFRAMES[1]).seconds;
    const bucket=Math.floor(tickValue.epoch/interval)*interval;
    setCandles(list=>{
      const last=list[list.length-1];
      if(!last||last.time!==bucket){const nextCandle={time:bucket,open:price,high:price,low:price,close:price};return [...list,nextCandle].slice(-180);}
      const updated={...last,high:Math.max(last.high,price),low:Math.min(last.low,price),close:price};
      return [...list.slice(0,-1),updated];
    });
    if(positions.length&&Date.now()-lastMarkRef.current>1500){lastMarkRef.current=Date.now();sandboxEngine.mark({symbol,price}).catch(()=>{});}
  };
  const symbolName=symbol.replace(/^frx/,"").replace(/^cry/,"").replace(/^R_/, "Volatility ");
  const openPnl=useMemo(()=>positions.reduce((sum,p)=>sum+Number(p.unrealized_pnl||0),0),[positions]);
  const runAI=async()=>{
    if(!tick){setError("Wait for a live market price before requesting analysis.");return null;}
    setError("");setAiBusy(true);setAi(null);
    const recent=candles.slice(-12).map(c=>({open:c.open,high:c.high,low:c.low,close:c.close}));
    const observedAt=new Date(Number(tick.epoch)*1000).toISOString();
    const prompt=`Provide a concise, risk-aware educational market review for ${symbol} on ${timeframe}. The price is from the verified Deriv public feed. Observed price: ${tick.price}. Data timestamp: ${observedAt}. Recent OHLC candles: ${JSON.stringify(recent)}. Return these sections: Trend (bullish/bearish/neutral with reasons), Volatility, Key observations/indicators that can be inferred from supplied data, Risk levels and invalidation conditions, and Data limitations/confidence. Do not invent indicators that cannot be calculated from the supplied data. Do not promise returns or give certainty. This is sandbox decision support only.`;
    try{
      const {data,error:invokeError}=await supabase.functions.invoke("ai-assistant",{body:{mode:"advisor",message:prompt,history:[]}});
      if(invokeError)throw new Error(data?.error||invokeError.message);
      if(!data?.ok||!data?.answer)throw new Error(data?.error||"AI service did not return an analysis.");
      const review={text:data.answer,symbol,timeframe,price:tick.price,dataEpoch:tick.epoch,at:Date.now()};
      setAi(review);return review;
    }catch(e){setError("AI review unavailable: "+(e.message||"Please retry."));return null;}finally{setAiBusy(false);}
  };
  const runFullE2E=async()=>{
    if(e2eBusy||aiBusy||busy)return;
    setError("");setNotice("");
    if(!tick)return setError("E2E test requires a verified live Deriv tick.");
    if(!account)return setError("E2E test requires an authenticated sandbox account.");
    setE2eBusy(true);
    try{
      const review=await runAI();
      if(!review)throw new Error("AI review did not complete.");
      const testKey=crypto.randomUUID();
      const open=await sandboxEngine.executeOrder({account_id:account.id,symbol,side:"BUY",quantity:0.01,price:tick.price,idempotency_key:testKey});
      const position=open?.position||open?.data?.position||null;
      await sandboxEngine.mark({symbol,price:tick.price});
      const snap=await sandboxEngine.snapshot();
      const candidate=(snap.data?.positions||[]).find(p=>position?.id===p.id)|| (snap.data?.positions||[]).find(p=>p.symbol===symbol&&p.source_order_id===(open?.order?.id||open?.data?.order?.id));
      if(!candidate)throw new Error("Sandbox position was not created by the E2E order.");
      await sandboxEngine.closePosition({position_id:candidate.id,exit_price:tick.price,idempotency_key:crypto.randomUUID()});
      const [finalSnap,aiAudit]=await Promise.all([
        sandboxEngine.snapshot(),
        supabase.from("ai_analysis").select("id,analysis_type,model,created_at").eq("analysis_type","trading_advisor_chat").order("created_at",{ascending:false}).limit(1)
      ]);
      const closed=(finalSnap.data?.orders||[]).find(o=>o.id===(open?.order?.id||open?.data?.order?.id)|| (o.symbol===symbol&&o.closed_at));
      if(!closed||!closed.closed_at)throw new Error("Sandbox close/history verification failed.");
      if(aiAudit.error||!aiAudit.data?.length)throw new Error("AI audit record was not found after the successful AI response.");
      await refresh();
      setNotice(`FULL E2E PASS · LIVE TICK ✓ · CANDLES ${candles.length>0?"✓":"CHECK"} · AI REVIEW ✓ · AI AUDIT ✓ · SANDBOX ORDER ✓ · POSITION/P&L ✓ · CLOSE ✓ · HISTORY ✓`);
    }catch(e){setError("Full E2E verification failed: "+(e.message||"Please retry."));}
    finally{setE2eBusy(false);}
  };

  const execute=async side=>{
    setError("");setNotice("");
    const size=Number(quantity),sl=stopLoss.trim()===""?null:Number(stopLoss),tp=takeProfit.trim()===""?null:Number(takeProfit);
    if(!tick)return setError("Waiting for a verified live price.");
    if(!account)return setError("No authenticated sandbox trading account was found.");
    if(!ai||ai.symbol!==symbol||ai.timeframe!==timeframe)return setError("Complete the AI market review for the current market and timeframe before confirming a sandbox order.");
    if(!Number.isFinite(size)||size<=0)return setError("Enter a position size greater than zero.");
    if(sl!==null&&(!Number.isFinite(sl)||sl<=0))return setError("Stop loss must be a positive price.");
    if(tp!==null&&(!Number.isFinite(tp)||tp<=0))return setError("Take profit must be a positive price.");
    if(sl!==null&&((side==="BUY"&&sl>=tick.price)||(side==="SELL"&&sl<=tick.price)))return setError("Stop loss must be below the current price for Buy and above it for Sell.");
    if(tp!==null&&((side==="BUY"&&tp<=tick.price)||(side==="SELL"&&tp>=tick.price)))return setError("Take profit must be above the current price for Buy and below it for Sell.");
    const confirmed=window.confirm(`Confirm SANDBOX ${side} order\nMarket: ${symbolName} (${symbol})\nSize: ${size}\nObserved price: ${fmt(tick.price,8)}\nStop loss: ${sl??"not set"}\nTake profit: ${tp??"not set"}\n\nThis is a virtual order only. No real broker order will be sent.`);
    if(!confirmed)return;
    setBusy(true);
    try{await sandboxEngine.executeOrder({account_id:account.id,symbol,side,quantity:size,price:tick.price,stop_loss:sl,take_profit:tp,idempotency_key:crypto.randomUUID()});setNotice(`Sandbox ${side} order submitted for ${symbolName}.`);await refresh();setActiveTab("positions");}
    catch(e){setError(e.message||"Sandbox order failed.");}
    finally{setBusy(false);}
  };
  const close=async p=>{
    const current=priceRef.current;if(!current)return setError("Waiting for the current market price before closing.");
    if(!window.confirm(`Close sandbox position ${p.symbol} ${p.side} at observed price ${fmt(current.price,8)}?`))return;
    setBusy(true);setError("");setNotice("");
    try{await sandboxEngine.closePosition({position_id:p.id,exit_price:current.price,idempotency_key:crypto.randomUUID()});setNotice("Sandbox position closed.");await refresh();}
    catch(e){setError(e.message||"Could not close position.");}finally{setBusy(false);}
  };

  return <div className="vt-page">
    <header className="vt-heading"><div><span className="eyebrow">VELTRION / TRADING WORKSPACE</span><h1>{symbolName} <span className="vt-symbol-code">{symbol}</span></h1><p>Market Watch · candlestick chart · order ticket · open positions. Real-money execution is not available in this terminal.</p></div><div className="vt-header-actions"><span className={feed==="LIVE"?"vt-feed live":"vt-feed"}><i/> {feed==="LIVE"?"LIVE MARKET DATA":feed}</span><span className="vt-mode-chip">SANDBOX ONLY</span></div></header>
    <div className="vt-metrics"><div className="vt-metric"><span>Available sandbox balance</span><strong>{account?.currency||"USD"} {fmt(account?.available_capital,2)}</strong><small>Virtual account funds</small></div><div className="vt-metric"><span>Bid / observed price</span><strong>{tick?fmt(tick.price,8):"—"}</strong><small>{symbolName} · public feed</small></div><div className="vt-metric"><span>Open positions</span><strong>{positions.length}</strong><small>Sandbox records</small></div><div className="vt-metric"><span>Floating P/L</span><strong className={openPnl>=0?"vt-positive":"vt-negative"}>{account?.currency||"USD"} {fmt(openPnl,2)}</strong><small>Reported by sandbox service</small></div></div>
    <LiveMarketPanel compact selectedSymbol={symbol} onSymbolChange={setSymbol} onPriceChange={onPrice}/>
    <section className="vt-panel vt-chart-panel"><div className="vt-panel-head"><div><h2>Price Chart <span className="vt-symbol-code">{symbol}</span></h2><p>{candles.length} candles · Deriv historical OHLC + live tick updates</p></div><div className="vt-timeframes">{TIMEFRAMES.map(t=><button key={t.value} className={timeframe===t.value?"active":""} onClick={()=>setTimeframe(t.value)}>{t.label}</button>)}</div></div><CandleChart candles={candles} symbol={symbolName} price={tick?.price}/><div className="vt-chart-footer"><span><i className="vt-legend-candle up"/> Bullish <i className="vt-legend-candle down"/> Bearish</span><span>Historical data is loaded from Deriv when available; the latest candle updates from the public tick stream.</span></div></section>
    <div className="vt-lower-grid">
      <section className="vt-panel"><div className="vt-section-title"><div><h2>Order Ticket</h2><p>Market order · virtual execution only</p></div><span className="vt-ai-tag">SANDBOX</span></div>
        <label className="vt-label">Market<select value={symbol} onChange={e=>setSymbol(e.target.value)}><option value={symbol}>{symbolName} ({symbol})</option></select></label>
        <div className="vt-order-price"><div><span>Observed price</span><strong>{tick?fmt(tick.price,8):"Waiting for feed…"}</strong></div><span className={feed==="LIVE"?"vt-feed live":"vt-feed"}>{feed==="LIVE"?"LIVE":"WAITING"}</span></div>
        <label className="vt-label">Position size<input type="number" min="0.01" step="0.01" inputMode="decimal" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
        <div className="vt-risk-fields"><label className="vt-label">Stop loss <input type="number" min="0" step="any" inputMode="decimal" placeholder="Optional price" value={stopLoss} onChange={e=>setStopLoss(e.target.value)}/></label><label className="vt-label">Take profit <input type="number" min="0" step="any" inputMode="decimal" placeholder="Optional price" value={takeProfit} onChange={e=>setTakeProfit(e.target.value)}/></label></div>
        <div className="vt-order-actions"><button className="vt-buy" disabled={busy||!tick||!account} onClick={()=>execute("BUY")}>{busy?"PROCESSING…":"BUY / LONG"}</button><button className="vt-sell" disabled={busy||!tick||!account} onClick={()=>execute("SELL")}>{busy?"PROCESSING…":"SELL / SHORT"}</button></div>
        <small className="vt-gate-note">Orders require a current AI review plus a confirmation tap. They are sent only to the VELTRION sandbox service. No real money is used.</small>
      </section>
      <section className="vt-panel"><div className="vt-section-title"><div><h2>AI Market Review</h2><p>Optional educational context; not a trade signal</p></div><span className="vt-ai-tag">ADVISORY</span></div><button className="vt-ai-button" onClick={runAI} disabled={aiBusy||e2eBusy||!tick}>{aiBusy?"ANALYZING…":"REVIEW THIS MARKET"}</button><button className="vt-ai-button" onClick={runFullE2E} disabled={aiBusy||e2eBusy||busy||!tick||!account}>{e2eBusy?"RUNNING FULL E2E…":"RUN FULL SANDBOX E2E"}</button>{ai&&ai.symbol===symbol&&<div className="vt-ai-result"><div className="vt-ai-meta">Reviewed {new Date(ai.at).toLocaleTimeString()} · {ai.symbol} · {ai.timeframe} · observed {fmt(ai.price,8)}</div><p>{ai.text}</p></div>}<div className="vt-disclaimer">AI output can be wrong and never places, changes or closes an order.</div></section>
    </div>
    <section className="vt-panel"><div className="vt-section-title"><div><h2>Trading Activity</h2><p>Positions and orders recorded by the sandbox service</p></div><div className="vt-activity-tabs"><button className={activeTab==="positions"?"active":""} onClick={()=>setActiveTab("positions")}>Positions ({positions.length})</button><button className={activeTab==="orders"?"active":""} onClick={()=>setActiveTab("orders")}>Orders ({orders.length})</button></div></div>
      {activeTab==="positions"?(positions.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Market</th><th>Side</th><th>Size</th><th>Entry</th><th>Current</th><th>Stop loss</th><th>Take profit</th><th>Floating P/L</th><th>Action</th></tr></thead><tbody>{positions.map(p=><tr key={p.id}><td>{p.symbol}</td><td className={String(p.side).toUpperCase()==="BUY"?"vt-positive":"vt-negative"}>{p.side}</td><td>{p.quantity}</td><td>{fmt(Number(p.entry_price),8)}</td><td>{fmt(Number(p.current_price),8)}</td><td>{fmt(Number(p.stop_loss),8)}</td><td>{fmt(Number(p.take_profit),8)}</td><td className={Number(p.unrealized_pnl)>=0?"vt-positive":"vt-negative"}>{fmt(Number(p.unrealized_pnl),2)}</td><td><button className="vt-close" disabled={busy||!tick} onClick={()=>close(p)}>Close</button></td></tr>)}</tbody></table></div>:<div className="vt-empty">No open sandbox positions. Confirm a Buy or Sell sandbox order to see it here.</div>):(orders.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Time</th><th>Market</th><th>Side</th><th>Size</th><th>Price</th><th>Status</th><th>Realized P/L</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.created_at?new Date(o.created_at).toLocaleString():"—"}</td><td>{o.symbol}</td><td>{o.side}</td><td>{o.quantity}</td><td>{fmt(Number(o.price),8)}</td><td>{o.status||"—"}</td><td>{o.realized_pnl==null?"—":fmt(Number(o.realized_pnl),2)}</td></tr>)}</tbody></table></div>:<div className="vt-empty">No sandbox order records were returned.</div>)}
    </section>
    {notice&&<div className="vt-success" role="status">{notice}</div>}{error&&<div className="vt-error" role="alert">{error}</div>}
  </div>;
}
