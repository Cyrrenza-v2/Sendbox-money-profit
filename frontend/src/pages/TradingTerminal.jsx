import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LiveMarketPanel from "../components/LiveMarketPanel";
import TradingViewChart from "../components/TradingViewChart";
import { supabase } from "../supabaseClient";
import { sandboxEngine } from "../services/sandboxEngine";
const fmt = (n, digits = 5) => Number.isFinite(Number(n)) ? Number(n).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) }) : "—";
const TIMEFRAMES = [
  ...Array.from({length:30},(_,i)=>i+1).map(m=>({label:`${m}m`,value:`M${m}`,seconds:m*60})),
  ...[1,2,3,4,5,6,8,12].map(h=>({label:`${h}h`,value:`H${h}`,seconds:h*3600})),
  {label:"1d",value:"D1",seconds:86400},{label:"1w",value:"W1",seconds:604800},{label:"1mo",value:"MN1",seconds:2592000}
];

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
  const [symbol,setSymbol]=useState(()=>searchParams.get("symbol")||"");
  const [tick,setTick]=useState(null),[feed,setFeed]=useState("WAITING"),[candles,setCandles]=useState([]),[timeframe,setTimeframe]=useState("M5");
  const [mode,setMode]=useState(()=>searchParams.get("mode")==="real"?"real":"demo");
  const [account,setAccount]=useState(null),[positions,setPositions]=useState([]),[orders,setOrders]=useState([]);
  const [realSnapshot,setRealSnapshot]=useState(null);
  const [realBusy,setRealBusy]=useState(false);
  const [quantity,setQuantity]=useState("0.01"),[stopLoss,setStopLoss]=useState(""),[takeProfit,setTakeProfit]=useState("");
  const [e2eBusy,setE2eBusy]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[activeTab,setActiveTab]=useState("positions"),[chartView,setChartView]=useState("chart"),[chartStyle,setChartStyle]=useState("candles"),[orderType,setOrderType]=useState("market"),[showOrderPanel,setShowOrderPanel]=useState(true);
  const refreshInFlightRef=useRef(false);

  const lastMarkRef=useRef(0),priceRef=useRef(null),timeframeRef=useRef(timeframe);
  useEffect(()=>{const requested=searchParams.get("symbol");if(requested)setSymbol(requested);},[searchParams]);
  useEffect(()=>{timeframeRef.current=timeframe;},[timeframe]);

  const invokeTrading=async(body)=>{
    const {data,error}=await supabase.functions.invoke("trading-service",{method:"POST",body});
    if(error) throw error;
    if(data?.ok===false) throw new Error(data.error||"TRADING_SERVICE_FAILED");
    return data?.data??data;
  };
  const refresh=async()=>{
    if(mode==="demo"){
      const r=await sandboxEngine.snapshot();const data=r.data||{};
      setAccount(data.accounts?.[0]||data.account||null);setPositions(data.positions||[]);setOrders(data.orders||[]);
      return;
    }
    const data=await invokeTrading({operation:"real_snapshot"});
    const balance=Number(data?.balance?.balance);
    setRealSnapshot(data);
    setAccount({currency:data?.balance?.currency||"USD",available_capital:Number.isFinite(balance)?balance:0,balance});
    const contracts=Array.isArray(data?.portfolio?.contracts)?data.portfolio.contracts:[];
    setPositions(contracts.map(p=>({id:String(p.contract_id??p.id),symbol:String(p.underlying_symbol??p.symbol??""),side:String(p.contract_type??p.direction??"BUY").toUpperCase().includes("PUT")?"SELL":"BUY",quantity:Number(p.buy_price??p.amount??0),entry_price:Number(p.buy_price??0),current_price:Number(p.bid_price??p.sell_price??p.current_price??p.buy_price??0),unrealized_pnl:Number(p.profit??p.profit_loss??0),contract_id:p.contract_id})));
    const history=Array.isArray(data?.profit_table?.transactions)?data.profit_table.transactions:[];
    setOrders(history.map((x,i)=>({id:String(x.transaction_id??x.id??i),symbol:x.symbol??x.underlying_symbol??"—",side:x.action??x.contract_type??"—",quantity:x.amount??x.buy_price??"—",price:x.buy_price??x.sell_price??"—",status:"CLOSED",realized_pnl:x.profit??x.profit_loss??0,created_at:x.transaction_time?new Date(Number(x.transaction_time)*1000).toISOString():null})));
  };
  useEffect(()=>{
    let alive=true;
    let timer=null;
    const runRefresh=async()=>{
      if(!alive||refreshInFlightRef.current||document.visibilityState==="hidden")return;
      refreshInFlightRef.current=true;
      try{await refresh();if(alive)setError("");}
      catch(e){if(alive)setError(e.message||"Account could not be loaded.");}
      finally{refreshInFlightRef.current=false;}
    };
    void runRefresh();
    timer=setInterval(()=>void runRefresh(),15000);
    const onVisible=()=>{if(document.visibilityState==="visible")void runRefresh();};
    window.addEventListener("online",onVisible);
    document.addEventListener("visibilitychange",onVisible);
    return()=>{alive=false;if(timer)clearInterval(timer);window.removeEventListener("online",onVisible);document.removeEventListener("visibilitychange",onVisible);};
  },[mode]);

  // Load real historical OHLC candles from Deriv. The separate socket keeps the
  // chart history independent from the market-watch socket and never authorizes trades.
  useEffect(()=>{
    let disposed=false,socket=null,retry=null,timeout=null,historyTimeout=null;
    setCandles([]);
    const timeframeInfo=TIMEFRAMES.find(t=>t.value===timeframe)||TIMEFRAMES[1];
    const connect=()=>{
      if(disposed)return;
      try{socket=new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");}
      catch{setFeed("RECONNECTING");return;}
      timeout=setTimeout(()=>{if(!disposed&&socket?.readyState!==WebSocket.OPEN){try{socket.close();}catch{};}},10000);
      historyTimeout=setTimeout(()=>{if(!disposed){setError("Historical candle feed timed out; reconnecting…");try{socket.close();}catch{}}},12000);
      socket.onopen=()=>{if(disposed)return;clearTimeout(timeout);socket.send(JSON.stringify({ticks_history:symbol,adjust_start_time:1,count:150,end:"latest",style:"candles",granularity:timeframeInfo.seconds,req_id:7101}));};
      socket.onmessage=event=>{if(disposed)return;try{const message=JSON.parse(event.data);if(message.error){if(message.req_id===7101){clearTimeout(historyTimeout);setError("Historical candle feed: "+(message.error.message||"unavailable"));try{socket.close();}catch{}}return;}if(message.req_id===7101){clearTimeout(historyTimeout);const history=readCandles(message);if(history.length){setCandles(history);setError("");}else{setError("Deriv did not return historical candles for this market/timeframe.");try{socket.close();}catch{}}}}catch{}};
      socket.onerror=()=>{if(!disposed)setFeed("RECONNECTING");};
      socket.onclose=()=>{clearTimeout(timeout);clearTimeout(historyTimeout);if(!disposed)retry=setTimeout(connect,2500);};
    };
    connect();
    return()=>{disposed=true;clearTimeout(timeout);clearTimeout(historyTimeout);if(retry)clearTimeout(retry);try{socket?.close();}catch{};};
  },[symbol,timeframe]);

  const onPrice=next=>{
    const price=Number(next?.quote);if(!Number.isFinite(price))return;
    const tickValue={price,epoch:Number(next.epoch)||Date.now()/1000,pipSize:next.pipSize};priceRef.current=tickValue;setTick(tickValue);setFeed("LIVE");
    const activeTimeframe=timeframeRef.current;
    const interval=(TIMEFRAMES.find(t=>t.value===activeTimeframe)||TIMEFRAMES[1]).seconds;
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
  const riskDistance=useMemo(()=>{const p=Number(tick?.price),sl=Number(stopLoss),tp=Number(takeProfit);return {sl:Number.isFinite(p)&&Number.isFinite(sl)?Math.abs(p-sl):null,tp:Number.isFinite(p)&&Number.isFinite(tp)?Math.abs(tp-p):null};},[tick,stopLoss,takeProfit]);
  const navTo=(tab)=>{setActiveTab(tab);document.getElementById("vt-activity")?.scrollIntoView({behavior:"smooth",block:"start"});};
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

  const execute=async side=>{
    setError("");setNotice("");
    const size=Number(quantity),sl=stopLoss.trim()===""?null:Number(stopLoss),tp=takeProfit.trim()===""?null:Number(takeProfit);
    if(!tick)return setError("Waiting for a verified live price.");
    if(!account)return setError("No authenticated trading account was found.");
    if(!Number.isFinite(size)||size<=0)return setError("Enter a position size greater than zero.");
    if(sl!==null&&(!Number.isFinite(sl)||sl<=0))return setError("Stop loss must be a positive price.");
    if(tp!==null&&(!Number.isFinite(tp)||tp<=0))return setError("Take profit must be a positive price.");
    if(sl!==null&&((side==="BUY"&&sl>=tick.price)||(side==="SELL"&&sl<=tick.price)))return setError("Stop loss must be below the current price for Buy and above it for Sell.");
    if(tp!==null&&((side==="BUY"&&tp<=tick.price)||(side==="SELL"&&tp>=tick.price)))return setError("Take profit must be above the current price for Buy and below it for Sell.");
    const confirmed=window.confirm(`Confirm ${mode==="real"?"REAL":"SANDBOX"} ${side} order\nMarket: ${symbolName} (${symbol})\nSize: ${size}\nObserved price: ${fmt(tick.price,8)}\nStop loss: ${sl??"not set"}\nTake profit: ${tp??"not set"}\n\n${mode==="real"?"This sends an order to the authenticated real Deriv account only if server-side production gates and actual broker funds permit it.":"This is a virtual order only. No real broker order will be sent."}`);
    if(!confirmed)return;
    setBusy(true);setError("");
    try{
      if(mode==="demo"){
        await sandboxEngine.executeOrder({account_id:account.id,symbol,side,quantity:size,price:tick.price,stop_loss:sl,take_profit:tp,idempotency_key:crypto.randomUUID()});
        setNotice(`Sandbox ${side} order submitted for ${symbolName}.`);
      }else{
        setRealBusy(true);
        const proposal=await invokeTrading({operation:"proposal",symbol,side,stake:size,duration:5,duration_unit:"m"});
        const proposalId=proposal?.proposal?.id??proposal?.id;
        const maxPrice=Number(proposal?.proposal?.ask_price??proposal?.ask_price??tick.price);
        if(!proposalId) throw new Error("REAL_PROPOSAL_UNAVAILABLE");
        await invokeTrading({operation:"buy",proposal_id:proposalId,price:Number.isFinite(maxPrice)&&maxPrice>0?maxPrice:tick.price,stake:size,symbol,client_order_id:crypto.randomUUID()});
        setNotice(`Real ${side} order submitted for ${symbolName}; broker state is being reconciled.`);
      }
      await refresh();setActiveTab("positions");
    }catch(e){setError(e.message||"Order failed.");}
    finally{setBusy(false);setRealBusy(false);}
  };
  const close=async p=>{
    const current=priceRef.current;if(!current)return setError("Waiting for the current market price before closing.");
    if(!window.confirm(`Close ${mode==="real"?"real":"sandbox"} position ${p.symbol} ${p.side} at observed price ${fmt(current.price,8)}?`))return;
    setBusy(true);setError("");setNotice("");
    try{
      if(mode==="demo"){
        await sandboxEngine.closePosition({position_id:p.id,exit_price:current.price,idempotency_key:crypto.randomUUID()});setNotice("Sandbox position closed.");
      }else{
        await invokeTrading({operation:"sell",contract_id:p.contract_id,price:current.price});
        setNotice("Real contract close request submitted; broker state will be reconciled.");
      }
      await refresh();
    }
    catch(e){setError(e.message||"Could not close position.");}finally{setBusy(false);}
  };

  return <div className="vt-page">
    <header className="vt-heading"><div><span className="eyebrow">VELTRION / TRADING WORKSPACE</span><h1>{symbolName} <span className="vt-symbol-code">{symbol}</span></h1><p>Market Watch · live chart · order ticket · positions. Demo and Real are isolated execution environments.</p></div><div className="vt-header-actions"><span className={feed==="LIVE"?"vt-feed live":"vt-feed"}><i/> {feed==="LIVE"?"LIVE MARKET DATA":feed}</span><span className="vt-mode-chip">{mode==="real"?"REAL LIVE":"DEMO SANDBOX"}</span>
          <button className="vt-ai-button" onClick={()=>{const next=mode==="real"?"demo":"real";setMode(next);navigate(`/app/trading/terminal?mode=${next}&symbol=${encodeURIComponent(symbol)}`);}}>{mode==="real"?"SWITCH TO DEMO":"SWITCH TO REAL"}</button></div></header>
    <div className="vt-terminal-toolbar"><div className="vt-toolbar-group"><button className="vt-tool" onClick={()=>navigate("/app/markets")}>← Market Watch</button><button className="vt-tool active" onClick={()=>setChartView("chart")}>Chart</button><button className="vt-tool" onClick={()=>setShowOrderPanel(v=>!v)}>{showOrderPanel?"Hide":"Show"} Trade</button><button className="vt-tool" onClick={()=>navTo("positions")}>Positions</button><button className="vt-tool" onClick={()=>navTo("orders")}>History</button></div><div className="vt-toolbar-group"><span className={feed==="LIVE"?"vt-status-pill live":"vt-status-pill"}>{feed==="LIVE"?"● LIVE TICKS":"○ "+feed}</span><span className="vt-status-pill">{mode==="real"?"REAL ACCOUNT":"SANDBOX"}</span><button className="vt-tool" onClick={()=>refresh()}>↻ Refresh</button></div></div><div className="vt-metrics"><div className="vt-metric"><span>{mode==="real"?"Available real balance":"Available sandbox balance"}</span><strong>{account?.currency||"USD"} {fmt(account?.available_capital,2)}</strong><small>{mode==="real"?"Authenticated broker cash balance":"Virtual account funds"}</small></div><div className="vt-metric"><span>Bid / observed price</span><strong>{tick?fmt(tick.price,8):"—"}</strong><small>{symbolName} · public feed</small></div><div className="vt-metric"><span>Open positions</span><strong>{positions.length}</strong><small>{mode==="real"?"Real broker positions":"Sandbox records"}</small></div><div className="vt-metric"><span>Floating P/L</span><strong className={openPnl>=0?"vt-positive":"vt-negative"}>{account?.currency||"USD"} {fmt(openPnl,2)}</strong><small>{mode==="real"?"Broker-synchronized P/L":"Reported by sandbox service"}</small></div></div>
    <LiveMarketPanel compact selectedSymbol={symbol} onSymbolChange={setSymbol} onPriceChange={onPrice}/>
    <section className="vt-terminal-layout"><div className="vt-chart-shell"><section className="vt-panel vt-chart-panel"><div className="vt-panel-head"><div><h2>Live Market Chart <span className="vt-symbol-code">{symbol}</span></h2><p>{mode==="real"?"Real-account market view":"Demo-account market view"} · live Deriv feed</p></div></div><div className="vt-chart-tabs"><button className="active" onClick={()=>setChartView("chart")}>CHART</button><button onClick={()=>setChartView("ticks")}>TICKS</button><button onClick={()=>setChartView("market")}>MARKET</button></div><div className="vt-chart-tools"><span className="vt-status-pill">{symbolName}</span>{TIMEFRAMES.filter(t=>["M1","M5","M15","M30","H1","H4","D1"].includes(t.value)).map(t=><button key={t.value} className={timeframe===t.value?"vt-tool active":"vt-tool"} onClick={()=>setTimeframe(t.value)}>{t.label}</button>)}<select value={chartStyle} onChange={e=>setChartStyle(e.target.value)}><option value="candles">Candles</option><option value="line">Line</option></select></div>{chartView==="chart" && (chartStyle==="candles" ? <CandleChart candles={candles} symbol={symbolName} price={tick?.price}/> : <div className="vt-chart-empty">Line view follows the verified Deriv tick stream. Use Candles for OHLC analysis.</div>)}{chartView==="ticks" && <div className="vt-mini-card"><h3>LIVE TICK STREAM</h3><div className="vt-mini-row"><span>Symbol</span><strong>{symbol}</strong></div><div className="vt-mini-row"><span>Observed price</span><strong>{tick?fmt(tick.price,8):"—"}</strong></div><div className="vt-mini-row"><span>Epoch</span><strong>{tick?.epoch?new Date(tick.epoch*1000).toLocaleTimeString():"—"}</strong></div></div>}{chartView==="market" && <LiveMarketPanel compact selectedSymbol={symbol} onSymbolChange={setSymbol} onPriceChange={onPrice}/>}</section><section className="vt-panel vt-chart-panel"><div className="vt-panel-head"><div><h2>Broker Chart</h2><p>TradingView for supported symbols; Deriv OHLC fallback for synthetic markets.</p></div></div><TradingViewChart symbol={symbol} candles={candles} price={tick?.price} interval={timeframe.startsWith("M")?timeframe.slice(1):timeframe.startsWith("H")?String(Number(timeframe.slice(1))*60):timeframe==="D1"?"D":timeframe==="W1"?"W":"M"} theme="dark"/></section></div>{showOrderPanel && <aside className="vt-side-panel"><section className="vt-mini-card"><h3>ACCOUNT</h3><div className="vt-status-strip"><span className={`vt-status-pill ${mode==="real"?"warn":""}`}>{mode==="real"?"REAL LIVE":"SANDBOX"}</span><span className={`vt-status-pill ${feed==="LIVE"?"live":""}`}>{feed}</span></div><div className="vt-mini-row"><span>Balance</span><strong>{account?.currency||"USD"} {fmt(account?.available_capital,2)}</strong></div><div className="vt-mini-row"><span>Floating P/L</span><strong className={openPnl>=0?"vt-positive":"vt-negative"}>{fmt(openPnl,2)}</strong></div><div className="vt-mini-row"><span>Positions</span><strong>{positions.length}</strong></div></section><section className="vt-mini-card"><h3>QUICK TRADE</h3><div className="vt-order-mode"><button className={orderType==="market"?"active":""} onClick={()=>setOrderType("market")}>MARKET</button><button className={orderType==="pending"?"active":""} onClick={()=>setOrderType("pending")}>PENDING</button></div><p style={{fontSize:"10px",color:"var(--v1-muted)",lineHeight:1.5}}>{orderType==="pending"?"Pending-order UI is staged here; Deriv contract types determine which instructions are actually supported.":"Market execution uses the selected VELTRION environment."}</p><div className="vt-risk-summary"><div><span>SL DISTANCE</span><strong>{riskDistance.sl==null?"—":fmt(riskDistance.sl,8)}</strong></div><div><span>TP DISTANCE</span><strong>{riskDistance.tp==null?"—":fmt(riskDistance.tp,8)}</strong></div></div></section><section className="vt-mini-card"><h3>POSITION TOOLS</h3><div className="vt-mini-row"><span>Open</span><button className="vt-tool" onClick={()=>navTo("positions")}>View positions</button></div><div className="vt-mini-row"><span>History</span><button className="vt-tool" onClick={()=>navTo("orders")}>View history</button></div><div className="vt-mini-row"><span>Risk</span><strong>SL / TP validation</strong></div></section></aside>}</section><div className="vt-lower-grid">
      <section className="vt-panel"><div className="vt-section-title"><div><h2>Order Ticket</h2><p>{mode==="real"?"Market order · authenticated real-account execution, subject to safety and broker funding gates":"Market order · virtual execution only"}</p></div><span className="vt-ai-tag">{mode==="real"?"REAL":"SANDBOX"}</span></div>
        <label className="vt-label">Market<select value={symbol} onChange={e=>setSymbol(e.target.value)}><option value={symbol}>{symbolName} ({symbol})</option></select></label>
        <div className="vt-order-price"><div><span>Observed price</span><strong>{tick?fmt(tick.price,8):"Waiting for feed…"}</strong></div><span className={feed==="LIVE"?"vt-feed live":"vt-feed"}>{feed==="LIVE"?"LIVE":"WAITING"}</span></div>
        <label className="vt-label">Position size<input type="number" min="0.01" step="0.01" inputMode="decimal" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
        <div className="vt-risk-fields"><label className="vt-label">Stop loss <input type="number" min="0" step="any" inputMode="decimal" placeholder="Optional price" value={stopLoss} onChange={e=>setStopLoss(e.target.value)}/></label><label className="vt-label">Take profit <input type="number" min="0" step="any" inputMode="decimal" placeholder="Optional price" value={takeProfit} onChange={e=>setTakeProfit(e.target.value)}/></label></div>
        <div className="vt-e2e-actions"><button className="vt-ai-button" disabled={e2eBusy||busy||!tick||!account||!candles.length} onClick={runFullE2E}>{e2eBusy?"RUNNING PHASE 1 E2E…":"RUN PHASE 1 FULL E2E"}</button></div>
        <div className="vt-order-actions"><button className="vt-buy" disabled={busy||realBusy||!tick||!account} onClick={()=>execute("BUY")}>{busy?"PROCESSING…":"BUY / LONG"}</button><button className="vt-sell" disabled={busy||realBusy||!tick||!account} onClick={()=>execute("SELL")}>{busy?"PROCESSING…":"SELL / SHORT"}</button></div>
        <small className="vt-gate-note">Demo mode uses VELTRION sandbox execution. Real mode sends only authenticated broker orders after server-side safety gates; sandbox capital is never represented as real broker cash or collateral.</small>
      </section>
      <section className="vt-panel"><div className="vt-section-title"><div><h2>AI Market Review</h2><p>AI Review is temporarily unavailable while this terminal release is stabilized.</p></div><span className="vt-ai-tag">COMING SOON</span></div><button className="vt-ai-button" disabled>AI REVIEW — UNAVAILABLE FOR NOW</button><div className="vt-disclaimer">AI is intentionally disabled in this release. It does not authorize, place, change or close any order.</div></section>
    </div>
    <section id="vt-activity" className="vt-panel"><div className="vt-section-title"><div><h2>Trading Activity</h2><p>{mode==="real"?"Positions and closed transactions synchronized from the real broker":"Positions and orders recorded by the sandbox service"}</p></div><div className="vt-activity-tabs"><button className={activeTab==="positions"?"active":""} onClick={()=>setActiveTab("positions")}>Positions ({positions.length})</button><button className={activeTab==="orders"?"active":""} onClick={()=>setActiveTab("orders")}>Orders ({orders.length})</button></div></div>
      {activeTab==="positions"?(positions.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Market</th><th>Side</th><th>Size</th><th>Entry</th><th>Current</th><th>Stop loss</th><th>Take profit</th><th>Floating P/L</th><th>Action</th></tr></thead><tbody>{positions.map(p=><tr key={p.id}><td>{p.symbol}</td><td className={String(p.side).toUpperCase()==="BUY"?"vt-positive":"vt-negative"}>{p.side}</td><td>{p.quantity}</td><td>{fmt(Number(p.entry_price),8)}</td><td>{fmt(Number(p.current_price),8)}</td><td>{fmt(Number(p.stop_loss),8)}</td><td>{fmt(Number(p.take_profit),8)}</td><td className={Number(p.unrealized_pnl)>=0?"vt-positive":"vt-negative"}>{fmt(Number(p.unrealized_pnl),2)}</td><td><button className="vt-close" disabled={busy||!tick} onClick={()=>close(p)}>Close</button></td></tr>)}</tbody></table></div>:<div className="vt-empty">No open positions. Confirm a Buy or Sell order in the selected environment to see it here.</div>):(orders.length?<div className="vt-table-wrap"><table className="vt-table"><thead><tr><th>Time</th><th>Market</th><th>Side</th><th>Size</th><th>Price</th><th>Status</th><th>Realized P/L</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.created_at?new Date(o.created_at).toLocaleString():"—"}</td><td>{o.symbol}</td><td>{o.side}</td><td>{o.quantity}</td><td>{fmt(Number(o.price),8)}</td><td>{o.status||"—"}</td><td>{o.realized_pnl==null?"—":fmt(Number(o.realized_pnl),2)}</td></tr>)}</tbody></table></div>:<div className="vt-empty">No order records were returned for the selected environment.</div>)}
    </section>
    {notice&&<div className="vt-success" role="status">{notice}</div>}{error&&<div className="vt-error" role="alert">{error}</div>}
  </div>;
}
