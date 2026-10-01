import { useEffect, useState } from "react";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deriv-oauth`;

export default function DerivCallback() {
  const [message, setMessage] = useState("Verifying Deriv authorization…");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const oauthError = params.get("error_description") || params.get("error");
      if (oauthError) { setMessage(`Deriv authorization was not completed: ${oauthError}`); return; }
      if (!code || !state) { setMessage("Missing Deriv authorization code or state."); return; }

      const response = await fetch(`${FUNCTION_URL}/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ code, state })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.action_link) {
        setMessage(data.error || "Deriv verification failed.");
        return;
      }
      setMessage("Verified. Creating your VELTRION session…");
      window.location.assign(data.action_link);
    };
    run().catch((e) => setMessage(e?.message || "Callback verification failed."));
  }, []);

  return <main className="main"><section className="content"><div className="card"><h2>Deriv connection</h2><p className="muted">{message}</p></div></section></main>;
}
