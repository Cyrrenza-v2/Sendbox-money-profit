import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

const OWNER_EMAIL = "uasianubong@gmail.com";

export default function Security() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!currentUser) throw new Error("AUTH_REQUIRED");
      setUser(currentUser);

      const [sessionResult, auditResult] = await Promise.all([
        supabase
          .from("user_sessions")
          .select("id,status,last_seen_at,created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("audit_logs")
          .select("action,source,environment,result,created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (sessionResult.error) throw sessionResult.error;
      if (auditResult.error) throw auditResult.error;
      setSessions(sessionResult.data || []);
      setLogs(auditResult.data || []);
    } catch (err) {
      setError(err?.message || "Unable to load security records.");
      setSessions([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSecurityData();
  }, [fetchSecurityData]);

  async function terminateOtherSessions() {
    if (terminating) return;
    setError("");
    setNotice("");
    setTerminating(true);
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!currentUser) throw new Error("AUTH_REQUIRED");

      // Revoke other Supabase Auth sessions. Do not bulk-update user_sessions:
      // this table is an application audit record and does not identify which
      // row maps to the current Supabase session.
      const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
      if (signOutError) throw signOutError;

      await fetchSecurityData();
      setNotice("Other Supabase authentication sessions were signed out. Application session records are shown separately and are not treated as proof of an active Auth session.");
    } catch (err) {
      setError(err?.message || "Unable to sign out other sessions.");
    } finally {
      setTerminating(false);
    }
  }

  const isOwner = String(user?.email || "").trim().toLowerCase() === OWNER_EMAIL;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">☰</button>
          <span className="topbar-brand">SECURITY &amp; AUDIT</span>
          <span className="admin-badge">{isOwner ? "● OWNER" : "● ACCOUNT"}</span>
        </header>
        <main className="content">
          <section className="page-heading">
            <div>
              <span className="eyebrow">SECURITY / ACCESS CONTROL</span>
              <h1>Profile &amp; Audit Log</h1>
              <p>Authenticated session and audit visibility.</p>
            </div>
          </section>

          {error && <div className="error-panel" role="alert">{error}</div>}
          {notice && <div className="success-panel" role="status">{notice}</div>}

          <div className="panel">
            <div className="panel-title">CURRENT SESSION</div>
            <p className="active-text">{user ? "Authenticated Supabase user session" : "Checking authentication…"}</p>
            <p>{user?.email || ""}</p>
            <button className="button danger" onClick={terminateOtherSessions} disabled={terminating || loading || !user}>
              {terminating ? "SIGNING OUT…" : "SIGN OUT OTHER SESSIONS"}
            </button>
            <button className="button" onClick={() => void fetchSecurityData()} disabled={loading || terminating}>
              {loading ? "REFRESHING…" : "REFRESH SECURITY RECORDS"}
            </button>
          </div>

          <div className="panel">
            <div className="panel-title">APPLICATION SESSION RECORDS</div>
            {loading ? <div className="empty">Loading session records…</div> :
              sessions.length ? sessions.map((session) => (
                <div className="audit-row" key={session.id}>
                  <span>{session.status || "UNKNOWN"}</span>
                  <span>{(session.last_active_at || session.last_seen_at || session.created_at) ? new Date(session.last_active_at || session.last_seen_at || session.created_at).toLocaleString() : "Time unavailable"}</span>
                </div>
              )) : <div className="empty">No application session records are available. This does not prove that no Supabase Auth session exists.</div>}
          </div>

          <div className="panel">
            <div className="panel-title">AUDIT LOG</div>
            {loading ? <div className="empty">Loading audit events…</div> :
              logs.length ? logs.map((log, index) => (
                <div className="audit-row" key={`${log.created_at || "event"}-${index}`}>
                  <span>{log.action || "UNKNOWN ACTION"} · {log.source || "system"}</span>
                  <span>{log.result || "RECORDED"} · {log.created_at ? new Date(log.created_at).toLocaleString() : "Time unavailable"}</span>
                </div>
              )) : <div className="empty">No audit events are available for this account.</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
