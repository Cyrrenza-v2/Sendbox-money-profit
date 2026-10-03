import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { supabase } from "../supabaseClient";
import { api } from "../lib/api";

export default function RealTradingTerminal() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [emergencyStopped, setEmergencyStopped] = useState(true);
  const [stake, setStake] = useState("10.00");
  const [symbol, setSymbol] = useState("1HZ100V");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSide, setPendingSide] = useState(null);
  const [message, setMessage] = useState("");
  const [connection, setConnection] = useState(null);

  async function loadState() {
    try {
      const [{ data: controls }, deriv] = await Promise.all([
        supabase.from("emergency_controls").select("control_key,is_active").order("control_key"),
        api("/deriv/status"),
      ]);
      const stop = controls?.find(x => x.control_key === "EMERGENCY_STOP")?.is_active ?? true;
      setEmergencyStopped(Boolean(stop));
      setConnection(deriv?.data || deriv || null);
    } catch (error) {
      setMessage(error?.message || "Unable to load trading state.");
    }
  }

  useEffect(() => { loadState(); }, []);

  async function arm() {
    setMessage("");
    try {
      const state = await api("/deriv/status");
      const status = String(state?.data?.status || "disconnected").toLowerCase();
      if (status !== "connected") throw new Error("DERIV_ACCOUNT_NOT_CONNECTED");
      const { error } = await supabase.rpc("set_global_emergency_stop", { p_active: false });
      if (error) throw error;
      setEmergencyStopped(false);
      setArmed(true);
      setMessage("Deriv account verified. Trading controls are armed.");
    } catch (error) {
      setMessage(error?.message || "REAL_MODE_ENABLE_FAILED");
    }
  }

  async function setStop(active) {
    setMessage("");
    const { error } = await supabase.rpc("set_global_emergency_stop", { p_active: active });
    if (error) { setMessage(error.message); return; }
    setEmergencyStopped(active);
    if (active) setArmed(false);
    setMessage(active ? "Global emergency stop active. New trading requests are blocked." : "Global emergency stop released. Per-mode locks remain enforced.");
  }

  function requestOrder(side) {
    if (!armed || emergencyStopped) return;
    setPendingSide(side);
    setConfirmOpen(true);
  }

  async function submitOrder() {
    const side = pendingSide;
    setConfirmOpen(false);
    if (!side || !armed || emergencyStopped) return;
    setMessage("Validating authenticated trading request…");
    try {
      const result = await api("/trading/execute", {
        method: "POST",
        body: JSON.stringify({
          source: "deriv",
          environment: "real",
          symbol,
          side,
          stake: Number(stake),
          quantity: Number(stake),
          contract_type: side === "BUY" ? "CALL" : "PUT",
          idempotency_key: crypto.randomUUID(),
          request_id: crypto.randomUUID(),
        }),
      });
      setMessage(result?.status === "validated"
        ? "Trading request validated by Supabase. No real-money contract was sent because the production execution lock is still active."
        : "Trading request processed.");
    } catch (error) {
      setMessage(error?.message || "REAL_ORDER_REJECTED");
    }
  }

  return <div className="app-layout">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <div className="app-main">
      <header className="topbar">
        <button className="menu-button" onClick={() => setSidebarOpen(true)}>☰</button>
        <span className="topbar-brand">DERIV REAL TRADING TERMINAL</span>
        <span className={armed ? "admin-badge real-badge" : "admin-badge"}>{armed ? "● VERIFIED / ARMED" : "● SAFE LOCK"}</span>
      </header>
      <main className="content">
        {!armed ? <section className="panel real-warning">
          <span className="eyebrow real-eyebrow">DERIV / LIVE ACCOUNT CONTROL</span>
          <h1>Verify live account</h1>
          <p>VELTRION uses Supabase Auth, the Supabase gateway, and the server-side Deriv connection. No Deriv credential is stored in the browser.</p>
          <ul>
            <li>OAuth state and PKCE are handled by the Supabase Deriv service.</li>
            <li>Live account status is read through the authenticated gateway.</li>
            <li>Emergency stop is stored centrally in Supabase.</li>
            <li>Real-money execution remains locked until the server execution service is explicitly enabled.</li>
          </ul>
          <div className="panel"><b>Deriv connection:</b> {String(connection?.status || "NOT CONNECTED").toUpperCase()}</div>
          <button className="button danger full" onClick={arm}>VERIFY &amp; ARM TRADING CONTROLS</button>
        </section> : <section className="panel">
          <div className="page-heading">
            <div><span className="eyebrow real-eyebrow">AUTHENTICATED DERIV CONTROL</span><h1>Trading terminal</h1></div>
            <button className={emergencyStopped ? "button primary" : "button danger"} onClick={() => setStop(!emergencyStopped)}>
              {emergencyStopped ? "RELEASE GLOBAL STOP" : "EMERGENCY STOP"}
            </button>
          </div>
          <LiveMarketPanel compact selectedSymbol={symbol} onSymbolChange={setSymbol} />
          <div className="real-grid">
            <label>Stake amount (USD)<input value={stake} onChange={e => setStake(e.target.value)} type="number" min="0.01" step="0.01" disabled={emergencyStopped}/></label>
            <label>Deriv symbol<input value={symbol} onChange={e => setSymbol(e.target.value)} disabled={emergencyStopped}/></label>
          </div>
          <div className="real-actions">
            <button className="button primary" disabled={emergencyStopped} onClick={() => requestOrder("BUY")}>VALIDATE BUY / CALL</button>
            <button className="button danger" disabled={emergencyStopped} onClick={() => requestOrder("SELL")}>VALIDATE SELL / PUT</button>
          </div>
          {emergencyStopped && <div className="stop-notice">Global emergency stop is active. New trading requests are blocked.</div>}
          {message && <div className={message.startsWith("Deriv account verified") ? "panel" : "error-panel"}>{message}</div>}
        </section>}
      </main>
    </div>
    {confirmOpen && <div className="confirm-backdrop"><div className="confirm-modal">
      <h2>Confirm trading request</h2>
      <p>This sends an authenticated request to the Supabase trading service. The current production execution lock prevents it from placing a real-money contract.</p>
      <div className="confirm-data"><b>{pendingSide === "BUY" ? "CALL" : "PUT"}</b><span>{symbol}</span><span>${Number(stake || 0).toFixed(2)} USD stake</span></div>
      <div className="confirm-actions"><button className="button" onClick={() => setConfirmOpen(false)}>CANCEL</button><button className="button danger" onClick={submitOrder}>CONFIRM REQUEST</button></div>
    </div></div>}
  </div>;
}
