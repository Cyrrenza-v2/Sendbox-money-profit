import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const OWNER_EMAIL = "uasianubong@gmail.com";

export default function ProtectedRoute() {
  const [state, setState] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;

    async function verify() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (live) setState("denied");
          return;
        }

        const ownerEmail = String(session.user.email || "").trim().toLowerCase();
        if (ownerEmail !== OWNER_EMAIL) {
          await supabase.auth.signOut();
          if (live) setState("denied");
          return;
        }

        if (live) setState("ok");
      } catch (error) {
        console.error("VELTRION authentication check failed:", error);
        if (live) setState("error");
      }
    }

    verify();

    const LOCK_AFTER_HIDDEN_MS = 60 * 1000;
    let hiddenAt = null;
    let lockTimer = null;
    const lockSession = async () => {
      try { await supabase.auth.signOut(); } finally {
        if (live) { setState("denied"); navigate("/login", { replace: true }); }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        window.clearTimeout(lockTimer);
        lockTimer = window.setTimeout(() => { if (document.visibilityState === "hidden") lockSession(); }, LOCK_AFTER_HIDDEN_MS);
      } else if (document.visibilityState === "visible" && hiddenAt && Date.now() - hiddenAt >= LOCK_AFTER_HIDDEN_MS) {
        window.clearTimeout(lockTimer);
        lockSession();
      }
    };
    const onPageShow = () => {
      if (hiddenAt && Date.now() - hiddenAt >= LOCK_AFTER_HIDDEN_MS) lockSession();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => { live = false; window.clearTimeout(lockTimer); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pageshow", onPageShow); };
  }, []);

  if (state === "loading") {
    return <div className="secure-screen"><b>VELTRION</b><span>SECURING PRIVATE OWNER SESSION…</span></div>;
  }

  if (state === "error") {
    return (
      <div className="secure-screen">
        <b>VELTRION</b>
        <span>Unable to reach the authentication service.</span>
        <button className="button primary" onClick={() => window.location.reload()}>RETRY</button>
      </div>
    );
  }

  return state === "ok" ? <Outlet /> : <Navigate to="/login" replace />;
}
