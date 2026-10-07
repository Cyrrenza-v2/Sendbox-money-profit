import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
const money=(value,currency="USD")=>value==null||!Number.isFinite(Number(value))?"Unavailable":Number(value).toLocaleString("en-US",{style:"currency",currency,minimumFractionDigits:2});
const display=value=>value==null||value===""?"Unavailable":String(value);
async function fetchOverview(){
 const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("AUTH_REQUIRED");
 const [demoQ,realQ,walletQ,accountsQ]=await Promise.all([
  supabase.from("sandbox_accounts").select("id,currency,initial_capital,available_capital,allocated_capital,withdrawable,status,created_at,sandbox_type").eq("user_id",user.id).eq("sandbox_type","demo").maybeSingle(),
  supabase.from("real_trading_accounts").select("id,deriv_account_id,currency,balance,equity,is_active,emergency_stopped,max_stake,daily_loss_limit,updated_at").eq("user_id",user.id).maybeSingle(),
  supabase.from("real_profit_wallets").select("id,account_id,available_balance,reserved_balance,currency,updated_at").maybeSingle(),
  supabase.from("deriv_accounts").select("deriv_account_id,account_type,currency,status,last_synced_at").eq("user_id",user.id).order("last_synced_at",{ascending:false}).limit(10)
 ]);
 for(const q of [demoQ,realQ,walletQ,accountsQ]) if(q.error) throw q.error;
 const accounts=accountsQ.data||[]; return {demo:demoQ.data,real:realQ.data,realDeriv:accounts.find(a=>a.account_type==="real")||null,demoDeriv:accounts.find(a=>a.account_type==="demo")||null,wallet:walletQ.data||null};
}
export default function Home(){
 const navigate=useNavigate(); const [state,setState]=useState({loading:true,error:"",data:null});
 const load=useCallback(async()=>{setState({loading:true,error:"",data:null});try{setState({loading:false,error:"",data:await fetchOverview()})}catch(e){setState({loading:false,error:e?.message||"Unable to retrieve account overview.",data:null})}},[]);
 useEffect(()=>{load()},[load]);
 const data=state.data,demo=data?.demo||{},real=data?.real||{},realDeriv=data?.realDeriv||{},demoDeriv=data?.demoDeriv||{},wallet=data?.wallet||{},currency=real.currency||wallet.currency||demo.currency||"USD";
 const realGate=real.is_active&&!real.emergency_stopped?"READY":"LOCKED";
 return <div className="vel-page vel-home-page"><div className="vel-page-heading"><div><div className="vel-eyebrow">VELTRION / HOME</div><h1>Account & Trading Overview</h1><p>Verify the Demo account, Real account and Profit Wallet from one place.</p></div><span className="vel-data-source">LIVE DATA · SUPABASE</span></div>
 {state.loading?<div className="vel-panel vel-state">Loading Demo, Real Account and Profit Wallet…</div>:state.error?<div className="vel-panel vel-error"><b>Account overview unavailable</b><p>{state.error}</p><button className="vel-button" onClick={load}>Retry connection</button></div>:<>
 <div className="vel-metric-grid"><Metric label="DEMO ACCOUNT" value={money(demo.available_capital,currency)} detail={demo.status||"Virtual account"}/><Metric label="REAL ACCOUNT" value={money(real.balance,currency)} detail={realDeriv?.deriv_account_id||real.deriv_account_id||"Real account ID unavailable"}/><Metric label="PROFIT WALLET" value={money(Math.max(0,Number(wallet.available_balance||0)-Number(wallet.reserved_balance||0)),currency)} detail="Verified realized real profit only"/><Metric label="REAL EXECUTION" value={realGate} detail={real.emergency_stopped?"Emergency stop active":"Server safety gates apply"}/></div>
 <section className="vel-home-primary">
 <button className="vel-home-primary-card" onClick={()=>navigate("/app/deriv/account")}><span className="home-card-kicker">DEMO</span><strong>Demo Account</strong><small>{demoDeriv?"Connected · "+demoDeriv.deriv_account_id:"Not verified"}</small><b>Verify Demo →</b></button>
 <button className="vel-home-primary-card" onClick={()=>navigate("/app/real/account")}><span className="home-card-kicker">REAL</span><strong>Live Account</strong><small>{realDeriv?"Connected · "+realDeriv.deriv_account_id:"Not verified"}</small><b>Verify Live Account →</b></button>
 <button className="vel-home-primary-card" onClick={()=>navigate("/profit-wallet")}><span className="home-card-kicker">MONEY</span><strong>Profit Wallet</strong><small>{money(wallet.available_balance,currency)} available · {money(wallet.reserved_balance,currency)} reserved</small><b>Open Profit Wallet →</b></button>
 <button className="vel-home-primary-card" onClick={()=>navigate("/app/trading/terminal")}><span className="home-card-kicker">TRADING</span><strong>Demo Terminal</strong><small>Live market data with virtual/sandbox execution only.</small><b>Open Demo Terminal →</b></button>
 </section>
 <div className="vel-home-columns"><section className="vel-panel"><div className="vel-panel-title">ACCOUNT CONNECTIONS <span>VERIFICATION</span></div><StatusRow label="Demo Deriv account" value={demoDeriv?"CONNECTED · "+demoDeriv.deriv_account_id:"NOT VERIFIED"}/><StatusRow label="Real Deriv account" value={realDeriv?"CONNECTED · "+realDeriv.deriv_account_id:"NOT VERIFIED"}/><StatusRow label="Real execution gate" value={realGate}/><StatusRow label="Profit wallet" value={wallet?.id?"CONNECTED · USD":"NOT INITIALIZED"}/></section>
 <section className="vel-panel"><div className="vel-panel-title">CAPITAL SEPARATION <span>IMPORTANT</span></div><div className="vel-market-row"><div><b>Demo / Sendbox Money</b><small>Virtual ledger only · never treated as real cash</small></div><strong>{money(demo.available_capital,currency)}</strong></div><div className="vel-market-row"><div><b>Real Deriv Balance</b><small>Actual broker funds</small></div><strong>{money(real.balance,currency)}</strong></div><div className="vel-market-row"><div><b>Real Profit Wallet</b><small>Only verified realized real profit</small></div><strong>{money(wallet.available_balance,currency)}</strong></div></section></div>
 <div className="vel-footnote">Demo, Real Account and Profit Wallet are separate ledgers. Sandbox results can never be credited to the real Profit Wallet. Real execution remains server-gated.</div>
 </>}</div>;
}
function Metric({label,value,detail}){return <div className="vel-metric-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;}
function StatusRow({label,value}){const okay=/connected|ready/i.test(value)&&!/not verified|locked/i.test(value);return <div className="vel-status-row"><span>{label}</span><b className={okay?"is-good":"is-neutral"}><i/>{value}</b></div>;}