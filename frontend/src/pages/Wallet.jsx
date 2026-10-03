import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const money = (v, currency = "USD") =>
  Number(v || 0).toLocaleString("en-US", { style: "currency", currency });

export default function Wallet() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    account: null,
    wallet: null,
    withdrawals: []
  });
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
        setState({ loading: false, error: "", account: null, wallet: null, withdrawals: [] });
        return;
      }

      const { data: wallet, error: walletError } = await supabase
        .from("real_profit_wallets")
        .select("id,available_balance,reserved_balance,currency,updated_at")
        .eq("account_id", account.id)
        .maybeSingle();
      if (walletError) throw walletError;
      if (!wallet) {
        setState({ loading: false, error: "", account, wallet: null, withdrawals: [] });
        return;
      }

      const { data: withdrawals, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("id,amount,status,destination_type,provider_reference,requested_at,completed_at")
        .eq("wallet_id", wallet.id)
        .order("requested_at", { ascending: false })
        .limit(20);
      if (withdrawalError) throw withdrawalError;

      setState({
        loading: false,
        error: "",
        account,
        wallet,
        withdrawals: withdrawals || []
      });
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        error: e?.message || "WALLET_LOAD_FAILED"
      }));
    }
  }

  useEffect(() => { load(); }, []);

  const wallet = state.wallet;
  const available = Number(wallet?.available_balance || 0);
  const reserved = Number(wallet?.reserved_balance || 0);
  const withdrawable = Math.max(0, available - reserved);

  async function requestWithdrawal() {
    setBusy(true);
    setNotice("");
    try {
      const amount = Number(withdrawAmount);
      if (!wallet || !Number.isFinite(amount) || amount <= 0 || amount > withdrawable) {
        throw new Error("INVALID_WITHDRAWAL_AMOUNT");
      }
      if (!destination.trim()) throw new Error("AUTHORIZED_DESTINATION_REQUIRED");

      const { data, error } = await supabase.functions.invoke("profit-withdrawal-request", {
        body: {
          wallet_id: wallet.id,
          amount,
          destination: destination.trim()
        }
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "WITHDRAWAL_REQUEST_FAILED");

      setWithdrawAmount("");
      setDestination("");
      setNotice("Withdrawal requested and reserved. Profit settlement is handled through the authorized Sendbox withdrawal flow.");
      await load();
    } catch (e) {
      setNotice(e?.message || "WITHDRAWAL_REQUEST_FAILED");
    } finally {
      setBusy(false);
    }
  }

  if (state.loading) {
    return (
      <div className="vel-page">
        <div className="vel-panel">
          <div className="loading-panel">Loading secure wallet…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vel-page">
      <div className="vel-page-heading">
        <div>
          <div className="vel-eyebrow">VELTRION / WALLET</div>
          <h1>Profit Wallet</h1>
          <p>Tracks realized Sendbox trading profits and controlled withdrawals. VELTRION does not accept deposits.</p>
        </div>
        <span className="vel-data-source">SEND BOX PROFIT WALLET · WITHDRAWAL CONTROLLED</span>
      </div>

      {state.error && <div className="vel-error" role="status">{state.error}</div>}
      {notice && <div className="vel-panel wallet-notice">{notice}</div>}

      {!state.account && !state.error && (
        <div className="vel-panel">
          <div className="vel-state">
            <div className="vel-state-mark">—</div>
            <h3>Real trading account not connected</h3>
            <p>Connect and verify the Sendbox real trading account before a profit wallet can be used.</p>
          </div>
        </div>
      )}

      {state.account && (
        <>
          <div className="metric-grid wallet-metrics">
            <div className="metric-card">
              <small>AVAILABLE PROFIT</small>
              <strong>{money(available, wallet?.currency || state.account.currency)}</strong>
              <span>Realized profit available for withdrawal</span>
            </div>
            <div className="metric-card">
              <small>RESERVED</small>
              <strong>{money(reserved, wallet?.currency || state.account.currency)}</strong>
              <span>Pending withdrawal reservations</span>
            </div>
            <div className="metric-card">
              <small>WITHDRAWABLE</small>
              <strong className="positive">{money(withdrawable, wallet?.currency || state.account.currency)}</strong>
              <span>Available profit minus reservations</span>
            </div>
            <div className="metric-card">
              <small>TRADING BALANCE</small>
              <strong>{money(state.account.balance, state.account.currency)}</strong>
              <span>Separate Sendbox trading account balance</span>
            </div>
          </div>

          {!wallet ? (
            <div className="vel-panel">
              <div className="vel-state">
                <div className="vel-state-mark">!</div>
                <h3>Profit wallet ledger not provisioned</h3>
                <p>The Sendbox real account exists, but no profit wallet ledger is attached yet. No withdrawal can be initiated from VELTRION.</p>
              </div>
            </div>
          ) : (
            <>
              <section className="vel-panel wallet-actions">
                <div className="vel-panel-title">WITHDRAW REALIZED PROFIT</div>
                <div className="wallet-security-note">
                  <span>SEND BOX CONTROLLED</span>
                  <p>Only realized profit recorded in the profit wallet is withdrawable. Trading balance and open-position value remain separate.</p>
                </div>
                <div className="real-grid">
                  <label>
                    Amount ({wallet.currency})
                    <input
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={withdrawable}
                      disabled={busy || withdrawable <= 0}
                    />
                  </label>
                  <label>
                    Authorized withdrawal destination
                    <input
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder="Sendbox-authorized destination reference"
                      disabled={busy || withdrawable <= 0}
                    />
                  </label>
                </div>
                <button
                  className="button primary full"
                  onClick={requestWithdrawal}
                  disabled={busy || withdrawable <= 0 || !withdrawAmount || !destination.trim()}
                >
                  {busy ? "RESERVING…" : "REQUEST PROFIT WITHDRAWAL"}
                </button>
                <p className="wallet-footnote">Requests reserve profit atomically. Final settlement is performed through the authorized Sendbox withdrawal flow, not by the browser.</p>
              </section>

              <section className="vel-panel">
                <div className="vel-panel-title">WITHDRAWAL ACTIVITY</div>
                {state.withdrawals.length ? state.withdrawals.map(w => (
                  <div className="audit-row" key={w.id}>
                    <span>{money(w.amount, wallet.currency)} · {w.destination_type || "SEND BOX ROUTE"}</span>
                    <span>{String(w.status).toUpperCase()} · {new Date(w.requested_at).toLocaleString()}</span>
                  </div>
                )) : <div className="empty">No withdrawal requests.</div>}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
