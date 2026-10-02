import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FUNCTION_URL = "https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/deriv-oauth";

export default function ConnectDeriv() {
  const [status,setStatus]=useState("CHECKING");
  const [account,setAccount]=useState(null);
  const [error,setError]=useState("");
  const navigate=useNavigate();

  const load=async()=>{
    const {data,error}=await supabase.from("deriv_connections")
      .select("status,deriv_loginid,currency,last_success_at,last_verified_at,last_error")
      .maybeSingle();
    if(error){setError(error.message);setStatus("ERROR");return;}
    setStatus(String(data?.status||"NOT CONNECTED").toUpperCase());
    setAccount(data||null);
  };

  useEffect(()=>{load()},[]);

  const connect=async()=>{
    setError(""); setStatus("STARTING OAUTH");
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){setError("Sign in to VELTRION first.");setStatus("NOT SIGNED IN");return;}
    try{
      const response=await fetch(`${FUNCTION_URL}/start`,{headers:{Authorization:`Bearer ${session.access_token}`}});
      const body=await response.json().catch(()=>({}));
      if(!response.ok||!body.authorization_url)throw new Error(body.error||`OAuth start failed (${response.status})`);
      window.location.assign(body.authorization_url);
    }catch(e){setError(e.message||"Unable to start Deriv authorization.");setStatus("ERROR")}
  };

  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">CONNECTIONS / DERIV</span><h1>Deriv Connection</h1><p>OAuth 2.0 + PKCE connection to the real Deriv account. Credentials stay server-side.</p></div><span className="live-stamp">{status}</span></div>
    <section className="panel">
      <div className="panel-title"><h2>Deriv account</h2><span>SERVER-VERIFIED</span></div>
      {error&&<p className="error">{error}</p>}
      <div className="connection-grid">
        <div className="health-card"><b>{status}</b><p>{account?.deriv_loginid||"No real Deriv account connected."}</p><small>{account?.currency||"—"} · verified {account?.last_verified_at?new Date(account.last_verified_at).toLocaleString():"—"}</small></div>
        <div className="health-card"><b>OAuth SECURITY</b><p>State and PKCE are generated and verified by the Supabase Deriv OAuth service.</p><small>Redirect: /oauth/callback.html</small></div>
      </div>
      <button className="primary" onClick={connect}>CONNECT / REFRESH DERIV</button>
      <button className="secondary-btn" onClick={()=>navigate("/app/home")}>BACK TO COMMAND CENTER</button>
    </section>
  </div>;
}
