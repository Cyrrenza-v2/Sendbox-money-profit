import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import LiveMarketPanel from "../components/LiveMarketPanel";
const configBySection = {
 markets:{intro:"All currently active Deriv market instruments and live prices.",source:"Deriv live market feed"},
 positions:{intro:"Position records from the authenticated account.",source:"sandbox_positions"},
 orders:{intro:"Order records from the connected trading service.",source:"trading service"},
 history:{intro:"Historical activity from the connected trading service.",source:"trading service"},
 mt5:{intro:"MT5 connection and infrastructure state.",source:"mt5_connections"},
 sandbox:{intro:"Virtual account state and sandbox controls.",source:"sandbox_accounts"},
 real:{intro:"Real account configuration and account provisioning state. Live execution remains subject to server-side safeguards.",source:"real_trading_accounts / app_settings"},
 wallet:{intro:"Reconciled real-account profit wallet only. Sandbox funds are not withdrawable.",source:"real_profit_wallets / withdrawals"},
 analytics:{intro:"Performance metrics derived from recorded account activity.",source:"backend analytics"},
 operations:{intro:"Service health, emergency controls, risk limits, and active alerts.",source:"system_health / emergency_controls / risk_limits / system_alerts"},
 security:{intro:"Authenticated sessions and account-scoped audit events.",source:"user_sessions / audit_events"},
 settings:{intro:"Application configuration managed by the backend.",source:"app_settings"},
 alerts:{intro:"Recent system and operational alerts.",source:"audit_logs"}
};
export default function WorkspacePage({title,section}){
 const [state,setState]=useState({loading:true,error:"",data:null});
 const config=configBySection[section]||{intro:"Live account information from Supabase.",source:"Supabase"};
 useEffect(()=>{if(section==="markets"){setState({loading:false,error:"",data:null});return;}let alive=true;async function load(){setState({loading:true,error:"",data:null});try{
 let data=null,error=null;
 if(section==="positions"){const r=await supabase.from("sandbox_positions").select("*").order("updated_at",{ascending:false}).limit(50);data=r.data;error=r.error;}
 else {
  const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Your session has expired. Sign in again.");
  if(section==="mt5"){const r=await supabase.from("mt5_connections").select("status,server,last_heartbeat_at,environment").eq("user_id",user.id).maybeSingle();data=r.data;error=r.error;}
  else if(section==="sandbox"){const r=await supabase.from("sandbox_accounts").select("id,currency,initial_capital,available_capital,allocated_capital,withdrawable,status,created_at").eq("user_id",user.id).maybeSingle();data=r.data;error=r.error;}
  else if(section==="settings"){const r=await supabase.from("app_settings").select("environment,trading_mode,real_trading_enabled,updated_at").order("updated_at",{ascending:false}).limit(1).maybeSingle();data=r.data;error=r.error;}
  else if(section==="real"){const [account,settings,connection]=await Promise.all([
    supabase.from("real_trading_accounts").select("id,deriv_account_id,currency,is_active,emergency_stopped,balance,equity,max_stake,daily_loss_limit,created_at,updated_at").eq("user_id",user.id).maybeSingle(),
    supabase.from("app_settings").select("environment,trading_mode,real_trading_enabled,updated_at").order("updated_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("deriv_connections").select("status,deriv_loginid,currency,last_success_at,last_verified_at,last_error").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle()
  ]);if(account.error)throw account.error;if(settings.error)throw settings.error;if(connection.error)throw connection.error;data={account:account.data,configuration:settings.data,derivConnection:connection.data};}
  else if(section==="wallet"){const {data:account,error:accountError}=await supabase.from("real_trading_accounts").select("id,currency").eq("user_id",user.id).maybeSingle();if(accountError)throw accountError;if(!account){data=null;}else{const {data:wallet,error:walletError}=await supabase.from("real_profit_wallets").select("id,available_balance,reserved_balance,currency,updated_at").eq("account_id",account.id).maybeSingle();if(walletError)throw walletError;if(!wallet){data=null;}else{const {data:withdrawals,error:withdrawalsError}=await supabase.from("withdrawals").select("id,amount,status,destination_type,requested_at,completed_at").eq("wallet_id",wallet.id).order("requested_at",{ascending:false}).limit(20);if(withdrawalsError)throw withdrawalsError;data={wallet,withdrawals:withdrawals||[]};}}}
  else if(section==="security"){const [sessions,audit]=await Promise.all([
    supabase.from("user_sessions").select("id,status,last_seen_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20),
    supabase.from("audit_events").select("action,source,environment,result,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20)
  ]);if(sessions.error)throw sessions.error;if(audit.error)throw audit.error;data={sessions:sessions.data||[],auditEvents:audit.data||[]};}
  else if(section==="operations"){const [health,controls,limits,alerts]=await Promise.all([
    supabase.from("system_health").select("service_name,status,last_heartbeat,metadata").order("service_name"),
    supabase.from("emergency_controls").select("control_key,is_active,updated_at").order("control_key"),
    supabase.from("risk_limits").select("metric,limit_value,period,enabled").is("user_id",null).order("metric"),
    supabase.from("system_alerts").select("severity,title,message,is_resolved,created_at").eq("is_resolved",false).order("created_at",{ascending:false}).limit(20)
  ]);const errors=[health,controls,limits,alerts].filter(x=>x.error);if(errors.length)throw errors[0].error;data={health:health.data||[],emergencyControls:controls.data||[],riskLimits:limits.data||[],activeAlerts:alerts.data||[]};}
  else if(section==="alerts"){const r=await supabase.from("audit_logs").select("id,action,created_at,status,details").order("created_at",{ascending:false}).limit(20);data=r.data;error=r.error;}
  else if(section==="orders"||section==="history"||section==="analytics"){data=null;}
 }
 if(error)throw error;if(alive)setState({loading:false,error:"",data});
 }catch(e){if(alive)setState({loading:false,error:e?.message||"Unable to load backend data.",data:null});}}
 load();return()=>{alive=false};},[section]);
 if(section==="markets") return <div className="vel-page"><div className="vel-page-heading"><div><div className="vel-eyebrow">VELTRION / MARKET DATA</div><h1>{title}</h1><p>All currently active Deriv instruments with live public tick prices. This screen displays market data only and does not execute trades.</p></div><span className="vel-data-source">SOURCE · DERIV LIVE FEED</span></div><LiveMarketPanel /></div>;
 if(section==="real"&&!state.loading&&!state.error){
  const account=state.data?.account||null;
  const configuration=state.data?.configuration||null;
  const connection=state.data?.derivConnection||null;
  const connected=String(connection?.status||"").toLowerCase()==="connected";
  const tradingEnabled=configuration?.real_trading_enabled===true;
  return <div className="vel-page">
   <div className="vel-page-heading"><div><div className="vel-eyebrow">VELTRION / REAL ACCOUNT</div><h1>{title}</h1><p>Real Deriv connection status and VELTRION account provisioning are shown separately. No sandbox funds are represented as real funds.</p></div><span className="vel-data-source">SOURCE · DERIV CONNECTION + REAL ACCOUNT LEDGER</span></div>
   <div className="vel-panel">
    <div className="vel-panel-title">REAL ACCOUNT PROVISIONING <span>{account?"ACCOUNT RECORD FOUND":"NOT PROVISIONED"}</span></div>
    {!account?<div className="vel-state"><div className="vel-state-mark">—</div><h3>No VELTRION real account has been provisioned</h3><p>Your Deriv authorization and a VELTRION real-account ledger record are separate things. A real account record is not present, so this screen cannot show a VELTRION real balance or equity.</p></div>:<><div className="vel-data-grid">
     <div className="vel-data-field"><span>Deriv account ID</span><strong>{account.deriv_account_id||"Unavailable"}</strong></div>
     <div className="vel-data-field"><span>Currency</span><strong>{account.currency||"Unavailable"}</strong></div>
     <div className="vel-data-field"><span>Recorded balance</span><strong>{account.balance==null?"Unavailable":(account.currency||"")+" "+Number(account.balance).toFixed(2)}</strong></div>
     <div className="vel-data-field"><span>Recorded equity snapshot</span><strong>{account.equity==null?"Unavailable":(account.currency||"")+" "+Number(account.equity).toFixed(2)}</strong></div>
     <div className="vel-data-field"><span>Snapshot updated</span><strong>{account.updated_at?new Date(account.updated_at).toLocaleString():"Unavailable"}</strong></div>
     <div className="vel-data-field"><span>Account active</span><strong>{account.is_active?"Yes":"No"}</strong></div>
     <div className="vel-data-field"><span>Emergency stop</span><strong>{account.emergency_stopped?"ON":"OFF"}</strong></div>
    </div><p>This record mirrors the balance snapshot returned by Deriv during account verification; it is not a continuously refreshed live balance. Check the snapshot timestamp before relying on it.</p></>}
   </div>
   <div className="vel-panel">
    <div className="vel-panel-title">DERIV OAUTH CONNECTION <span>{connected?"CONNECTED":"NOT CONNECTED"}</span></div>
    <div className="vel-data-grid">
     <div className="vel-data-field"><span>Connection status</span><strong>{connection?.status||"Unavailable"}</strong></div>
     <div className="vel-data-field"><span>Deriv login ID</span><strong>{connection?.deriv_loginid||"Unavailable"}</strong></div>
     <div className="vel-data-field"><span>Deriv currency</span><strong>{connection?.currency||"Not provided by connection metadata"}</strong></div>
     <div className="vel-data-field"><span>Last verified</span><strong>{connection?.last_verified_at?new Date(connection.last_verified_at).toLocaleString():"Unavailable"}</strong></div>
    </div>
    {connection?.last_error&&<p className="vel-error">{connection.last_error}</p>}
    <p>OAuth connection confirms authorization metadata only; it does not itself create a VELTRION real-account ledger record or provide a live balance.</p>
   </div>
   <div className="vel-panel">
    <div className="vel-panel-title">TRADING SAFETY CONFIGURATION <span>{tradingEnabled?"ENABLED IN SETTINGS":"REAL TRADING DISABLED"}</span></div>
    <div className="vel-data-grid">
     <div className="vel-data-field"><span>Environment</span><strong>{configuration?.environment||"Unavailable"}</strong></div>
     <div className="vel-data-field"><span>Trading mode</span><strong>{configuration?.trading_mode||"Unavailable"}</strong></div>
     <div className="vel-data-field"><span>Real trading setting</span><strong>{tradingEnabled?"Enabled":"Disabled"}</strong></div>
     <div className="vel-data-field"><span>Configuration updated</span><strong>{configuration?.updated_at?new Date(configuration.updated_at).toLocaleString():"Unavailable"}</strong></div>
    </div>
    <p>Real-money execution remains frozen. This screen does not enable trading or create an account automatically.</p>
   </div>
  </div>;
 }
 const rows=Array.isArray(state.data)?state.data:state.data&&typeof state.data==="object"?Object.entries(state.data).map(([field,value])=>({field,value})):[];
 return <div className="vel-page"><div className="vel-page-heading"><div><div className="vel-eyebrow">VELTRION / OPERATIONS PLATFORM</div><h1>{title}</h1><p>{config.intro}</p></div><span className="vel-data-source">SOURCE · {config.source}</span></div>
 {state.loading?<div className="vel-panel vel-state">Loading authorized backend data…</div>:state.error?<div className="vel-panel vel-error"><b>Data unavailable</b><p>{state.error}</p><small>No sample values are being shown.</small></div>:!state.data&&section==="wallet"?<div className="vel-panel vel-state"><div className="vel-state-mark">—</div><h3>No real profit wallet provisioned yet</h3><p>No real profit wallet or withdrawal records are currently available for this account. No balance has been fabricated or credited. A wallet should only be funded after verified real-account profit is reconciled; sandbox funds are never withdrawable.</p></div>:!state.data||(Array.isArray(state.data)&&state.data.length===0)?<div className="vel-panel vel-state"><div className="vel-state-mark">—</div><h3>No records returned</h3><p>The connected backend did not return data for this view. This is not a fabricated zero balance.</p></div>:<div className="vel-panel"><div className="vel-panel-title">BACKEND RESPONSE <span>{rows.length} FIELD{rows.length===1?"":"S"}</span></div>
 {Array.isArray(state.data)?<div className="vel-table-wrap"><table className="vel-table"><thead><tr>{Object.keys(state.data[0]||{}).slice(0,6).map(k=><th key={k}>{k.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{state.data.map((row,i)=><tr key={row.id||row.symbol||i}>{Object.keys(state.data[0]||{}).slice(0,6).map(k=><td key={k}>{row[k]==null?"—":typeof row[k]==="object"?JSON.stringify(row[k]):String(row[k])}</td>)}</tr>)}</tbody></table></div>:<div className="vel-data-grid">{rows.map(row=><div className="vel-data-field" key={row.field}><span>{row.field.replaceAll("_"," ")}</span><strong>{row.value==null||row.value===""?"Unavailable":Array.isArray(row.value)?row.value.length+" records":typeof row.value==="object"?JSON.stringify(row.value):String(row.value)}</strong></div>)}</div>}</div>}
 </div>;
}
