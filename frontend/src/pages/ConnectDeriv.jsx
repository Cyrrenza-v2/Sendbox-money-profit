import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../supabaseClient";

async function readFunctionError(invokeError, fallback) {
  let detail = invokeError?.message || fallback;
  try {
    const response = invokeError?.context;
    if (response?.clone) {
      const payload = await response.clone().json();
      detail = payload?.error || payload?.message || detail;
    }
  } catch {}
  return detail;
}

export default function ConnectDeriv() {
  const [status, setStatus] = useState("CHECKING");
  const [account, setAccount] = useState(null);
  const [accountType, setAccountType] = useState("unknown");
  const [error, setError] = useState("");
  const [sessionStatus, setSessionStatus] = useState("NOT VERIFIED");
  const [balanceBusy, setBalanceBusy] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balanceResult, setBalanceResult] = useState(null);
  const [demoBalanceBusy, setDemoBalanceBusy] = useState(false);
  const [demoBalanceResult, setDemoBalanceResult] = useState(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const load = useCallback(async () => {
    setError("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        setAccount(null);
        setAccountType("unknown");
        setStatus("NOT CONNECTED");
        return;
      }

      const { data, error: connectionError } = await supabase
        .from("deriv_connections")
        .select("status,deriv_loginid,currency,last_success_at,last_verified_at,last_error")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (connectionError) throw connectionError;

      setAccount(data || null);
      setStatus(String(data?.status || "NOT CONNECTED").toUpperCase());
      if (data?.last_error) setError(String(data.last_error));

      if (data?.deriv_loginid) {
        const { data: providerAccount, error: providerError } = await supabase
          .from("deriv_accounts")
          .select("account_type")
          .eq("user_id", session.user.id)
          .eq("deriv_account_id", data.deriv_loginid)
          .maybeSingle();
        if (providerError) throw providerError;
        setAccountType(String(providerAccount?.account_type || "unknown").toLowerCase());
      } else {
        setAccountType("unknown");
      }
    } catch (e) {
      setError(e?.message || "Unable to load Deriv connection.");
      setStatus("ERROR");
    }
  }, []);

  useEffect(() => {
    const result = params.get("deriv");
    if (result === "connected") setStatus("CONNECTED");
    if (result === "error") setError(params.get("message") || "Deriv authorization was not completed.");
    load();
  }, [load, params]);

  const verifyDemoSession = async () => {
    setError("");
    setDemoBalanceBusy(true);
    setDemoBalanceResult(null);
    setSessionStatus("CHECKING DEMO SESSION");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Sign in to VELTRION first.");

      const { data, error: invokeError } = await supabase.functions.invoke("deriv-demo-session", {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (invokeError) throw new Error(await readFunctionError(invokeError, "Deriv demo-session request failed."));
      if (!data?.ok || data?.account_type !== "demo") {
        throw new Error(data?.error || "Deriv demo API session was not verified.");
      }
      setDemoBalanceResult(data);
      setSessionStatus("DEMO VERIFIED");
      await load();
    } catch (e) {
      setSessionStatus("FAILED");
      setError(e?.message || "Unable to verify the Deriv demo API session.");
    } finally {
      setDemoBalanceBusy(false);
    }
  };

  const verifyRealSession = async () => {
    setError("");
    setSessionStatus("CHECKING SESSION");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Sign in to VELTRION first.");

      setSessionStatus("ISSUING SESSION");
      const { data, error: invokeError } = await supabase.functions.invoke("deriv-real-session", {
        body: { account_id: account?.deriv_loginid || undefined },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (invokeError) throw new Error(await readFunctionError(invokeError, "Deriv real-session request failed."));
      if (!data?.ok || !data?.websocket?.url) {
        throw new Error(data?.error || data?.message || "Deriv real WebSocket session was not issued.");
      }

      setSessionStatus("CONNECTING");
      await new Promise((resolve, reject) => {
        let settled = false;
        const ws = new WebSocket(data.websocket.url);
        const finish = (fn, value) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          try { ws.close(); } catch {}
          fn(value);
        };
        const timeout = window.setTimeout(() => finish(reject, new Error("Timed out opening the authenticated Deriv real WebSocket.")), 10000);
        ws.onopen = () => finish(resolve);
        ws.onerror = () => finish(reject, new Error("Deriv issued a session, but the authenticated real WebSocket could not be opened."));
      });

      setSessionStatus("VERIFIED");
      await load();
      await syncLiveBalance();
    } catch (e) {
      setSessionStatus("FAILED");
      setError(e?.message || "Unable to verify the authenticated Deriv real session.");
    }
  };

  const syncLiveBalance = async () => {
    setBalanceBusy(true);
    setBalanceError("");
    setBalanceResult(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Sign in to VELTRION first.");

      const { data, error: invokeError } = await supabase.functions.invoke("trading-service", {
        body: { operation: "balance_reconcile" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (invokeError) throw new Error(await readFunctionError(invokeError, "Live balance reconciliation failed."));
      if (!data?.ok || !data?.data?.snapshot_saved) throw new Error(data?.error || "Deriv live balance was not reconciled.");
      setBalanceResult(data.data);
    } catch (e) {
      setBalanceError(e?.message || "Live balance reconciliation failed.");
    } finally {
      setBalanceBusy(false);
    }
  };

  const connect = async () => {
    setError("");
    setStatus("STARTING OAUTH");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Sign in to VELTRION first.");

      // The OAuth function exposes /start as a path, so call the Edge Function
      // endpoint directly instead of treating "deriv-oauth/start" as a function name.
      const response = await fetch(SUPABASE_URL + "/functions/v1/deriv-oauth/start", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + session.access_token,
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Accept: "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to start Deriv authorization.");
      if (!data?.authorization_url) throw new Error(data?.error || "Deriv OAuth authorization URL was not returned.");
      window.location.assign(data.authorization_url);
    } catch (e) {
      setError(e?.message || "Unable to start Deriv authorization.");
      setStatus("ERROR");
    }
  };

  const busySession = ["CHECKING SESSION", "ISSUING SESSION", "CONNECTING", "CHECKING DEMO SESSION"].includes(sessionStatus);
  const isDemo = accountType === "demo";
  const isReal = accountType === "real";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">CONNECTIONS / DERIV</span>
          <h1>Deriv Connection</h1>
          <p>OAuth 2.0 + PKCE. Account credentials stay server-side; demo and real accounts are kept separate.</p>
        </div>
        <span className="live-stamp">{status}</span>
      </div>

      <section className="panel">
        <div className="panel-title">
          <h2>Deriv API account</h2>
          <span>{isDemo ? "DEMO" : isReal ? "REAL" : "ACCOUNT TYPE PENDING"}</span>
        </div>

        <div className="connection-grid">
          <div className="health-card">
            <b>{status}</b>
            <p>{account?.deriv_loginid || "No Deriv API account connected."}</p>
            <small>
              {isDemo ? "Demo API account" : isReal ? "Real API account (execution separately gated)" : "Connect Deriv to identify the account type"}
              {" · "}{account?.currency || "—"}
            </small>
          </div>
          <div className="health-card">
            <b>OAUTH SECURITY</b>
            <p>State and PKCE are verified by the Supabase Deriv OAuth service. The browser never receives a permanent Deriv access token.</p>
            <small>Only authorization redirects and verified account results return to the frontend.</small>
          </div>
        </div>

        {params.get("deriv") === "connected" && (
          <div className="success-box" style={{ marginTop: 16 }}>
            OAuth completed. VELTRION stored the connection server-side. Verify the selected account below.
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}

        <div className="success-box" style={{ marginTop: 16 }}>
          <b>CONNECT DERIV DEMO ACCOUNT</b>
          <p style={{ margin: "6px 0 10px" }}>
            Connect your Deriv API demo account for read-only verification. If your authorized Deriv account has no Options API demo account yet, VELTRION will request a virtual demo account. This does not activate real trading or connect the separate MT5 demo account.
          </p>
          <button className="primary" onClick={connect} disabled={status === "STARTING OAUTH"}>
            {status === "STARTING OAUTH" ? "OPENING DERIV AUTHORIZATION…" : isDemo ? "RECONNECT DEMO ACCOUNT" : "CONNECT DEMO ACCOUNT"}
          </button>
        </div>

        {isDemo && (
          <div className="success-box" style={{ marginTop: 16 }}>
            <b>DERIV API DEMO CONNECTION</b>
            <p style={{ margin: "6px 0 0" }}>This read-only check verifies a Deriv API demo account and its virtual balance. It does not place trades, enable live trading, or connect to the separate Deriv MT5 demo balance.</p>
            {demoBalanceResult && (
              <div style={{ marginTop: 10 }}>
                <p><b>Demo balance:</b> {Number(demoBalanceResult.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {demoBalanceResult.currency}</p>
                <p><b>Account:</b> {demoBalanceResult.account_id}</p>
                <small>Verified {new Date(demoBalanceResult.observed_at).toLocaleString()} · {demoBalanceResult.source}</small>
              </div>
            )}
            <button className="primary" onClick={verifyDemoSession} disabled={demoBalanceBusy || busySession}>
              {demoBalanceBusy ? "VERIFYING DEMO ACCOUNT…" : "VERIFY DEMO API ACCOUNT"}
            </button>
          </div>
        )}

        {isReal && (
          <>
            <div className="success-box" style={{ marginTop: 16 }}>
              <b>REAL TRADING CHANNEL</b>
              <p style={{ margin: "6px 0 0" }}>Current status: <b>{sessionStatus}</b>. Verification opens the authenticated real Deriv WebSocket only; it does not place a trade or enable trading.</p>
            </div>
            <button className="primary" onClick={verifyRealSession} disabled={busySession}>
              {busySession ? "VERIFYING REAL CHANNEL…" : "VERIFY REAL TRADING CHANNEL"}
            </button>

            <div className="success-box" style={{ marginTop: 16 }}>
              <b>LIVE BALANCE RECONCILIATION</b>
              <p style={{ margin: "6px 0 0" }}>Read-only reconciliation records a timestamped balance snapshot. It does not place trades or enable trading.</p>
              {balanceError && <p className="error" role="status">{balanceError}</p>}
              {balanceResult && (
                <div style={{ marginTop: 10 }}>
                  <p><b>Live balance:</b> {Number(balanceResult.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceResult.currency}</p>
                  <p><b>Previous stored balance:</b> {Number(balanceResult.previous_stored_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceResult.currency}</p>
                  <p><b>Difference reconciled:</b> {Number(balanceResult.balance_difference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceResult.currency}</p>
                  <p><b>Equity:</b> {balanceResult.equity_verified ? `${Number(balanceResult.equity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balanceResult.currency} (verified with no open contracts)` : "Not independently verified; stored value preserved."}</p>
                  <small>Snapshot saved {new Date(balanceResult.observed_at).toLocaleString()} · {balanceResult.source}</small>
                </div>
              )}
            </div>
            <button className="primary" onClick={syncLiveBalance} disabled={balanceBusy}>
              {balanceBusy ? "RECONCILING LIVE BALANCE…" : "SYNC LIVE BALANCE"}
            </button>
          </>
        )}

        {!isDemo && !isReal && (
          <div className="success-box" style={{ marginTop: 16 }}>
            Account type has not been verified. Reconnect Deriv to refresh the account list; real trading remains disabled until the exact account is identified and independently verified.
          </div>
        )}

        <button className="secondary-btn" onClick={connect} disabled={status === "STARTING OAUTH"}>
          {status === "STARTING OAUTH" ? "CONNECTING…" : "CONNECT / REFRESH DERIV"}
        </button>
        <button className="secondary-btn" onClick={() => navigate("/")}>BACK TO COMMAND CENTER</button>
      </section>
    </div>
  );
}
