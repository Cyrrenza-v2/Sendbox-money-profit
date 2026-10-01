import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

const FUNCTION_URL = "https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/deriv-oauth";

export default function ConnectDeriv() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Checking connection…");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.from("deriv_connections").select("status,last_success_at,last_error,last_verified_at").maybeSingle()
      .then(({ data, error: dbError }) => {
        if (!mounted) return;
        if (dbError) setError(dbError.message);
        else if (data?.status === "connected") setStatus("CONNECTED");
        else setStatus(data?.status ? String(data.status).toUpperCase() : "NOT CONNECTED");
      });
    return () => { mounted = false; };
  }, []);

  const connect = async () => {
    setError("");
    setStatus("STARTING OAUTH…");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Sign in to VELTRION first.");
      setStatus("NOT SIGNED IN");
      return;
    }
    const response = await fetch(`${FUNCTION_URL}/start`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.authorization_url) {
      setError(data.error || "Unable to start Deriv OAuth.");
      setStatus("ERROR");
      return;
    }
    window.location.assign(data.authorization_url);
  };

  return <div className="app-shell">
    <Sidebar open={open} onClose={() => setOpen(false)} />
    <main className="main">
      <header>
        <button className="menu" onClick={() => setOpen(true)}>☰</button>
        <b>DERIV CONNECTION</b>
        <span className="online">● {status}</span>
      </header>
      <section className="content">
        <div className="hero">
          <span className="secure-badge">OAUTH 2.0 • PKCE • SERVER-SIDE TOKEN EXCHANGE</span>
          <h1>Connect your Deriv account</h1>
          <p className="muted">VELTRION sends you to Deriv for authentication and consent. Your password is never entered into VELTRION.</p>
        </div>
        <div className="card">
          <h3>Account connection</h3>
          <p className="muted">The connection flow verifies state and PKCE, exchanges the authorization code server-side, then records the real Deriv account connection in Supabase.</p>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" onClick={connect}>Connect / Refresh Deriv</button>
        </div>
      </section>
    </main>
  </div>;
}
