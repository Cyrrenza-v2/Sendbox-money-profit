import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ADMIN_ROLES = ["admin", "risk_admin", "finance_admin", "support"];

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

        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (error) throw error;

        const authorized = (roles || []).some((row) =>
          ADMIN_ROLES.includes(String(row.role).toLowerCase())
        );

        if (!authorized) {
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
    return <div className="secure-screen"><b>VELTRION</b><span>SECURING PRIVATE ADMIN SESSION…</span></div>;
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
