import {useEffect,useState} from "react";
import {supabase} from "../supabaseClient";
import Sidebar from "../components/Sidebar";

const deviceLabel=ua=>/Mobi|Android|iPhone|iPad/i.test(ua||"")?"Mobile / Tablet":"Desktop / Laptop";

export default function Security(){
  const [open,setOpen]=useState(false),[sessions,setSessions]=useState([]),[roles,setRoles]=useState([]),[logs,setLogs]=useState([]),[busy,setBusy]=useState(false);

  useEffect(()=>{
    let mounted=true;
    let channel;
    let timer;
    const load=async()=>{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session||!mounted)return;
      const uid=session.user.id;
      const [s,r,l]=await Promise.all([
        supabase.from("user_sessions").select("id,status,last_seen_at,last_active_at,created_at,revoked_at,device_info,browser_info").eq("user_id",uid).order("created_at",{ascending:false}).limit(20),
        supabase.from("user_roles").select("role,created_at").eq("user_id",uid),
        supabase.from("audit_logs").select("action,status,created_at").order("created_at",{ascending:false}).limit(10)
      ]);
      if(!mounted)return;
      setSessions(s.data||[]); setRoles(r.data||[]); setLogs(l.data||[]);
      channel=supabase.channel("veltrion-device-sessions")
        .on("postgres_changes",{event:"*",schema:"public",table:"user_sessions",filter:"user_id=eq."+uid},payload=>{
          if(payload.eventType==="DELETE")setSessions(prev=>prev.filter(x=>x.id!==payload.old.id));
          else if(payload.new?.id)setSessions(prev=>[payload.new,...prev.filter(x=>x.id!==payload.new.id)].slice(0,20));
        }).subscribe();
    };
    load();
    timer=setInterval(load,10000);
    return()=>{mounted=false;clearInterval(timer);if(channel)supabase.removeChannel(channel)};
  },[]);

  const terminateOtherSessions=async()=>{
    setBusy(true);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session)throw new Error("No active authentication session.");
      const ua=navigator.userAgent;
      const {error}=await supabase.from("user_sessions").update({status:"REVOKED",revoked_at:new Date().toISOString()}).eq("user_id",session.user.id).neq("device_info",ua);
      if(error)throw error;
      setSessions(prev=>prev.map(s=>s.device_info===ua?s:{...s,status:"REVOKED",revoked_at:new Date().toISOString()}));
    }catch(err){alert("Unable to revoke other devices: "+err.message)}
    finally{setBusy(false)}
  };

  return <div>
    <Sidebar open={open} onClose={()=>setOpen(false)}/>
    <main className="main">
      <header><button className="menu" onClick={()=>setOpen(true)}>☰</button><b>SECURITY & DEVICES</b></header>
      <section className="content">
        <div className="card">
          <h3>YOUR DEVICES & SESSIONS</h3>
          <p className="muted">Monitor active access across phones, tablets and desktops. Session status refreshes automatically.</p>
          <div className="session-list">
            {sessions.map((s,index)=><div className="session-card" key={s.id}>
              <div><strong>{deviceLabel(s.device_info)}</strong><div className="device-meta">{s.device_info||"Device information unavailable"}</div></div>
              <div className={s.status==="ACTIVE"?"session-active":"session-revoked"}>{index===0&&s.status==="ACTIVE"?"● CURRENT SESSION":"○ "+s.status}</div>
              <small className="muted">Last active: {new Date(s.last_active_at||s.last_seen_at||s.created_at).toLocaleString()}</small>
            </div>)}
            {!sessions.length&&<p className="muted">No device session records.</p>}
          </div>
          <button className="danger" disabled={busy} onClick={terminateOtherSessions}>{busy?"REVoking…":"SIGN OUT OTHER DEVICES"}</button>
        </div>
        <div className="card">
          <h3>AUTHORIZED ROLE</h3>
          {roles.map(x=><div className="row" key={x.role}><b>{String(x.role).toUpperCase()}</b><span>ACTIVE</span></div>)}
        </div>
        <div className="card">
          <h3>SYSTEM AUDIT TRAIL</h3>
          {logs.map((log,i)=><div className="row" key={i}><span>{new Date(log.created_at).toLocaleString()}</span><span>{log.action||"—"}</span><span>{log.status||"—"}</span></div>)}
          {!logs.length&&<p className="muted">No audit records available.</p>}
        </div>
      </section>
    </main>
  </div>
}