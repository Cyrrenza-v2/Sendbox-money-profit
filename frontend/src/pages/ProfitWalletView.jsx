import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

const money = (v,currency="USD") => Number(v||0).toLocaleString("en-US",{style:"currency",currency});
export default function ProfitWalletView(){
  const [sidebarOpen,setSidebarOpen]=useState(false),[wallet,setWallet]=useState(null),[withdrawals,setWithdrawals]=useState([]),[error,setError]=useState("");
  async function load(){
    setError("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setError("AUTH_REQUIRED");return;}
    const {data:account}=await supabase.from("real_trading_accounts").select("id,currency").eq("user_id",user.id).maybeSingle();
    if(!account){setWallet(null);return;}
    const {data:w}=await supabase.from("real_profit_wallets").select("id,available_balance,reserved_balance,currency,updated_at").eq("account_id",account.id).maybeSingle();
    setWallet(w||null);
    if(w){const {data:rows}=await supabase.from("withdrawals").select("id,amount,status,destination,external_reference,created_at,completed_at").eq("wallet_id",w.id).order("created_at",{ascending:false}).limit(20);setWithdrawals(rows||[]);}
  }
  useEffect(()=>{load()},[]);
  const available=Number(wallet?.available_balance||0),reserved=Number(wallet?.reserved_balance||0);
  return <div className="app-layout"><Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/><div className="app-main"><header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}>☰</button><span className="topbar-brand">VELTRION PROFIT WALLET</span><span className="admin-badge">● SUPABASE</span></header><main className="content">
    <div className="page-heading"><div><span className="eyebrow">PHASE 7 / REAL PROFIT</span><h1>Profit Wallet</h1><p>Sandbox profit is permanently non-withdrawable. Only reconciled real-account profit is shown here.</p></div></div>
    <div className="metric-grid"><div className="metric-card"><small>REAL AVAILABLE</small><strong>{money(available,wallet?.currency)}</strong><span>Reconciled wallet balance</span></div><div className="metric-card"><small>RESERVED</small><strong>{money(reserved,wallet?.currency)}</strong><span>Pending withdrawal reservations</span></div><div className="metric-card"><small>WITHDRAWABLE</small><strong className="positive">{money(Math.max(0,available-reserved),wallet?.currency)}</strong><span>Available minus reservations</span></div><div className="metric-card"><small>SANDBOX WITHDRAWABLE</small><strong className="negative">$0.00</strong><span>Virtual funds never become cash</span></div></div>
    {error&&<div className="error-panel">{error}</div>}
    {!wallet&& !error && <div className="panel empty">No real profit wallet is provisioned for the authenticated account.</div>}
    <section className="panel"><div className="panel-title">WITHDRAWAL LIFECYCLE</div><div className="audit-row"><span>REQUESTED</span><span>→ PROCESSING → COMPLETED</span></div><div className="audit-row"><span>Exception states</span><span>FAILED / CANCELLED / REJECTED</span></div></section>
    <section className="panel"><div className="panel-title">WITHDRAWAL HISTORY</div>{withdrawals.length?withdrawals.map(w=><div className="audit-row" key={w.id}><span>{money(w.amount,wallet?.currency)} · {w.destination}</span><span>{w.status} · {new Date(w.created_at).toLocaleString()}</span></div>):<div className="empty">No withdrawals recorded.</div>}</section>
  </main></div></div>;
}
