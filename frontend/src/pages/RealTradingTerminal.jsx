import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";
import { supabase } from "../supabaseClient";
import { api } from "../lib/api";

const REAL_TRADING_FUNCTION = "trading-service";

async function realRequest(body) {
  const { data, error } = await supabase.functions.invoke(REAL_TRADING_FUNCTION, { body });
  if (error) throw new Error(data?.error || error.message || "REAL_TRADING_REQUEST_FAILED");
  if (!data?.ok) throw new Error(data?.error || "REAL_TRADING_REQUEST_FAILED");
  return data.data;
}

export default function RealTradingTerminal() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [emergencyStopped, setEmergencyStopped] = useState(true);
  const [stake, setStake] = useState("10.00");
  const [growthRate, setGrowthRate] = useState("1");
  const [symbol, setSymbol] = useState("1HZ100V");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [connection, setConnection] = useState(null);
  const [realAccount, setRealAccount] = useState(null);
  const [marketPrice, setMarketPrice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadState() {
    try {
      const [{ data: controls }, deriv, snapshot] = await Promise.all([
        supabase.from("emergency_controls").select("control_key,is_active").order("control_key"),
        api("/deriv/status"),
        realRequest({ operation: "real_snapshot" }),
      ]);
      const stop = controls?.find(x => x.control_key === "EMERGENCY_STOP")?.is_active ?? true;
      const realControl = controls?.find(x => x.control_key === "REAL_TRADING")?.is_active ?? false;
      const derivState = deriv?.data || deriv || null;
      const account = snapshot?.balance || null;
      setEmergencyStopped(Boolean(stop));
      setConnection(derivState);
      setRealAccount(account);
      setArmed(!stop && realControl && String(derivState?.status || "").toLowerCase() === "connected");
    } catch (error) {
      setMessage(error?.message || "Unable to load real trading state.");
      setArmed(false);
    }
  }

  useEffect(() => { loadState(); }, []);

  async function arm() {
    setMessage("");
    try {
      const [state, snapshot] = await Promise.all([
        api("/deriv/status"),
        realRequest({ operation: "real_snapshot" }),
      ]);
      const status = String(state?.data?.status || "disconnected").toLowerCase();
      if (status !== "connected") throw new Error("DERIV_ACCOUNT_NOT_CONNECTED");
      setConnection(state?.data || state || null);
      setRealAccount(snapshot?.balance || null);
      setMessage("Authenticated real Deriv channel verified. Execution remains locked until every production safety control is released.");
      await loadState();
    } catch (error) {
      setMessage(error?.message || "REAL_ACCOUNT_VERIFICATION_FAILED");
      setArmed(false);
    }
  }

  async function setStop(active) {
    setMessage("");
    const { data, error } = await supabase.functions.invoke("admin-control", { body: { active } });
    if (error) { setMessage(data?.error || error.message); return; }
    setEmergencyStopped(active);
    if (active) setArmed(false);
    setMessage(active ? "Global emergency stop active. New real trading requests are blocked." : "Global emergency stop released. Other production safety locks remain enforced.");
  }

  function handleMarketTick(tick) {
    const price = Number(tick?.quote);
    setMarketPrice(Number.isFinite(price) ? price : null);
  }

  function requestBuy() {
    setMessage("");
    if (emergencyStopped) return setMessage("EMERGENCY_STOP_ACTIVE_OR_UNCONFIGURED");
    if (!armed) return setMessage("REAL_TRADING_GATE_LOCKED");
    if (!Number.isFinite(Number(marketPrice)) || Number(marketPrice) <= 0) {
      return setMessage("LIVE_MARKET_PRICE_NOT_AVAILABLE");
    }
    if (!Number.isFinite(Number(stake)) || Number(stake) <= 0) return setMessage("INVALID_STAKE");
    if (!Number.isFinite(Number(growthRate)) || Number(growthRate) <= 0) return setMessage("INVALID_GROWTH_RATE");
    setConfirmOpen(true);
  }

  async function submitBuy() {
    setConfirmOpen(false);
    if (submitting) return;
    setSubmitting(true);
    setMessage("Generating a real Deriv proposal. No order is sent until the proposal and safety gate both pass.");
    try {
      const amount = Number(stake);
      const growth = Number(growthRate);
      const proposalResult = await realRequest({
        operation: "accu_proposal",
        contract_template: {
          amount,
          basis: "stake",
          contract_type: "ACCU",
          currency: String(realAccount?.currency || "USD").toUpperCase(),
          growth_rate: growth,
          underlying_symbol: symbol,
        },
      });
      const proposal = proposalResult?.proposal || proposalResult?.data?.proposal || proposalResult?.data || proposalResult;
      const proposalId = String(proposal?.id || proposal?.proposal_id || "").trim();
      const maxPrice = Number(proposal?.ask_price ?? proposal?.display_value ?? proposal?.price);
      if (!proposalId) throw new Error("PROPOSAL_ID_REQUIRED");
      if (!Number.isFinite(maxPrice) || maxPrice <= 0) throw new Error("INVALID_MAX_PRICE");

      setMessage("Proposal verified. Sending the real buy request through the server-side trading gate…");
      const buyResult = await realRequest({
        operation: "buy",
        proposal_id: proposalId,
        price: maxPrice,
        stake: amount,
        symbol,
        client_order_id: crypto.randomUUID(),
      });
      const order = buyResult?.order || buyResult?.data?.order || null;
      const contractId = String(buyResult?.buy?.contract_id || order?.deriv_contract_id || "").trim();
      setMessage(`REAL BUY CONFIRMED · ${symbol} · stake ${amount.toFixed(2)} ${realAccount?.currency || "USD"}${contractId ? ` · contract ${contractId}` : ""}. Server-side safety gate and Deriv buy both returned successfully.`);
      await loadState();
    } catch (error) {
      setMessage(error?.message || "REAL_BUY_REJECTED");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="app-layout">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <div className="app-main">
      <header className="topbar">
        <button className="menu-button" onClick={() => setSidebarOpen(true)}>☰</button>
        <span className="topbar-brand">DERIV LIVE MARKET / REAL EXECUTION</span>
        <span className={armed ? "admin-badge real-badge" : "admin-badge"}>{armed ? "● REAL GATE READY" : "● SAFE LOCK"}</span>
      </header>
      <main className="content">
        {!armed ? <section className="panel real-warning">
          <span className="eyebrow real-eyebrow">DERIV / REAL ACCOUNT CONTROL</span>
          <h1>Verify real execution channel</h1>
          <p>Market data is public, but real execution is authenticated and server-side. The browser never receives the Deriv access token.</p>
          <ul>
            <li>OAuth state and PKCE are handled by the Supabase Deriv service.</li>
            <li>The real trading-service generates the proposal and performs the buy request.</li>
            <li>Every buy is checked by the production freeze, app control, account state, emergency stop, REAL_TRADING control, and Deriv kill switch.</li>
            <li>No real order is attempted while any safety control is locked.</li>
          </ul>
          <div className="panel"><b>Deriv connection:</b> {String(connection?.status || "NOT CONNECTED").toUpperCase()}</div>
          <div className="panel"><b>Real account:</b> {realAccount ? `${realAccount.loginid || realAccount.login || "CONNECTED"} · ${realAccount.currency || "USD"} · balance ${Number(realAccount.balance || 0).toFixed(2)}` : "NOT SYNCHRONIZED"}</div>
          <button className="button danger full" onClick={arm}>VERIFY REAL DERIV CHANNEL</button>
        </section> : <section className="panel">
          <div className="page-heading">
            <div><span className="eyebrow real-eyebrow">AUTHENTICATED DERIV / REAL EXECUTION</span><h1>Live market → real buy path</h1></div>
            <button className={emergencyStopped ? "button primary" : "button danger"} onClick={() => setStop(!emergencyStopped)}>
              {emergencyStopped ? "RELEASE GLOBAL STOP" : "EMERGENCY STOP"}
            </button>
          </div>
          <LiveMarketPanel compact selectedSymbol={symbol} onSymbolChange={setSymbol} onPriceChange={handleMarketTick} />
          <div className="panel"><b>Execution path:</b> Live Deriv price → ACCU proposal → server-side production safety gate → authenticated Deriv buy → real_orders record. <b>No sandbox order is used.</b></div>
          <div className="real-grid">
            <label>Stake amount (USD)<input value={stake} onChange={e => setStake(e.target.value)} type="number" min="0.01" step="0.01" disabled={emergencyStopped}/></label>
            <label>ACCU growth rate<input value={growthRate} onChange={e => setGrowthRate(e.target.value)} type="number" min="0.01" step="0.01" disabled={emergencyStopped}/></label>
            <label>Deriv symbol<input value={symbol} onChange={e => setSymbol(e.target.value)} disabled={emergencyStopped}/></label>
          </div>
          <div className="real-actions">
            <button className="button primary" disabled={emergencyStopped || submitting} onClick={requestBuy}>{submitting ? "EXECUTING…" : "BUY REAL ACCU"}</button>
          </div>
          {emergencyStopped && <div className="stop-notice">Global emergency stop is active. New real trading requests are blocked.</div>}
          {message && <div className={message.includes("REAL BUY CONFIRMED") || message.includes("channel verified") ? "panel" : "error-panel"}>{message}</div>}
        </section>}
      </main>
    </div>
    {confirmOpen && <div className="confirm-backdrop"><div className="confirm-modal">
      <h2>Confirm real buy request</h2>
      <p>This request can place a real-money Deriv contract if and only if every server-side production safety control is released. No sandbox service is called.</p>
      <div className="confirm-data"><b>ACCU BUY</b><span>{symbol}</span><span>${Number(stake || 0).toFixed(2)} USD stake · growth {Number(growthRate || 0).toFixed(2)}%</span></div>
      <div className="confirm-actions"><button className="button" onClick={() => setConfirmOpen(false)}>CANCEL</button><button className="button danger" disabled={submitting} onClick={submitBuy}>{submitting ? "EXECUTING…" : "CONFIRM REAL BUY"}</button></div>
    </div></div>}
  </div>;
}
