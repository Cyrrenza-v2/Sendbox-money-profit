import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";

const OWNER_EMAIL = "uasianubong@gmail.com";

export default function ProtectedRoute() {
  const [state, setState] = useState("loading");

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
    return () => { live = false; };
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
