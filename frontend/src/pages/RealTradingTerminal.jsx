import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { supabase } from "../supabaseClient";
import { api } from "../lib/api";
import { sandboxEngine } from "../services/sandboxEngine";

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
  const [sandboxAccount, setSandboxAccount] = useState(null);
  const [marketPrice, setMarketPrice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const markInFlightRef = useRef(false);
  const lastMarkAtRef = useRef(0);
  const contractLabel = side => String(side || "").toUpperCase() === "SELL" ? "PUT" : "CALL";

  async function loadState() {
    try {
      const [{ data: controls }, deriv, sandbox] = await Promise.all([
        supabase.from("emergency_controls").select("control_key,is_active").order("control_key"),
        api("/deriv/status"),
        sandboxEngine.snapshot(),
      ]);
      const stop = controls?.find(x => x.control_key === "EMERGENCY_STOP")?.is_active ?? true;
      setEmergencyStopped(Boolean(stop));
      const derivState = deriv?.data || deriv || null;
      setConnection(derivState);
      const accounts = sandbox?.data?.accounts || [];
      const activeAccount = accounts.find(a => String(a.status).toLowerCase() === "active") || accounts[0] || null;
      setSandboxAccount(activeAccount);
      setArmed(!Boolean(stop) && String(derivState?.status || "disconnected").toLowerCase() === "connected" && Boolean(activeAccount?.id));
    } catch (error) {
      setMessage(error?.message || "Unable to load trading state.");
    }
  }

  useEffect(() => { loadState(); }, []);

  async function arm() {
    setMessage("");
    try {
      const [state, sandbox] = await Promise.all([api("/deriv/status"), sandboxEngine.snapshot()]);
      const status = String(state?.data?.status || "disconnected").toLowerCase();
      if (status !== "connected") throw new Error("DERIV_ACCOUNT_NOT_CONNECTED");
      const accounts = sandbox?.data?.accounts || [];
      const activeAccount = accounts.find(a => String(a.status).toLowerCase() === "active") || accounts[0] || null;
      if (!activeAccount?.id) throw new Error("SANDBOX_ACCOUNT_NOT_AVAILABLE");
      if (emergencyStopped) throw new Error("GLOBAL_EMERGENCY_STOP_ACTIVE");
      setConnection(state?.data || state || null);
      setSandboxAccount(activeAccount);
      setArmed(true);
      setMessage("Deriv account connected. Live market data will execute against VELTRION sandbox funds only.");
    } catch (error) {
      setMessage(error?.message || "SANDBOX_CONNECT_FAILED");
    }
  }

  async function setStop(active) {
    setMessage("");
    const { data, error } = await supabase.functions.invoke("admin-control", { body: { active } });
    if (error) { setMessage(data?.error || error.message); return; }
    setEmergencyStopped(active);
    if (active) setArmed(false);
    setMessage(active ? "Global emergency stop active. New trading requests are blocked." : "Global emergency stop released. Per-mode locks remain enforced.");
  }

  async function handleMarketTick(tick) {
    const price = Number(tick?.quote);
    setMarketPrice(Number.isFinite(price) ? price : null);
    if (!sandboxAccount?.id || !symbol || !Number.isFinite(price) || price <= 0) return;
    const now = Date.now();
    if (markInFlightRef.current || now - lastMarkAtRef.current < 1000) return;
    lastMarkAtRef.current = now;
    markInFlightRef.current = true;
    try {
      await sandboxEngine.mark({ symbol, price });
    } catch {
      // Position marking is best-effort; the next live tick retries automatically.
    } finally {
      markInFlightRef.current = false;
    }
  }

  function requestOrder(side) {
    if (!armed || emergencyStopped) return;
    if (!sandboxAccount?.id) {
      setMessage("SANDBOX_ACCOUNT_NOT_AVAILABLE");
      return;
    }
    if (!Number.isFinite(Number(marketPrice)) || Number(marketPrice) <= 0) {
      setMessage("LIVE_MARKET_PRICE_NOT_AVAILABLE");
      return;
    }
    setPendingSide(side);
    setConfirmOpen(true);
  }

  async function submitOrder() {
    const side = String(pendingSide || "").toUpperCase();
    const expectedContract = contractLabel(side);
    setConfirmOpen(false);
    if (!["BUY", "SELL"].includes(side) || !armed || emergencyStopped || submitting) return;
    setSubmitting(true);
    setMessage("Executing with VELTRION sandbox funds at the current Deriv market price…");
    try {
      if (!sandboxAccount?.id) throw new Error("SANDBOX_ACCOUNT_NOT_AVAILABLE");
      if (!Number.isFinite(Number(marketPrice)) || Number(marketPrice) <= 0) throw new Error("LIVE_MARKET_PRICE_NOT_AVAILABLE");
      const result = await sandboxEngine.executeOrder({
        account_id: sandboxAccount.id,
        symbol,
        side,
        quantity: Number(stake),
        price: Number(marketPrice),
        idempotency_key: crypto.randomUUID(),
      });
      const order = result?.order || result?.data?.order || result?.data || result;
      const persistedSide = String(order?.side || side).toUpperCase();
      if (persistedSide !== side) throw new Error(`SANDBOX_DIRECTION_MISMATCH: requested ${side}, persisted ${persistedSide}`);
      await loadState();
      setMessage(`Sandbox order executed using VELTRION internal funds. ${expectedContract} (${side}) ${symbol} at ${Number(marketPrice).toLocaleString("en-US", { maximumFractionDigits: 8 })}. No real Deriv money was used.${order?.id ? ` Order ID: ${order.id}` : ""}`);
    } catch (error) {
      setMessage(error?.message || "SANDBOX_ORDER_REJECTED");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="app-layout">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <div className="app-main">
      <header className="topbar">
        <button className="menu-button" onClick={() => setSidebarOpen(true)}>☰</button>
        <span className="topbar-brand">DERIV LIVE MARKET / SANDBOX TERMINAL</span>
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
            <li>Execution uses VELTRION internal sandbox funds; no real-money Deriv contract is sent.</li>
          </ul>
          <div className="panel"><b>Deriv connection:</b> {String(connection?.status || "NOT CONNECTED").toUpperCase()}</div>
          <button className="button danger full" onClick={arm}>CONNECT DERIV + SANDBOX</button>
        </section> : <section className="panel">
          <div className="page-heading">
            <div><span className="eyebrow real-eyebrow">AUTHENTICATED DERIV MARKET / VELTRION SANDBOX</span><h1>Live market → sandbox execution</h1></div>
            <button className={emergencyStopped ? "button primary" : "button danger"} onClick={() => setStop(!emergencyStopped)}>
              {emergencyStopped ? "RELEASE GLOBAL STOP" : "EMERGENCY STOP"}
            </button>
          </div>
          <LiveMarketPanel compact selectedSymbol={symbol} onSymbolChange={setSymbol} onPriceChange={handleMarketTick} />
          <div className="panel"><b>Execution path:</b> Real Deriv market price → VELTRION sandbox funds → sandbox order → sandbox position/P&amp;L. <b>No real Deriv order is sent.</b></div>
          <div className="real-grid">
            <label>Stake amount (USD)<input value={stake} onChange={e => setStake(e.target.value)} type="number" min="0.01" step="0.01" disabled={emergencyStopped}/></label>
            <label>Deriv symbol<input value={symbol} onChange={e => setSymbol(e.target.value)} disabled={emergencyStopped}/></label>
          </div>
          <div className="real-actions">
            <button className="button primary" disabled={emergencyStopped} onClick={() => requestOrder("BUY")}>VALIDATE BUY / CALL</button>
            <button className="button danger" disabled={emergencyStopped} onClick={() => requestOrder("SELL")}>VALIDATE SELL / PUT</button>
          </div>
          {emergencyStopped && <div className="stop-notice">Global emergency stop is active. New trading requests are blocked.</div>}
          {message && <div className={message.includes("Sandbox order executed") || message.startsWith("Deriv account verified") ? "panel" : "error-panel"}>{message}</div>}
        </section>}
      </main>
    </div>
    {confirmOpen && <div className="confirm-backdrop"><div className="confirm-modal">
      <h2>Confirm trading request</h2>
      <p>This order will use VELTRION internal sandbox funds and the current live Deriv market price. It will not place a real-money Deriv contract.</p>
      <div className="confirm-data"><b>{contractLabel(pendingSide)} ({String(pendingSide || "").toUpperCase()})</b><span>{symbol}</span><span>${Number(stake || 0).toFixed(2)} USD stake</span></div>
      <div className="confirm-actions"><button className="button" onClick={() => setConfirmOpen(false)}>CANCEL</button><button className="button danger" disabled={submitting} onClick={submitOrder}>{submitting ? "EXECUTING…" : "CONFIRM REQUEST"}</button></div>
    </div></div>}
  </div>;
}
