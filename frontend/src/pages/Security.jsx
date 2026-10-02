import {useEffect,useState} from "react";
import Sidebar from "../components/Sidebar";
import {supabase} from "../supabaseClient";
export default function Security(){
 const [sidebarOpen,setSidebarOpen]=useState(false),[sessions,setSessions]=useState([]),[logs,setLogs]=useState([]),[error,setError]=useState("");
 async function fetchSecurityData(){
  setError("");
  try{
   const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("AUTH_REQUIRED");
   const [sessionResult,auditResult]=await Promise.all([
    supabase.from("user_sessions").select("id,status,last_seen_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20),
    supabase.from("audit_events").select("action,source,environment,result,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20)
   ]);
   if(sessionResult.error)throw sessionResult.error;if(auditResult.error)throw auditResult.error;
   setSessions(sessionResult.data||[]);setLogs(auditResult.data||[]);
  }catch(err){setError(err?.message||"Unable to load security records.");}
 }
 useEffect(()=>{fetchSecurityData();},[]);
 async function terminateOtherSessions(){
  const {data:{user}}=await supabase.auth.getUser();if(!user)return;
  const {error:updateError}=await supabase.from("user_sessions").update({status:"terminated"}).eq("user_id",user.id);
  if(updateError){setError(updateError.message);return;}await fetchSecurityData();
 }
 return <div className="app-layout"><Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/><div className="app-main">
  <header className="topbar"><button className="menu-button" onClick={()=>setSidebarOpen(true)}>☰</button><span className="topbar-brand">SECURITY &amp; AUDIT</span><span className="admin-badge">● ADMIN</span></header>
  <main className="content"><section className="page-heading"><div><span className="eyebrow">SECURITY / ACCESS CONTROL</span><h1>Profile &amp; Audit Log</h1><p>Authenticated session and audit visibility.</p></div></section>
  {error&&<div className="error-panel">{error}</div>}
  <div className="panel"><div className="panel-title">CURRENT SESSION</div><p className="active-text">Authenticated browser session</p><button className="button danger" onClick={terminateOtherSessions}>SIGN OUT OTHER SESSIONS</button></div>
  <div className="panel"><div className="panel-title">ACTIVE SESSIONS</div>{sessions.length?sessions.map(s=><div className="audit-row" key={s.id}><span>{s.status}</span><span>{s.last_seen_at?new Date(s.last_seen_at).toLocaleString():new Date(s.created_at).toLocaleString()}</span></div>):<div className="empty">No session records found.</div>}</div>
  <div className="panel"><div className="panel-title">AUDIT LOG</div>{logs.length?logs.map((log,i)=><div className="audit-row" key={`${log.created_at}-${i}`}><span>{log.action}</span><span>{log.result||"RECORDED"} · {new Date(log.created_at).toLocaleString()}</span></div>):<div className="empty">No audit events recorded for this account.</div>}</div>
 </main></div></div>;
}
