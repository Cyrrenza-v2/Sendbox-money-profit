import { useEffect } from "react";
import { supabase } from "../supabaseClient";

const FUNCTION_NAME = "deriv-real-session";

async function verifyContinuity() {
  if (!navigator.onLine || document.visibilityState === "hidden") return;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) return;

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {},
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error || !data?.ok || !data?.websocket?.url) return;

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
    const timeout = window.setTimeout(
      () => finish(reject, new Error("Deriv continuity timeout")),
      10000,
    );

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify({ balance: 1, req_id: Date.now() }));
      } catch (e) {
        finish(reject, e);
      }
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message?.error) {
          finish(reject, new Error(message.error.message || "Deriv continuity verification failed"));
          return;
        }
        if (message?.msg_type === "balance") finish(resolve, message);
      } catch {}
    };
    ws.onerror = () => finish(reject, new Error("Deriv continuity WebSocket unavailable"));
  }).catch(() => {});

  // Keep the persisted read-only reconciliation current. This never enables
  // real execution and never transfers Sendbox Money to the broker.
  await supabase.functions.invoke("trading-service", {
    body: { operation: "balance_reconcile" },
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => {});
}

export default function DerivContinuity() {
  useEffect(() => {
    let disposed = false;
    let timer;

    const run = () => {
      if (!disposed) void verifyContinuity().catch(() => {});
    };
    const onOnline = run;
    const onFocus = run;
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };

    run();
    timer = window.setInterval(run, 60000);
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

  return null;
}
