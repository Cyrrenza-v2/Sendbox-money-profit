import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

const money=(n)=>Number.isFinite(Number(n))?"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):"—";
const statusOk=(s)=>["connected","active","ready","healthy"].includes(String(s||"").toLowerCase());

async function adminControl(active){
  const {data,error}=await supabase.functions.invoke("admin-control",{body:{active}});
  if(error) throw new Error(data?.error||error.message||"ADMIN_CONTROL_REQUEST_FAILED");
  return data;
}

export default function AdminPanel(){
  const [open,setOpen]=useState(false),[tab,setTab]=useState("overview"),[metrics,setMetrics]=useState({users:0,connections:0,volume:0,pnl:0}),[users,setUsers]=useState([]),[accounts,setAccounts]=useState([]),[logs,setLogs]=useState([]),[alerts,setAlerts]=useState([]),[stopped,setStopped]=useState(true),[search,setSearch]=useState(""),[busy,setBusy]=useState(false),[reason,setReason]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState("");

  async function load(){
    setError("");
    const [roles,connections,orders,audit,controls,alertsResult]=await Promise.all([
      supabase.from("user_roles").select("user_id,role").order("role"),
      supabase.from("mt5_connections").select("id,user_id,broker,server,login,environment,status,last_heartbeat_at,account_currency,metadata").order("last_heartbeat_at",{ascending:false}).limit(500),
      supabase.from("real_orders").select("id,user_id,symbol,side,quantity,entry_price,exit_price,realized_pnl,status,created_at,closed_at").order("created_at",{ascending:false}).limit(500),
      supabase.from("audit_logs").select("id,admin_id,event_type,resource_id,previous_state,new_state,result,timestamp").order("timestamp",{ascending:false}).limit(200),
      supabase.from("emergency_controls").select("control_key,is_active,updated_at").eq("control_key","EMERGENCY_STOP").maybeSingle(),
      supabase.from("system_alerts").select("id,severity,title,message,created_at,is_resolved").eq("is_resolved",false).order("created_at",{ascending:false}).limit(20)
    ]);
    const firstError=[roles,connections,orders,audit,controls,alertsResult].find(x=>x.error)?.error;
    if(firstError) throw firstError;
    const roleRows=roles.data||[],connRows=connections.data||[],orderRows=orders.data||[];
    setUsers(roleRows);setAccounts(connRows);
    const pnl=orderRows.reduce((s,x)=>s+Number(x.realized_pnl||0),0);
    const volume=orderRows.reduce((s,x)=>s+Math.abs(Number(x.quantity||0)),0);
    setLogs([...orderRows.map(x=>({...x,kind:"REAL TRADE"})),...(audit.data||[]).map(x=>({...x,kind:"AUDIT"}))].sort((a,b)=>new Date(b.created_at||b.timestamp)-new Date(a.created_at||a.timestamp)).slice(0,300));
    setAlerts(alertsResult.data||[]);setStopped(Boolean(controls.data?.is_active??true));
    setMetrics({users:new Set(roleRows.map(x=>x.user_id)).size,connections:connRows.filter(x=>statusOk(x.status)).length,volume,pnl});
  }
  useEffect(()=>{load().catch(e=>setError(e.message||"ADMIN_DATA_LOAD_FAILED"));const t=setInterval(()=>load().catch(()=>{}),10000);return()=>clearInterval(t)},[]);
  async function toggleStop(){
    if(!reason.trim()){setError("Enter an audit justification before changing the emergency stop.");return}
    setBusy(true);setError("");setMessage("");
    try{const next=!stopped;const data=await adminControl(next);setMessage(data?.message||(next?"GLOBAL EMERGENCY STOP ACTIVE":"GLOBAL EMERGENCY STOP RELEASED"));setReason("");await load()}catch(e){setError(e.message||"ADMIN_CONTROL_REQUEST_FAILED")}finally{setBusy(false)}
  }
  const filteredUsers=useMemo(()=>users.filter(x=>String(x.user_id).toLowerCase().includes(search.toLowerCase())||String(x.role).toLowerCase().includes(search.toLowerCase())),[users,search]);
  const tabs=[["overview","User Management"],["accounts","Connected MT5 / Deriv Accounts"],["logs","Global Trade Logs & Audit"]];
  return <div className="app-layout"><Sidebar isOpen={open} onClose={()=>setOpen(false)}/><div className="app-main">
    <header className="topbar"><button className="menu-button" onClick={()=>setOpen(true)} aria-label="Open menu">☰</button><span className="topbar-brand">VELTRION ADMIN SUITE</span><span className={stopped?"admin-badge real-badge":"admin-badge"}>● {stopped?"EMERGENCY STOP":"SYSTEM ONLINE"}</span></header>
    <main className="content">
      <section className="page-heading"><div><span className="eyebrow">INSTITUTIONAL GOVERNANCE & OPERATIONS</span><h1>Admin Control Center</h1><p>Backend-backed operational visibility. No synthetic users, balances, trades or P&amp;L are displayed.</p></div><div className="vt-header-actions"><button className={"button "+(stopped?"primary":"danger")} disabled={busy} onClick={toggleStop}>{busy?"PROCESSING…":stopped?"RESUME PLATFORM":"EMERGENCY KILL SWITCH"}</button></div></section>
      {error&&<div className="error-panel">{error}</div>}{message&&<div className="vt-success">{message}</div>}
      <section className="metric-grid"><div className="metric-card"><small>AUTHORIZED USER RECORDS</small><strong>{metrics.users.toLocaleString()}</strong><span>Derived from user_roles</span></div><div className="metric-card"><small>CONNECTED MT5 NODES</small><strong>{metrics.connections.toLocaleString()}</strong><span>Fresh/active bridge status</span></div><div className="metric-card"><small>RECORDED REAL VOLUME</small><strong>{metrics.volume.toLocaleString()}</strong><span>From real_orders</span></div><div className="metric-card"><small>REALIZED P&amp;L</small><strong className={metrics.pnl>=0?"active-text":"warn-text"}>{money(metrics.pnl)}</strong><span>Closed real orders only</span></div></section>
      <section className={"panel operations-banner "+(stopped?"stopped":"")}><div><span className="eyebrow">CENTRAL RISK CONTROL</span><h2>{stopped?"SYSTEM EMERGENCY STOP":"SYSTEM OPERATIONAL"}</h2><p>{stopped?"New order routing must be rejected server-side.":"Global stop is released; individual risk and production gates remain enforced."}</p></div><div className="field" style={{minWidth:260}}><label>Audit justification</label><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Incident / authorization / reason"/></div></section>
      <div className="tab-row">{tabs.map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</div>
      {tab==="overview"&&<section className="panel"><div className="panel-title">VERIFIED USER ROLE RECORDS</div><div className="field"><label>Search user ID or role</label><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search backend records"/></div><div className="table-wrap"><table className="table"><thead><tr><th>User ID</th><th>Role</th><th>MT5 Connections</th><th>Status</th></tr></thead><tbody>{filteredUsers.map(u=>{const count=accounts.filter(a=>a.user_id===u.user_id).length;return <tr key={u.user_id+u.role}><td>{u.user_id}</td><td>{u.role}</td><td>{count}</td><td><span className="pill"><span className="dot"></span>BACKEND RECORD</span></td></tr>})}{!filteredUsers.length&&<tr><td colSpan="4" className="empty">No matching authorized user-role records.</td></tr>}</tbody></table></div></section>}
      {tab==="accounts"&&<section className="panel"><div className="panel-title">CONNECTED MT5 / ACCOUNT TELEMETRY</div><div className="table-wrap"><table className="table"><thead><tr><th>Environment</th><th>Broker / Server</th><th>Login</th><th>Balance</th><th>Equity</th><th>Status</th><th>Heartbeat</th></tr></thead><tbody>{accounts.map(a=>{const m=a.metadata||{};const fresh=a.last_heartbeat_at&&Date.parse(a.last_heartbeat_at)>Date.now()-45000;return <tr key={a.id}><td>{String(a.environment||"unknown").toUpperCase()}</td><td>{a.broker||"—"} / {a.server||"—"}</td><td>{a.login||"—"}</td><td>{money(m.balance)}</td><td>{money(m.equity)}</td><td>{a.status||"—"}</td><td>{fresh?"FRESH":"STALE"} · {a.last_heartbeat_at?new Date(a.last_heartbeat_at).toLocaleString():"—"}</td></tr>})}{!accounts.length&&<tr><td colSpan="7" className="empty">No MT5 connection records are available.</td></tr>}</tbody></table></div></section>}
      {tab==="logs"&&<section className="panel"><div className="panel-title">GLOBAL TRADE LOGS & AUDIT STREAM</div>{alerts.length>0&&<div className="market-detail-note">Active alerts: {alerts.map(a=>a.title).join(" · ")}</div>}<div className="table-wrap"><table className="table"><thead><tr><th>Time</th><th>Type</th><th>Resource</th><th>Symbol / Event</th><th>Result / P&amp;L</th></tr></thead><tbody>{logs.map((x,i)=><tr key={(x.id||"row")+"-"+i}><td>{new Date(x.created_at||x.timestamp).toLocaleString()}</td><td>{x.kind}</td><td>{x.resource_id||x.id||"—"}</td><td>{x.symbol||x.event_type||"—"}</td><td>{x.realized_pnl!=null?money(x.realized_pnl):x.result||"RECORDED"}</td></tr>)}{!logs.length&&<tr><td colSpan="5" className="empty">No real trade or audit records available.</td></tr>}</tbody></table></div></section>}
      <section className="panel"><div className="panel-title">SAFETY BOUNDARY</div><p className="muted">This console does not fabricate balances, create trades in the browser, store MT5 passwords, or bypass the production real-trading gate. Emergency stop changes are sent to the server-side control and must be justified.</p></section>
    </main></div></div>;
}
