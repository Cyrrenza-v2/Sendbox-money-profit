import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FUNCTION_NAME = "deriv-real-session";
const WARM_EVENT = "veltrion:accounts-ready";

async function verifyContinuity() {
  if (!navigator.onLine || document.visibilityState === "hidden") return;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  let session = sessionData?.session || null;
  if (sessionError || !session?.access_token) return;

  const expiresAtMs = Number(session.expires_at || 0) * 1000;
  if (expiresAtMs && expiresAtMs < Date.now() + 120000) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data?.session) return;
    session = refreshed.data.session;
  }

  const warmReal = supabase.functions.invoke(FUNCTION_NAME, {
    body: {},
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).then(async ({ data, error }) => {
    if (error || !data?.ok || !data?.websocket?.url) return false;
    try {
      const ws = new WebSocket(data.websocket.url);
      await new Promise((resolve, reject) => {
        let done = false;
        const finish = (fn, value) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          try { ws.close(); } catch {}
          fn(value);
        };
        const timer = window.setTimeout(() => finish(reject, new Error("timeout")), 7000);
        ws.onopen = () => ws.send(JSON.stringify({ ping: 1, req_id: Date.now() }));
        ws.onmessage = event => {
          try {
            const message = JSON.parse(event.data);
            if (message?.error) return finish(reject, new Error(message.error.message || "Deriv error"));
            if (message?.msg_type === "ping" || message?.msg_type === "pong") finish(resolve);
          } catch {}
        };
        ws.onerror = () => finish(reject, new Error("Deriv websocket unavailable"));
        ws.onclose = () => { if (!done) finish(reject, new Error("closed")); };
      });
      window.dispatchEvent(new CustomEvent(WARM_EVENT, { detail: { real: true, account: data.account } }));
      return true;
    } catch {
      return false;
    }
  });

  const warmSnapshot = supabase.functions.invoke("trading-service", {
    body: { operation: "real_snapshot" },
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).then(({ data, error }) => {
    if (!error && data?.ok) {
      window.dispatchEvent(new CustomEvent(WARM_EVENT, { detail: { realSnapshot: true } }));
      return true;
    }
    return false;
  });

  await Promise.allSettled([warmReal, warmSnapshot]);
}

export default function DerivContinuity() {
  useEffect(() => {
    let disposed = false;
    let timer;
    let inFlight = null;

    const run = () => {
      if (disposed || inFlight) return;
      inFlight = verifyContinuity().catch(() => {}).finally(() => { inFlight = null; });
    };
    const onOnline = run;
    const onFocus = run;
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };

    run();
    timer = window.setInterval(run, 5 * 60 * 1000);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <Outlet />;
}
