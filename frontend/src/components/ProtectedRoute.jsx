import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState("loading");

  useEffect(() => {
    let live = true;
    const verify = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("AUTH_TIMEOUT")), 8000));
        const { data: { session } } = await Promise.race([sessionPromise, timeout]);
        if (!session) { if (live) setState("denied"); return; }

        const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
        if (error) throw error;
        const ok = (roles || []).some(x => ["admin","risk_admin","finance_admin","support"].includes(String(x.role).toLowerCase()));
        if (!ok) {
          await supabase.auth.signOut();
          if (live) setState("denied");
          return;
        }
        if (live) setState("ok");
      } catch (error) {
        console.error("VELTRION auth check failed:", error);
        if (live) setState("error");
      }
    };
    verify();
    return () => { live = false; };
  }, []);

  if (state === "loading") return <div className="secure"><div><b>VELTRION</b><p>Checking secure session…</p></div></div>;
  if (state === "error") return <div className="secure"><div><b>VELTRION</b><p>Unable to reach the authentication service.</p><button className="primary" onClick={() => window.location.reload()}>RETRY</button></div></div>;
  return state === "ok" ? children : <Navigate to="/login" replace />;
}
