import {useEffect,useState} from "react";
import {supabase} from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import {fetchSystemConfig} from "../utils/config";

const money=x=>x==null?"—":"$"+Number(x).toLocaleString("en-US",{minimumFractionDigits:2});

export default function Home(){
  const [open,setOpen]=useState(false);
  const [sandbox,setSandbox]=useState();
  const [balance,setBalance]=useState();
  const [deriv,setDeriv]=useState();
  const [mt5,setMt5]=useState();
  const [config,setConfig]=useState({tradingMode:"SANDBOX",realTradingEnabled:false});

  useEffect(()=>{
    let mounted=true;
    (async()=>{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session||!mounted)return;
      const uid=session.user.id;
      const [a,b,d,m,c]=await Promise.all([
        supabase.from("sandbox_accounts").select("*").eq("user_id",uid).maybeSingle(),
        supabase.from("sandbox_balances").select("*").eq("user_id",uid).maybeSingle(),
        supabase.from("deriv_connections").select("status,last_success_at,last_error").eq("user_id",uid).maybeSingle(),
        supabase.from("mt5_connections").select("status,last_heartbeat_at").eq("user_id",uid).maybeSingle(),
        fetchSystemConfig()
      ]);
      if(!mounted)return;
      setSandbox(a.data); setBalance(b.data); setDeriv(d.data); setMt5(m.data); setConfig(c);
    })();
    return()=>{mounted=false};
  },[]);

  const equity=balance?.equity??balance?.cash;
  const profit=sandbox&&equity!=null?Number(equity)-Number(sandbox.initial_capital):null;
  const sandboxOnly=config.tradingMode==="SANDBOX"||!config.realTradingEnabled;

  return <div>
    <Sidebar open={open} onClose={()=>setOpen(false)}/>
    <main className="main">
      <header>
        <button className="menu" onClick={()=>setOpen(true)}>☰</button>
        <b>VELTRION</b>
        <div className="header-status"><span className="mode-badge">{config.tradingMode} MODE</span><span className="online">● ADMIN</span></div>
      </header>
      <section className="content">
        <div className="hero">
          <span className="secure-badge">{sandboxOnly?"SANDBOX ISOLATION ACTIVE":"CONFIGURATION REVIEW REQUIRED"}</span>
          <h1>Private trading control center</h1>
          <p className="muted">Phase 2 device and infrastructure controls are active. Account values below are read from Supabase.</p>
        </div>
        <div className="grid">
          <div className="card"><small>SANDBOX STARTING CAPITAL</small><strong>{money(sandbox?.initial_capital)}</strong><span>Virtual capital</span></div>
          <div className="card"><small>SANDBOX EQUITY</small><strong>{money(equity)}</strong><span>Supabase balance</span></div>
          <div className="card"><small>SANDBOX P/L</small><strong className={profit>=0?"positive":"negative"}>{profit==null?"—":money(profit)}</strong><span>Derived from stored values</span></div>
        </div>
        <div className="grid two">
          <div className="card">
            <h3>Connections</h3>
            <div className="row"><b>DERIV</b><span>{deriv?.status||"NOT CONNECTED"}</span></div>
            <div className="row"><b>MT5</b><span>{mt5?.status||"NOT CONNECTED"}</span></div>
            <button className="primary" onClick={()=>location.href="https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/deriv-oauth?action=start"}>CONNECT / REFRESH DERIV</button>
          </div>
          <div className="card">
            <h3>Trading Access</h3>
            <p className="muted">{sandboxOnly?"Real trading is locked by the centralized Phase 2 configuration.":"Real-trading configuration is enabled; access remains backend-controlled."}</p>
            <button className="primary disabled" disabled onClick={()=>{}}>OPEN TRADING</button>
          </div>
        </div>
      </section>
    </main>
  </div>
}