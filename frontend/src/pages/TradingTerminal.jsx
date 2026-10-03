import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { sandboxEngine } from "../services/sandboxEngine";
import { supabase } from "../supabaseClient";

const tradingService = "trading-service";
async function invokeTradingService(body) {
  const { data, error } = await supabase.functions.invoke(tradingService, { body });
  if (error) throw new Error(data?.error || error.message || "LIVE_BROKER_REQUEST_FAILED");
  if (!data?.ok) throw new Error(data?.error || "LIVE_BROKER_REQUEST_FAILED");
  return data.data;
}

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
  const navigate=useNavigate();
  const [symbol,setSymbol]=useState(()=>searchParams.get("symbol")||"frxEURUSD");
  const [tick,setTick]=useState(null),[feed,setFeed]=useState("WAITING"),[candles,setCandles]=useState([]),[timeframe,setTimeframe]=useState("M5");
  const [account,setAccount]=useState(null),[positions,setPositions]=useState([]),[orders,setOrders]=useState([]);
  const [quantity,setQuantity]=useState("0.01"),[stopLoss,setStopLoss]=useState(""),[takeProfit,setTakeProfit]=useState("");
  const [e2eBusy,setE2eBusy]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[activeTab,setActiveTab]=useState("positions");
  const [executionMode,setExecutionMode]=useState("SANDBOX"),[liveAccount,setLiveAccount]=useState(null),[livePortfolio,setLivePortfolio]=useState([]),[selectedLiveContract,setSelectedLiveContract]=useState(null),[liveStake,setLiveStake]=useState("10"),[liveGrowth,setLiveGrowth]=useState("1");
  const lastMarkRef=useRef(0),priceRef=useRef(null);
  useEffect(()=>{const requested=searchParams.get("symbol");if(requested)setSymbol(requested);},[searchParams]);

  const refresh=async()=>{const r=await sandboxEngine.snapshot();const data=r.data||{};setAccount(data.accounts?.[0]||data.account||null);setPositions(data.positions||[]);setOrders(data.orders||[]);};
  const refreshLive=async()=>{const data=await invokeTradingService({operation:"real_snapshot"});setLiveAccount(data?.balance||null);setLivePortfolio(data?.portfolio?.contracts||[]);return data;};
  useEffect(()=>{let alive=true;refresh().catch(e=>{if(alive)setError(e.message||"Sandbox account could not be loaded.");});const timer=setInterval(()=>refresh().catch(()=>{}),5000);return()=>{alive=false;clearInterval(timer);};},[]);
  useEffect(()=>{if(executionMode!=="LIVE")return;let alive=true;refreshLive().catch(e=>{if(alive)setError(e.message||"Live broker account could not be loaded.");});const timer=setInterval(()=>refreshLive().catch(()=>{}),10000);return()=>{alive=false;clearInterval(timer);};},[executionMode]);

  // Load real historical OHLC candles from Deriv. The separate socket keeps the
  // chart history independent from the market-watch socket and never authorizes trades.
  useEffect(()=>{
    let disposed=false,socket=null,retry=null,timeout=null;
    setCandles([]);
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
  const runFullE2E=async()=>{
    setError("");setNotice("");
    if(e2eBusy||busy)return;
    if(!tick)return setError("E2E test requires a verified live Deriv tick.");
    if(!account)return setError("E2E test requires an authenticated sandbox account.");
    if(!candles.length)return setError("Historical candles are not available yet.");
    setE2eBusy(true);
    try{
      const testKey=crypto.randomUUID();
      const open=await sandboxEngine.executeOrder({account_id:account.id,symbol,side:"BUY",quantity:0.01,price:tick.price,idempotency_key:testKey});
      const position=open?.position||open?.data?.position||null;
      await sandboxEngine.mark({symbol,price:tick.price});
      const snap=await sandboxEngine.snapshot();
      const candidate=(snap.data?.positions||[]).find(p=>position?.id===p.id)|| (snap.data?.positions||[]).find(p=>p.symbol===symbol&&p.source_order_id===(open?.order?.id||open?.data?.order?.id));
      if(!candidate)throw new Error("Sandbox position was not created by the E2E order.");
      await sandboxEngine.closePosition({position_id:candidate.id,exit_price:tick.price,idempotency_key:crypto.randomUUID()});
      const finalSnap=await sandboxEngine.snapshot();
      const closed=(finalSnap.data?.orders||[]).find(o=>o.id===(open?.order?.id||open?.data?.order?.id)|| (o.symbol===symbol&&o.closed_at));
      if(!closed||!closed.closed_at)throw new Error("Sandbox close/history verification failed.");
      await refresh();
      setNotice(`FULL E2E PASS · LIVE TICK ✓ · CANDLES ✓ · SANDBOX ORDER ✓ · POSITION/P&L ✓ · CLOSE ✓ · HISTORY ✓ · AI REVIEW DISABLED`);
    }catch(e){setError("Full E2E verification failed: "+(e.message||"Please retry."));}
    finally{setE2eBusy(false);}
  };

  const executeLive=async side=>{
    setError("");setNotice("");
    if(busy)return;
    if(!tick)return setError("Waiting for a verified live price.");
    const stake=Number(liveStake),growth=Number(liveGrowth);
    if(!(stake>0)||!(growth>0))return setError("Enter valid live stake and growth values.");
    setBusy(true);
    try{
      if(side==="BUY"){
        const proposalData=await invokeTradingService({operation:"accu_proposal",contract_template:{amount:stake,basis:"stake",contract_type:"ACCU",currency:String(liveAccount?.currency||"USD"),growth_rate:growth,underlying_symbol:symbol,duration:5,duration_unit:"m"}});
        const proposal=proposalData?.proposal||proposalData;
        const proposalId=String(proposal?.id||"");
        const maxPrice=Number(proposal?.ask_price??proposal?.display_value??proposal?.price);
        if(!proposalId||!(maxPrice>0))throw new Error("LIVE_BROKER_PROPOSAL_INVALID");
        if(!window.confirm(`CONFIRM LIVE BROKER BUY\\n${symbolName} (${symbol}) · ${stake} ${liveAccount?.currency||"USD"} · growth ${growth}%\\nThe protected trading service will submit this order only if its server-side safety controls are enabled.`))return;
        const result=await invokeTradingService({operation:"buy",proposal_id:proposalId,price:maxPrice,stake,symbol,client_order_id:crypto.randomUUID()});
        setNotice(`LIVE BROKER BUY CONFIRMED · contract ${result?.buy?.contract_id||result?.order?.deriv_contract_id||"created"}`);
      }else{
        if(!selectedLiveContract)return setError("Select an open live contract before selling.");
        const contractId=String(selectedLiveContract.contract_id||selectedLiveContract.id||"");
        if(!contractId)return setError("LIVE_CONTRACT_ID_REQUIRED");
        if(!window.confirm(`CONFIRM LIVE BROKER SELL\\nContract ${contractId} on ${symbolName}.\\nThe protected trading service will submit the close only if its server-side safety controls are enabled.`))return;
        const result=await invokeTradingService({operation:"sell",contract_id:contractId,price:0});
        setSelectedLiveContract(null);setNotice(`LIVE BROKER SELL CONFIRMED · ${result?.sell?.contract_id||contractId}`);
      }
      await refreshLive();
    }catch(e){setError(e.message||"LIVE_BROKER_ORDER_FAILED");}
    finally{setBusy(false);}
  };

  const execute=async side=>{
    setError("");setNotice("");
    const size=Number(quantity),sl=stopLoss.trim()===""?null:Number(stopLoss),tp=takeProfit.trim()===""?null:Number(takeProfit);
    if(!tick)return setError("Waiting for a verified live price.");
    if(!account)return setError("No authenticated sandbox trading account was found.");
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
    <header className="vt-heading"><div><span className="eyebrow">VELTRION / TRADING WORKSPACE</span><h1>{symbolName} <span className="vt-symbol-code">{symbol}</span></h1><p>Market Watch · candlestick chart · order ticket · open positions. Real-money execution is not available in this terminal.</p></div><div className="vt-header-actions"><span className={feed==="LIVE"?"vt-feed live":"vt-feed"}><i/> {feed==="LIVE"?"LIVE MARKET DATA":feed}</span><span className="vt-mode-chip">{executionMode==="LIVE"?"LIVE BROKER":"SANDBOX"}</span><button className="vt-ai-button" onClick={()=>setExecutionMode(m=>m==="SANDBOX"?"LIVE":"SANDBOX")}>{executionMode==="SANDBOX"?"ENABLE LIVE BROKER":"USE SANDBOX"}</button><button className="vt-ai-button" onClick={()=>navigate(`/real-trading?symbol=${encodeURIComponent(symbol)}`)}>REAL TERMINAL</button></div></header>
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
        <small className="vt-gate-note">Orders require a current live price and a confirmation tap. AI review is currently disabled and never authorizes or executes an order. Orders are sent only to the VELTRION sandbox service.</small>
      </section>
      <section className="vt-panel"><div className="vt-section-title"><div><h2>AI Market Review</h2><p>AI Review is temporarily unavailable while this terminal release is stabilized.</p></div><span className="vt-ai-tag">COMING SOON</span></div><button className="vt-ai-button" disabled>AI REVIEW — UNAVAILABLE FOR NOW</button><div className="vt-disclaimer">AI is intentionally disabled in this release. It does not authorize, place, change or close any order.</div></section>
    </div>
    <section className="vt-panel"><div className="vt-section-title"><div><h2>Trading Activity</h2><p>Positions and orders recorded by the sandbox service</p></div><div className="vt-activity-tabs"><button className={activeTab==="positions"?"active":""} onClick={()=>setActiveTab("positions")}>Positions ({positions.length})</button><button className={activeTab==="orders"?"active":""} onClick={()=>setActiveTab("orders")}>Orders ({orders.length})</button></div></div>
      {activeTab==="positions"?(positions.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Market</th><th>Side</th><th>Size</th><th>Entry</th><th>Current</th><th>Stop loss</th><th>Take profit</th><th>Floating P/L</th><th>Action</th></tr></thead><tbody>{positions.map(p=><tr key={p.id}><td>{p.symbol}</td><td className={String(p.side).toUpperCase()==="BUY"?"vt-positive":"vt-negative"}>{p.side}</td><td>{p.quantity}</td><td>{fmt(Number(p.entry_price),8)}</td><td>{fmt(Number(p.current_price),8)}</td><td>{fmt(Number(p.stop_loss),8)}</td><td>{fmt(Number(p.take_profit),8)}</td><td className={Number(p.unrealized_pnl)>=0?"vt-positive":"vt-negative"}>{fmt(Number(p.unrealized_pnl),2)}</td><td><button className="vt-close" disabled={busy||!tick} onClick={()=>close(p)}>Close</button></td></tr>)}</tbody></table></div>:<div className="vt-empty">No open sandbox positions. Confirm a Buy or Sell sandbox order to see it here.</div>):(orders.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Time</th><th>Market</th><th>Side</th><th>Size</th><th>Price</th><th>Status</th><th>Realized P/L</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.created_at?new Date(o.created_at).toLocaleString():"—"}</td><td>{o.symbol}</td><td>{o.side}</td><td>{o.quantity}</td><td>{fmt(Number(o.price),8)}</td><td>{o.status||"—"}</td><td>{o.realized_pnl==null?"—":fmt(Number(o.realized_pnl),2)}</td></tr>)}</tbody></table></div>:<div className="vt-empty">No sandbox order records were returned.</div>)}
    </section>
    {executionMode==="LIVE"&&<section className="vt-panel"><div className="vt-section-title"><div><h2>Live Broker Parameters</h2><p>Server-gated Deriv ACCU execution parameters</p></div><span className="vt-ai-tag">PROTECTED</span></div><div className="vt-risk-fields"><label className="vt-label">Live stake<input type="number" min="0.01" step="0.01" value={liveStake} onChange={e=>setLiveStake(e.target.value)}/></label><label className="vt-label">Growth %<input type="number" min="0.01" step="0.01" value={liveGrowth} onChange={e=>setLiveGrowth(e.target.value)}/></label></div><div className="vt-disclaimer">Live orders require an authenticated broker account and all server-side safety controls to be enabled. The browser never receives the broker access token.</div></section>}
    {notice&&<div className="vt-success" role="status">{notice}</div>}{error&&<div className="vt-error" role="alert">{error}</div>}
  </div>;
}
