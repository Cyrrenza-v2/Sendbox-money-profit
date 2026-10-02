import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { api } from "../lib/api";

export default function ConnectDeriv() {
  const [status,setStatus]=useState("CHECKING");
  const [account,setAccount]=useState(null);
  const [error,setError]=useState("");
  const navigate=useNavigate();
  const [params]=useSearchParams();

  const load=async()=>{
    try{
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        setAccount(null);
        setStatus("NOT CONNECTED");
        return;
      }

      // Always scope this lookup to the signed-in VELTRION owner. The table can
      // contain rows for other users, so an unfiltered maybeSingle() can fail.
      const { data, error } = await supabase.from("deriv_connections")
        .select("status,deriv_loginid,currency,last_success_at,last_verified_at,last_error")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      setAccount(data || null);
      setStatus(String(data?.status || "NOT CONNECTED").toUpperCase());
      if (data?.last_error) setError(String(data.last_error));
    }catch(e){
      setError(e.message||"Unable to load Deriv connection.");
      setStatus("ERROR");
    }
  };

  useEffect(()=>{
    if(params.get("deriv")==="connected") setStatus("CONNECTED");
    load();
  },[]);

  const connect=async()=>{
    setError(""); setStatus("STARTING OAUTH");
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session) throw new Error("Sign in to VELTRION first.");
      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://qalowxnqngzsdlayqivr.supabase.co"}/functions/v1/deriv-oauth/start`,{
        headers:{Authorization:`Bearer ${session.access_token}`,apikey:import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Fp2Y0kbwgE8z-ldpvhzmsw_zQMTxcPQ"}
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok||!body.authorization_url) throw new Error(body.error||`OAuth start failed (${response.status})`);
      window.location.assign(body.authorization_url);
    }catch(e){setError(e.message||"Unable to start Deriv authorization.");setStatus("ERROR")}
  };

  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">CONNECTIONS / DERIV</span><h1>Deriv Connection</h1><p>OAuth 2.0 + PKCE connection to the real Deriv account. Credentials stay server-side.</p></div><span className="live-stamp">{status}</span></div>
    <section className="panel">
      <div className="panel-title"><h2>Deriv account</h2><span>SERVER-VERIFIED</span></div>
      {params.get("deriv")==="connected"&&<div className="success-box">OAuth callback completed and returned control to the VELTRION frontend.</div>}
      {error&&<p className="error">{error}</p>}
      <div className="connection-grid">
        <div className="health-card"><b>{status}</b><p>{account?.deriv_loginid||"No real Deriv account connected."}</p><small>{account?.currency||"—"} · verified {account?.last_verified_at?new Date(account.last_verified_at).toLocaleString():"—"}</small></div>
        <div className="health-card"><b>OAUTH SECURITY</b><p>State and PKCE are generated and verified by the Supabase Deriv OAuth service. The browser receives no Deriv access token.</p><small>Callback reports only to the VELTRION frontend.</small></div>
      </div>
      <button className="primary" onClick={connect}>CONNECT / REFRESH DERIV</button>
      <button className="secondary-btn" onClick={()=>navigate("/")}>BACK TO COMMAND CENTER</button>
    </section>
  </div>;
}
