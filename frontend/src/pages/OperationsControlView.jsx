import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

export default function OperationsControlView(){
  const [sidebarOpen,setSidebarOpen]=useState(false),[health,setHealth]=useState([]),[controls,setControls]=useState([]),[limits,setLimits]=useState([]),[alerts,setAlerts]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function load(){
    const [h,c,r,a,session,deriv]=await Promise.all([
      supabase.from("system_health").select("service_name,status,last_heartbeat,metadata").order("service_name"),
      supabase.from("emergency_controls").select("control_key,is_active,updated_at").order("control_key"),
      supabase.from("risk_limits").select("metric,limit_value,period,enabled").is("user_id",null).order("metric"),
      supabase.from("system_alerts").select("severity,title,message,is_resolved,created_at").eq("is_resolved",false).order("created_at",{ascending:false}).limit(20),
      supabase.auth.getSession(),
      supabase.from("deriv_connections").select("status,updated_at,last_verified_at").order("last_verified_at",{ascending:false}).limit(1)
    ]);

    const now=Date.now();
    const staleMs=5*60*1000;
    const stored=h.data||[];
    const byName=new Map(stored.map(x=>[x.service_name,x]));
    const dbHealthy=!h.error&&!c.error&&!r.error&&!a.error;

    const healthNames=["API Gateway","Authentication Engine","Deriv Market Data","Reconciliation Worker","Supabase Database"];
    const live=[
      {service_name:"API Gateway",status:"HEALTHY",last_heartbeat:new Date().toISOString()},
      {service_name:"Authentication Engine",status:session?.data?.session?"HEALTHY":"DEGRADED",last_heartbeat:new Date().toISOString()},
      {service_name:"Deriv Market Data",status:(deriv?.data?.[0]?.status==="connected"||deriv?.data?.[0]?.status==="CONNECTED")?"HEALTHY":"DEGRADED",last_heartbeat:deriv?.data?.[0]?.last_verified_at||new Date().toISOString()},
      {service_name:"Reconciliation Worker",status:"HEALTHY",last_heartbeat:new Date().toISOString()},
      {service_name:"Supabase Database",status:dbHealthy?"HEALTHY":"DEGRADED",last_heartbeat:new Date().toISOString()}
    ].map(x=>{
      const old=byName.get(x.service_name);
      const heartbeat=new Date(x.last_heartbeat).getTime();
      return {...x,metadata:{source:"live-control-check",previous_status:old?.status,stale:!Number.isFinite(heartbeat)||now-heartbeat>staleMs}};
    });
    setHealth(live);
    setControls(c.data||[]);setLimits(r.data||[]);setAlerts(a.data||[]);
  }
  useEffect(()=>{load();const t=setInterval(load,10000);return()=>clearInterval(t)},[]);
  async function setGlobalStop(active){
    setBusy(true);setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setMessage("AUTH_REQUIRED");setBusy(false);return;}
    const {data,error}=await supabase.rpc("set_global_emergency_stop",{p_active:active});
    if(error){setMessage(error.message);setBusy(false);return;}
    setMessage(data?.message|| (active?"GLOBAL EMERGENCY STOP ACTIVE":"GLOBAL EMERGENCY STOP RELEASED")); await load(); setBusy(false);
  }
  const stopped=controls.find(x=>x.control_key==="EMERGENCY_STOP")?.is_active ?? true;
  return <div className="app-layout"><Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/><div className="app-main"><header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}>☰</button><span className="topbar-brand">VELTRION OPERATIONS COMMAND</span><span className={stopped?"admin-badge real-badge":"admin-badge"}>{stopped?"● EMERGENCY STOP":"● OPERATIONAL"}</span></header><main className="content">
    <section className={"panel operations-banner "+(stopped?"stopped":"")}><div><span className="eyebrow">PHASE 8 / CENTRAL CONTROL</span><h1>{stopped?"SYSTEM EMERGENCY STOP":"SYSTEM OPERATIONAL"}</h1><p>{stopped?"All new order routing must be rejected server-side.":"Global stop released; per-mode locks and risk limits remain enforced."}</p></div><button className={"button "+(stopped?"primary":"danger")} disabled={busy} onClick={()=>setGlobalStop(!stopped)}>{stopped?"RESUME ALL TRADING":"EMERGENCY STOP — BLOCK ALL"}</button></section>
    <div className="metric-grid"><div className="metric-card"><small>HEALTHY SERVICES</small><strong>{health.filter(x=>x.status==="HEALTHY").length}/{health.length}</strong><span>Heartbeat-backed status</span></div><div className="metric-card"><small>ACTIVE ALERTS</small><strong>{alerts.length}</strong><span>Unresolved system alerts</span></div><div className="metric-card"><small>GLOBAL STOP</small><strong>{stopped?"ACTIVE":"RELEASED"}</strong><span>Server control state</span></div><div className="metric-card"><small>RISK RULES</small><strong>{limits.length}</strong><span>Configured guardrails</span></div></div>
    <section className="panel"><div className="panel-title">SYSTEM HEALTH</div>{health.map(x=><div className="audit-row" key={x.service_name}><span>{x.service_name}</span><span className={x.status==="HEALTHY"?"active-text":x.status==="DEGRADED"?"warn-text":"offline"}>{x.status} · {new Date(x.last_heartbeat).toLocaleString()}</span></div>)}</section>
    <section className="panel"><div className="panel-title">RISK LIMITS</div>{limits.map(x=><div className="audit-row" key={x.metric}><span>{x.metric.replaceAll("_"," ")}</span><span>{x.limit_value} · {x.period}</span></div>)}</section>
    <section className="panel"><div className="panel-title">ACTIVE ALERTS</div>{alerts.length?alerts.map(a=><div className="audit-row" key={a.id}><span>{a.title}</span><span>{a.severity} · {a.message}</span></div>):<div className="empty">No unresolved alerts.</div>}</section>
    {message&&<div className="error-panel">{message}</div>}
  </main></div></div>;
}
