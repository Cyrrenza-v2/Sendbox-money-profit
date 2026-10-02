import { useState } from "react";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { supabase } from "../supabaseClient";

const API = import.meta.env.VITE_REAL_TRADING_API_URL || "";

export default function RealTradingTerminal() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [emergencyStopped, setEmergencyStopped] = useState(false);
  const [stake, setStake] = useState("10.00");
  const [symbol, setSymbol] = useState("1HZ100V");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSide, setPendingSide] = useState(null);
  const [message, setMessage] = useState("");

  function requestOrder(side) {
    if (!armed || emergencyStopped) return;
    setPendingSide(side);
    setConfirmOpen(true);
  }

  async function submitOrder() {
    const side = pendingSide;
    setConfirmOpen(false);
    if (!side || !armed || emergencyStopped) return;
    setMessage("Submitting authenticated order…");
    try {
      if (!API) throw new Error("REAL_TRADING_API_NOT_CONFIGURED");
      const response = await fetch(`${API}/api/real/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: Number(stake), symbol, side, mode: "REAL", confirmation: "EXPLICIT" })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "REAL_ORDER_REJECTED");
      setMessage(`Order confirmed. Contract ${body.contractId}.`);
    } catch (error) {
      setMessage(error?.message || "REAL_ORDER_REJECTED");
    }
  }

  async function authHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("AUTH_REQUIRED");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }

  async function enableRealMode() {
    try {
      if (!API) throw new Error("REAL_TRADING_API_NOT_CONFIGURED");
      const headers = await authHeaders();
      const response = await fetch(`${API}/api/real/resume`, { method: "POST", headers });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "REAL_MODE_ENABLE_FAILED");
      setArmed(true);
      setMessage("REAL mode armed. Every order still requires confirmation.");
    } catch (error) {
      setMessage(error?.message || "REAL_MODE_ENABLE_FAILED");
    }
  }

  async function emergencyStop() {
    try {
      if (!API) throw new Error("REAL_TRADING_API_NOT_CONFIGURED");
      const headers = await authHeaders();
      const response = await fetch(`${API}/api/real/emergency-stop`, { method: "POST", headers });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "EMERGENCY_STOP_FAILED");
      setEmergencyStopped(true);
      setMessage("Emergency stop active. New live orders are blocked server-side.");
    } catch (error) {
      setMessage(error?.message || "EMERGENCY_STOP_FAILED");
    }
  }

  async function resumeTrading() {
    try {
      if (!API) throw new Error("REAL_TRADING_API_NOT_CONFIGURED");
      const headers = await authHeaders();
      const response = await fetch(`${API}/api/real/resume`, { method: "POST", headers });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "RESUME_FAILED");
      setEmergencyStopped(false);
      setMessage("Trading resumed. Every order still requires confirmation.");
    } catch (error) {
      setMessage(error?.message || "RESUME_FAILED");
    }
  }

  return <div className="app-layout">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <div className="app-main">
      <header className="topbar">
        <button className="menu-button" onClick={() => setSidebarOpen(true)}>☰</button>
        <span className="topbar-brand">DERIV REAL TRADING TERMINAL</span>
        <span className={armed ? "admin-badge real-badge" : "admin-badge"}>{armed ? "● REAL ARMED" : "● SANDBOX SAFE"}</span>
      </header>
      <main className="content">
        {!armed ? <section className="panel real-warning">
          <span className="eyebrow real-eyebrow">PHASE 6 / LIVE EXECUTION</span>
          <h1>Enable real trading</h1>
          <p>This terminal is locked by default. Enabling it arms the live execution path; it does not submit an order.</p>
          <ul>
            <li>Live Deriv credentials stay on the backend.</li>
            <li>Virtual sandbox funds never enter the real ledger.</li>
            <li>Every live order requires a second explicit confirmation.</li>
            <li>The emergency stop blocks new live orders.</li>
          </ul>
          <button className="button danger full" onClick={enableRealMode}>ARM REAL TRADING MODE</button>
        </section> : <section className="panel">
          <div className="page-heading"><div><span className="eyebrow real-eyebrow">REAL EXECUTION PANEL</span><h1>Live Deriv terminal</h1></div>
            <button className={emergencyStopped ? "button primary" : "button danger"} onClick={emergencyStopped ? resumeTrading : emergencyStop}>
              {emergencyStopped ? "RESUME TRADING" : "EMERGENCY STOP"}
            </button>
          </div>
          <LiveMarketPanel compact selectedSymbol={symbol} onSymbolChange={setSymbol} />
          <div className="real-grid">
            <label>Stake amount (USD)<input value={stake} onChange={e => setStake(e.target.value)} type="number" min="0.01" step="0.01" disabled={emergencyStopped}/></label>
            <label>Deriv symbol<input value={symbol} onChange={e => setSymbol(e.target.value)} disabled={emergencyStopped}/></label>
          </div>
          <div className="real-actions">
            <button className="button primary" disabled={emergencyStopped} onClick={() => requestOrder("BUY")}>REAL BUY / CALL</button>
            <button className="button danger" disabled={emergencyStopped} onClick={() => requestOrder("SELL")}>REAL SELL / PUT</button>
          </div>
          {emergencyStopped && <div className="stop-notice">Emergency stop active. New real orders are blocked in this terminal.</div>}
          {message && <div className="error-panel">{message}</div>}
        </section>}
      </main>
    </div>
    {confirmOpen && <div className="confirm-backdrop"><div className="confirm-modal">
      <h2>Confirm real-money order</h2>
      <p>You are about to send a live Deriv order using real funds.</p>
      <div className="confirm-data"><b>{pendingSide === "BUY" ? "CALL" : "PUT"}</b><span>{symbol}</span><span>${Number(stake || 0).toFixed(2)} USD stake</span></div>
      <div className="confirm-actions"><button className="button" onClick={() => setConfirmOpen(false)}>CANCEL</button><button className="button danger" onClick={submitOrder}>CONFIRM &amp; SEND LIVE ORDER</button></div>
    </div></div>}
  </div>;
}
