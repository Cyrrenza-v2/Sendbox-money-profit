import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import LiveMarketPanel from "../components/LiveMarketPanel";

export default function MarketHub(){
  const navigate=useNavigate();
  const [symbol,setSymbol]=useState("1HZ100V");
  const [summary,setSummary]=useState({demo:null,real:null});
  useEffect(()=>{let alive=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;const [d,r]=await Promise.all([
    supabase.from("sandbox_accounts").select("currency,available_capital,status").eq("user_id",user.id).eq("sandbox_type","demo").maybeSingle(),
    supabase.from("real_trading_accounts").select("currency,balance,is_active,emergency_stopped").eq("user_id",user.id).maybeSingle()
  ]);if(alive)setSummary({demo:d.data||null,real:r.data||null});})();return()=>{alive=false}},[]);
  const open=(mode)=>navigate("/app/trading/terminal?mode="+mode+"&symbol="+encodeURIComponent(symbol));
  const demoValue=summary.demo?(summary.demo.currency||"USD")+" "+Number(summary.demo.available_capital||0).toLocaleString("en-US",{minimumFractionDigits:2}):"Loading…";
  const realValue=summary.real?(summary.real.currency||"USD")+" "+Number(summary.real.balance||0).toLocaleString("en-US",{minimumFractionDigits:2}):"Loading…";
  return <div className="v1-page">
    <div className="v1-heading"><div><span className="v1-eyebrow">VELTRION / MARKET WATCH</span><h1>Markets</h1><p>Select a market first. Trading opens as a secondary screen in the unified MT5-style terminal.</p></div><span className="v1-source">DERIV LIVE DATA</span></div>
    <div className="v1-market-accounts">
      <div><span>DEMO</span><strong>{demoValue}</strong><small>Virtual / sandbox funds</small></div>
      <div><span>REAL LIVE</span><strong>{realValue}</strong><small>{summary.real?.emergency_stopped?"Emergency stopped":"Broker balance · execution gated"}</small></div>
    </div>
    <LiveMarketPanel selectedSymbol={symbol} onSymbolChange={setSymbol} onOpenTerminal={setSymbol}/>
    <section className="v1-trade-gateway">
      <div><span className="v1-eyebrow">SELECTED MARKET</span><h2>{symbol||"Select a market"}</h2><p>Open the same terminal experience in the environment you choose. Demo and Real remain isolated at the backend.</p></div>
      <div className="v1-trade-actions">
        <button className="v1-demo-button" onClick={()=>open("demo")} disabled={!symbol}>DEMO TRADE <small>Sandbox execution</small></button>
        <button className="v1-real-button" onClick={()=>open("real")} disabled={!symbol}>REAL LIVE TRADE <small>Broker account · safety gated</small></button>
      </div>
    </section>
  </div>;
}