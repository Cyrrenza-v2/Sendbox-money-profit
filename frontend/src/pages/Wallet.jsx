import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const money = (v, currency = "USD") =>
  Number(v || 0).toLocaleString("en-US", { style: "currency", currency });

function makeIdempotencyKey(prefix = "wallet") {
  if (crypto?.randomUUID) return prefix + "_" + crypto.randomUUID();
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2);
}

export default function Wallet() {
  const [state, setState] = useState({ loading: true, error: "", account: null, wallet: null, withdrawals: [], deposits: [] });
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    setState(s => ({ ...s, loading: true, error: "" }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState(s => ({ ...s, loading: false, error: "AUTH_REQUIRED" }));
      return;
    }
    try {
      const { data: account, error: accountError } = await supabase
        .from("real_trading_accounts")
        .select("id,currency,balance,equity,is_active,emergency_stopped")
        .eq("user_id", user.id)
        .maybeSingle();
      if (accountError) throw accountError;
      if (!account) {
        setState({ loading: false, error: "", account: null, wallet: null, withdrawals: [], deposits: [] });
        return;
      }
      const { data: wallet, error: walletError } = await supabase
        .from("real_profit_wallets")
        .select("id,available_balance,reserved_balance,currency,updated_at")
        .eq("account_id", account.id)
        .maybeSingle();
      if (walletError) throw walletError;
      if (!wallet) {
        setState({ loading: false, error: "", account, wallet: null, withdrawals: [], deposits: [] });
        return;
      }
      const [w, d] = await Promise.all([
        supabase.from("withdrawals").select("id,amount,status,destination_type,provider_reference,requested_at,completed_at").eq("wallet_id", wallet.id).order("requested_at", { ascending: false }).limit(20),
        supabase.from("wallet_deposit_intents").select("id,amount,currency,status,provider_reference,created_at,processed_at").eq("wallet_id", wallet.id).order("created_at", { ascending: false }).limit(20)
      ]);
      if (w.error) throw w.error;
      if (d.error) throw d.error;
      setState({ loading: false, error: "", account, wallet, withdrawals: w.data || [], deposits: d.data || [] });
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e?.message || "WALLET_LOAD_FAILED" }));
    }
  }

  useEffect(() => { load(); }, []);

  const wallet = state.wallet;
  const available = Number(wallet?.available_balance || 0);
  const reserved = Number(wallet?.reserved_balance || 0);
  const withdrawable = Math.max(0, available - reserved);

  async function createDepositIntent() {
    setBusy(true); setNotice(""); 
    try {
      const amount = Number(depositAmount);
      if (!wallet || !Number.isFinite(amount) || amount <= 0) throw new Error("INVALID_DEPOSIT_AMOUNT");
      const { data, error } = await supabase.rpc("create_wallet_deposit_intent", {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_currency: wallet.currency,
        p_idempotency_key: makeIdempotencyKey("deposit")
      });
      if (error) throw error;
      setDepositAmount("");
      setNotice("Deposit intent created. No funds were credited; provider settlement is still required.");
      await load();
      return data;
    } catch (e) {
      setNotice(e?.message || "DEPOSIT_INTENT_FAILED");
    } finally { setBusy(false); }
  }

  async function requestWithdrawal() {
    setBusy(true); setNotice("");
    try {
      const amount = Number(withdrawAmount);
      if (!wallet || !Number.isFinite(amount) || amount <= 0 || amount > withdrawable) throw new Error("INVALID_WITHDRAWAL_AMOUNT");
      if (!destination.trim()) throw new Error("AUTHORIZED_DESTINATION_REQUIRED");
      const { error } = await supabase.rpc("request_profit_withdrawal", {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_destination: destination.trim()
      });
      if (error) throw error;
      setWithdrawAmount(""); setDestination("");
      setNotice("Withdrawal requested and reserved. Settlement requires an authorized payment provider.");
      await load();
    } catch (e) {
      setNotice(e?.message || "WITHDRAWAL_REQUEST_FAILED");
    } finally { setBusy(false); }
  }

  if (state.loading) return <div className="vel-page"><div className="vel-panel"><div className="loading-panel">Loading secure wallet…</div></div></div>;

  return <div className="vel-page">
    <div className="vel-page-heading">
      <div><div className="vel-eyebrow">VELTRION / WALLET</div><h1>Wallet</h1><p>Funding and withdrawals are kept separate from trading positions. Sandbox funds can never become withdrawable cash.</p></div>
      <span className="vel-data-source">REAL WALLET · PROVIDER SETTLEMENT REQUIRED</span>
    </div>

    {state.error && <div className="vel-error" role="status">{state.error}</div>}
    {notice && <div className="vel-panel wallet-notice">{notice}</div>}

    {!state.account && !state.error && <div className="vel-panel"><div className="vel-state"><div className="vel-state-mark">—</div><h3>Real wallet not provisioned</h3><p>Connect and verify a real account before a real wallet can be funded.</p></div></div>}

    {state.account && <><div className="metric-grid wallet-metrics">
      <div className="metric-card"><small>AVAILABLE</small><strong>{money(available, wallet?.currency || state.account.currency)}</strong><span>Reconciled wallet balance</span></div>
      <div className="metric-card"><small>RESERVED</small><strong>{money(reserved, wallet?.currency || state.account.currency)}</strong><span>Pending withdrawal reservations</span></div>
      <div className="metric-card"><small>WITHDRAWABLE</small><strong className="positive">{money(withdrawable, wallet?.currency || state.account.currency)}</strong><span>Available minus reservations</span></div>
      <div className="metric-card"><small>TRADING BALANCE</small><strong>{money(state.account.balance, state.account.currency)}</strong><span>Separate broker account balance</span></div>
    </div>

    {!wallet ? <div className="vel-panel"><div className="vel-state"><div className="vel-state-mark">!</div><h3>Wallet ledger not provisioned</h3><p>The real account exists, but no profit wallet ledger is attached yet. No deposit or withdrawal can be initiated from VELTRION.</p></div></div> :
    <><section className="vel-panel wallet-actions">
      <div className="vel-panel-title">FUNDING</div>
      <div className="wallet-security-note"><span>SECURE FLOW</span><p>This creates a funding intent only. It does not credit the wallet. A payment provider must confirm settlement before funds enter the ledger.</p></div>
      <div className="real-grid"><label>Deposit amount ({wallet.currency})<input value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} type="number" min="0.01" step="0.01" disabled={busy}/></label><div className="wallet-provider-box"><b>Payment provider</b><span>NOT CONNECTED</span><small>Provider integration is required before real funds can be accepted.</small></div></div>
      <button className="button primary full" onClick={createDepositIntent} disabled={busy || !depositAmount}>{busy ? "CREATING…" : "CREATE DEPOSIT INTENT"}</button>
    </section>

    <section className="vel-panel wallet-actions">
      <div className="vel-panel-title">WITHDRAWAL</div>
      <div className="real-grid"><label>Amount ({wallet.currency})<input value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} type="number" min="0.01" step="0.01" max={withdrawable} disabled={busy || withdrawable<=0}/></label><label>Authorized destination reference<input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Provider-issued destination token/reference" disabled={busy || withdrawable<=0}/></label></div>
      <button className="button primary full" onClick={requestWithdrawal} disabled={busy || withdrawable<=0 || !withdrawAmount || !destination.trim()}>{busy ? "RESERVING…" : "REQUEST WITHDRAWAL"}</button>
      <p className="wallet-footnote">Requests reserve funds atomically. Settlement is not performed by the browser.</p>
    </section>

    <section className="vel-panel"><div className="vel-panel-title">DEPOSIT ACTIVITY</div>{state.deposits.length ? state.deposits.map(d=><div className="audit-row" key={d.id}><span>{money(d.amount,d.currency)} · DEPOSIT INTENT</span><span>{String(d.status).toUpperCase()} · {new Date(d.created_at).toLocaleString()}</span></div>) : <div className="empty">No deposit intents.</div>}</section>
    <section className="vel-panel"><div className="vel-panel-title">WITHDRAWAL ACTIVITY</div>{state.withdrawals.length ? state.withdrawals.map(w=><div className="audit-row" key={w.id}><span>{money(w.amount,wallet.currency)} · {w.destination_type || "AUTHORIZED ROUTE"}</span><span>{String(w.status).toUpperCase()} · {new Date(w.requested_at).toLocaleString()}</span></div>) : <div className="empty">No withdrawal requests.</div>}</section>
    </>}
    </>}
  </div>;
}
