import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ConnectDeriv() {
  const [status, setStatus] = useState("CHECKING");
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [sessionStatus, setSessionStatus] = useState("NOT VERIFIED");
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const load = useCallback(async () => {
    setError("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        setAccount(null);
        setStatus("NOT CONNECTED");
        return;
      }

      // Scope the lookup to the signed-in VELTRION owner.
      const { data, error } = await supabase
        .from("deriv_connections")
        .select("status,deriv_loginid,currency,last_success_at,last_verified_at,last_error")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setAccount(data || null);
      setStatus(String(data?.status || "NOT CONNECTED").toUpperCase());
      if (data?.last_error) setError(String(data.last_error));
    } catch (e) {
      setError(e?.message || "Unable to load Deriv connection.");
      setStatus("ERROR");
    }
  }, []);

  useEffect(() => {
    const result = params.get("deriv");
    if (result === "connected") {
      setStatus("CONNECTED");
      load();
      return;
    }
    if (result === "error") {
      setError(params.get("message") || "Deriv authorization was not completed.");
    }
    load();
  }, [load, params]);

  const verifyRealSession = async () => {
    setError("");
    setSessionStatus("ISSUING SESSION");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Sign in to VELTRION first.");

      const { data, error: invokeError } = await supabase.functions.invoke("deriv-real-session", {
        body: { account_id: account?.deriv_loginid || undefined },
      });
      if (invokeError) throw invokeError;
      if (!data?.ok || !data?.websocket?.url) throw new Error(data?.error || "Deriv real WebSocket session was not issued.");

      setSessionStatus("CONNECTING");
      await new Promise((resolve, reject) => {
        let settled = false;
        const ws = new WebSocket(data.websocket.url);
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          try { ws.close(); } catch {}
          reject(new Error("Timed out opening the authenticated Deriv real WebSocket."));
        }, 10000);
        ws.onopen = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          try { ws.close(); } catch {}
          resolve();
        };
        ws.onerror = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          try { ws.close(); } catch {}
          reject(new Error("Deriv issued a session, but the authenticated real WebSocket could not be opened."));
        };
      });

      setSessionStatus("VERIFIED");
      await load();
    } catch (e) {
      setSessionStatus("FAILED");
      setError(e?.message || "Unable to verify the authenticated Deriv real session.");
    }
  };

  const connect = async () => {
    setError("");
    setStatus("STARTING OAUTH");

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Sign in to VELTRION first.");

      // supabase.functions.invoke sends the current authenticated session.
      // No Deriv access token or client secret is exposed to the browser.
      const { data, error } = await supabase.functions.invoke("deriv-oauth/start");
      if (error) throw error;

      if (!data?.authorization_url) {
        throw new Error(data?.error || "Deriv OAuth authorization URL was not returned.");
      }

      window.location.assign(data.authorization_url);
    } catch (e) {
      setError(e?.message || "Unable to start Deriv authorization.");
      setStatus("ERROR");
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">CONNECTIONS / DERIV</span>
          <h1>Deriv Connection</h1>
          <p>OAuth 2.0 + PKCE connection to the real Deriv account. Credentials stay server-side.</p>
        </div>
        <span className="live-stamp">{status}</span>
      </div>

      <section className="panel">
        <div className="panel-title">
          <h2>Deriv account</h2>
          <span>SERVER-VERIFIED</span>
        </div>

        <div className="success-box">
          Real execution channel: <b>{sessionStatus}</b>. Verification opens the authenticated real WebSocket only; it does not place a trade.
        </div>

        {params.get("deriv") === "connected" && (
          <div className="success-box">
            OAuth authorization completed. VELTRION verified the real Deriv account server-side.
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="connection-grid">
          <div className="health-card">
            <b>{status}</b>
            <p>{account?.deriv_loginid || "No real Deriv account connected."}</p>
            <small>
              {account?.currency || "—"} · verified{" "}
              {account?.last_verified_at
                ? new Date(account.last_verified_at).toLocaleString()
                : "—"}
            </small>
          </div>

          <div className="health-card">
            <b>OAUTH SECURITY</b>
            <p>
              State and PKCE are generated and verified by the Supabase Deriv OAuth
              service. The browser receives no Deriv access token.
            </p>
            <small>Only the authorization redirect and connection status return to the frontend.</small>
          </div>
        </div>

        <button className="primary" onClick={connect} disabled={status === "STARTING OAUTH"}>
          {status === "STARTING OAUTH" ? "CONNECTING…" : "CONNECT / REFRESH DERIV"}
        </button>
        <button className="secondary-btn" onClick={verifyRealSession} disabled={sessionStatus === "ISSUING SESSION" || sessionStatus === "CONNECTING"}>
          {sessionStatus === "ISSUING SESSION" || sessionStatus === "CONNECTING" ? "VERIFYING REAL CHANNEL…" : "VERIFY REAL TRADING CHANNEL"}
        </button>
        <button className="secondary-btn" onClick={() => navigate("/")}>
          BACK TO COMMAND CENTER
        </button>
      </section>
    </div>
  );
}
