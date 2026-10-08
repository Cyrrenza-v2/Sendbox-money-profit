import {useEffect,useState} from "react";
import Sidebar from "../components/Sidebar";
import {supabase} from "../supabaseClient";

const money=(v,c="USD")=>Number(v||0).toLocaleString("en-US",{style:"currency",currency:c});
async function fn(name,body){const {data,error}=await supabase.functions.invoke(name,{body});if(error)throw new Error(data?.error||error.message||"REQUEST_FAILED");if(!data?.ok)throw new Error(data?.error||"REQUEST_FAILED");return data.data}

export default function ProfitWalletView(){
 const [sidebarOpen,setSidebarOpen]=useState(false),[wallet,setWallet]=useState(null),[withdrawals,setWithdrawals]=useState([]),[derivWallets,setDerivWallets]=useState([]),[selectedDerivWallet,setSelectedDerivWallet]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState(""),[amount,setAmount]=useState(""),[destination,setDestination]=useState(""),[agentId,setAgentId]=useState(""),[verificationCode,setVerificationCode]=useState(""),[withdrawalId,setWithdrawalId]=useState(""),[busy,setBusy]=useState(false);

 async function load(){
  setError("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setError("AUTH_REQUIRED");return}
  const {data:account,error:ae}=await supabase.from("real_trading_accounts").select("id,currency").eq("user_id",user.id).maybeSingle();
  if(ae)throw ae;
  if(!account){setWallet(null);return}
  const {data:w,error:we}=await supabase.from("real_profit_wallets").select("id,available_balance,reserved_balance,currency,updated_at").eq("account_id",account.id).maybeSingle();
  if(we)throw we;
  setWallet(w||null);
  if(w){
   const {data:rows}=await supabase.from("withdrawals").select("id,amount,status,destination_type,provider_reference,requested_at,completed_at").eq("wallet_id",w.id).order("requested_at",{ascending:false}).limit(20);
   setWithdrawals(rows||[]);
  }
  try{
   const d=await fn("wallet-service",{operation:"wallets",currency:account.currency||"USD"});
   const rows=d?.wallets||[];setDerivWallets(rows);
   if(!selectedDerivWallet&&rows.length===1)setSelectedDerivWallet(rows[0].wallet_id||rows[0].id||"");
  }catch(e){setError(e.message||"DERIV_WALLET_LOAD_FAILED")}
 }
 useEffect(()=>{load()},[]);

 const available=Number(wallet?.available_balance||0),reserved=Number(wallet?.reserved_balance||0),withdrawable=Math.max(0,available-reserved);

 async function requestInternal(){
  setBusy(true);setError("");setMessage("");
  try{
   const value=Number(amount);
   if(!wallet||!Number.isFinite(value)||value<=0||value>withdrawable||!destination.trim())throw new Error("INVALID_WITHDRAWAL_REQUEST");
   if(!selectedDerivWallet)throw new Error("DERIV_WALLET_REQUIRED");
   const result=await fn("withdrawal-service",{operation:"request",wallet_id:wallet.id,amount:value,destination:destination.trim(),deriv_wallet_id:selectedDerivWallet,idempotency_key:crypto.randomUUID(),platform_name:"options"});
   setWithdrawalId(String(result?.withdrawalId||""));setMessage("Profit withdrawal reserved. The next step is Deriv verification and provider settlement.");
   setAmount("");setDestination("");await load();
  }catch(e){setError(e.message||"WITHDRAWAL_REQUEST_FAILED")}finally{setBusy(false)}
 }

 async function requestCode(){
  setBusy(true);setError("");setMessage("");
  try{
   if(!withdrawalId||!agentId)throw new Error("WITHDRAWAL_ID_AND_AGENT_REQUIRED");
   await fn("withdrawal-service",{operation:"verification_code",withdrawal_id:withdrawalId,agent_id:agentId});
   setMessage("Deriv verification code requested. Check the contact method registered with Deriv.");
  }catch(e){setError(e.message||"DERIV_VERIFICATION_FAILED")}finally{setBusy(false)}
 }

 async function withdrawDeriv(){
  setBusy(true);setError("");setMessage("");
  try{
   if(!withdrawalId||!agentId||!/^\d{6}$/.test(verificationCode))throw new Error("WITHDRAWAL_EXECUTION_FIELDS_REQUIRED");
   const result=await fn("withdrawal-service",{operation:"execute",withdrawal_id:withdrawalId,agent_id:agentId,verification_code:verificationCode,deriv_wallet_id:selectedDerivWallet});
   setMessage(result?.status==="completed"?"Profit withdrawal completed.":"Profit withdrawal submitted: "+(result?.status||"processing")+".");
   setVerificationCode("");await load();
  }catch(e){setError(e.message||"DERIV_WITHDRAWAL_FAILED")}finally{setBusy(false)}
 }

 async function refreshStatus(){
  if(!withdrawalId)return;
  setBusy(true);setError("");
  try{const result=await fn("withdrawal-service",{operation:"status",withdrawal_id:withdrawalId});setMessage("Withdrawal status: "+(result?.status||"unknown")+".");await load()}catch(e){setError(e.message||"WITHDRAWAL_STATUS_FAILED")}finally{setBusy(false)}
 }

 return <div className="app-layout"><Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/><div className="app-main"><header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}>☰</button><span className="topbar-brand">VELTRION PROFIT WALLET</span><span className="admin-badge">● REAL MONEY</span></header><main className="content">
 <div className="page-heading"><div><span className="eyebrow">REAL MONEY CENTER</span><h1>Profit Wallet</h1><p>Verified realized Deriv profit is reconciled separately from sandbox funds and the live trading balance.</p></div></div>
 {error&&<div className="error-panel">{error}</div>}{message&&<div className="vt-success">{message}</div>}
 <div className="metric-grid"><div className="metric-card"><small>REAL PROFIT AVAILABLE</small><strong>{money(available,wallet?.currency)}</strong><span>Reconciled internal profit</span></div><div className="metric-card"><small>RESERVED</small><strong>{money(reserved,wallet?.currency)}</strong><span>Pending withdrawal requests</span></div><div className="metric-card"><small>DERIV WALLETS</small><strong>{derivWallets.length}</strong><span>Authenticated provider wallets</span></div><div className="metric-card"><small>SANDBOX</small><strong>$0.00</strong><span>Virtual funds cannot become cash</span></div></div>
 <section className="panel"><div className="panel-title">DERIV WALLET</div>{derivWallets.length?<><label>Wallet used for profit repatriation<select value={selectedDerivWallet} onChange={e=>setSelectedDerivWallet(e.target.value)}><option value="">Select Deriv wallet</option>{derivWallets.map(w=><option key={w.wallet_id||w.id} value={w.wallet_id||w.id}>{w.wallet_id||w.id} · {w.type||"wallet"}</option>)}</select></label>{derivWallets.map(w=><div className="audit-row" key={w.wallet_id||w.id}><span>{w.type||"wallet"}</span><b>{w.balances?.[wallet?.currency||"USD"]?.balance??w.balance??"—"} {wallet?.currency||"USD"}</b></div>)}</>:<div className="empty">No Deriv wallet data. Reconnect OAuth with payment scope.</div>}</section>
 <section className="panel"><div className="panel-title">PROFIT WITHDRAWAL REQUEST</div>{wallet?<><div className="real-grid"><label>Amount ({wallet.currency})<input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="0.01" step="0.01" max={withdrawable}/></label><label>Authorized destination reference<input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Authorized settlement reference"/></label></div><button className="button primary full" onClick={requestInternal} disabled={busy||withdrawable<=0||!selectedDerivWallet}>{busy?"PROCESSING…":"RESERVE PROFIT WITHDRAWAL"}</button></>:<div className="empty">Real profit wallet is not provisioned yet.</div>}</section>
 <section className="panel"><div className="panel-title">DERIV PAYMENT-AGENT SETTLEMENT</div><p>The backend first validates and repatriates the reserved amount from the Deriv trading platform to the selected Deriv wallet, then submits the payment-agent withdrawal. Deriv requires the payment scope and a one-time verification code.</p><div className="real-grid"><label>Withdrawal ID<input value={withdrawalId} onChange={e=>setWithdrawalId(e.target.value)} placeholder="Created by the reservation step"/></label><label>Payment-agent ID<input value={agentId} onChange={e=>setAgentId(e.target.value)} placeholder="Agent ID"/></label><label>Verification code<input value={verificationCode} onChange={e=>setVerificationCode(e.target.value)} inputMode="numeric" maxLength="6" placeholder="6 digits"/></label></div><div className="real-actions"><button className="button" onClick={requestCode} disabled={busy||!withdrawalId||!agentId}>REQUEST VERIFICATION CODE</button><button className="button danger" onClick={withdrawDeriv} disabled={busy||!withdrawalId||!agentId||!verificationCode}>SUBMIT PROFIT WITHDRAWAL</button><button className="button" onClick={refreshStatus} disabled={busy||!withdrawalId}>CHECK STATUS</button></div></section>
 <section className="panel"><div className="panel-title">WITHDRAWAL HISTORY</div>{withdrawals.length?withdrawals.map(w=><div className="audit-row" key={w.id}><span>{money(w.amount,wallet?.currency)} · {w.destination_type||"AUTHORIZED ROUTE"}</span><span>{String(w.status).toUpperCase()} · {new Date(w.requested_at).toLocaleString()}</span></div>):<div className="empty">No withdrawal records.</div>}</section>
 </main></div></div>
}
