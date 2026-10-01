const SUPABASE_URL = "https://qalowxnqngzsdlayqivr.supabase.co";
const SUPABASE_KEY = "sb_publishable_Fp2Y0kbwgE8z-ldpvhzmsw_zQMTxcPQ";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const appRoot = document.getElementById("app");

const state = {
  user: null,
  role: null,
  route: location.hash.slice(1) || "home",
  sandbox: null,
  balance: null,
  symbols: [],
  health: [],
  deriv: null,
  mt5: null,
  sessions: [],
  audit: []
};

const nav = [
  ["home","Home"],["trading","Trading"],["markets","Markets"],["positions","Positions"],
  ["orders","Orders"],["deriv","Deriv"],["mt5","MT5"],["sandbox","Sandbox"],
  ["wallet","Wallet"],["analytics","Analytics"],["operations","Operations"],
  ["security","Security"],["settings","Settings"]
];

const esc = (x) => String(x ?? "").replace(/[&<>"']/g, m => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[m]));

const money = (x) => x == null ? "—" : "$" + Number(x).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

function go(route) {
  state.route = route;
  location.hash = route;
  render();
}

function setError(message) {
  const el = document.getElementById("error");
  if (el) el.textContent = message || "";
}

async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Authentication did not return a user.");

  const { data: roles, error: roleError } = await db
    .from("user_roles").select("role").eq("user_id", data.user.id);
  if (roleError) throw roleError;

  const adminRole = (roles || []).find(r =>
    ["admin","risk_admin","finance_admin","support"].includes(r.role)
  );
  if (!adminRole) {
    await db.auth.signOut();
    throw new Error("Access denied: this account is not authorized for VELTRION.");
  }

  state.role = adminRole.role;

  const { error: sessionError } = await db.from("user_sessions").insert({
    user_id: data.user.id,
    status: "active",
    last_seen_at: new Date().toISOString()
  });
  if (sessionError) console.warn("Session record was not written:", sessionError.message);
}

function login() {
  appRoot.innerHTML = `
    <div class="login">
      <div class="card login-card">
        <div class="brand"><b>VELTRION</b><small>PRIVATE TRADING & FINANCIAL CONTROL</small></div>
        <div class="secure-badge">SECURE ADMIN ACCESS</div>
        <h2>Sign in</h2>
        <p class="muted">Authorized accounts only. There is no public registration.</p>
        <div id="error" class="error"></div>
        <form id="loginForm">
          <div class="field"><label>Email</label><input id="email" type="email" autocomplete="username" required></div>
          <div class="field"><label>Password</label><input id="password" type="password" autocomplete="current-password" required></div>
          <button id="submit" class="btn primary" style="width:100%">SIGN IN</button>
        </form>
        <p class="security-note">Supabase Auth + database authorization</p>
      </div>
    </div>`;
  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const button = document.getElementById("submit");
    button.disabled = true;
    button.textContent = "VERIFYING...";
    setError("");
    try {
      await signIn(document.getElementById("email").value.trim(), document.getElementById("password").value);
      await bootstrap();
      go("home");
    } catch (err) {
      setError(err?.message || "Sign-in failed.");
      await db.auth.signOut();
    } finally {
      button.disabled = false;
      button.textContent = "SIGN IN";
    }
  };
}

async function bootstrap() {
  if (!state.user) return;
  const uid = state.user.id;

  const results = await Promise.all([
    db.from("sandbox_accounts").select("id,currency,initial_capital,available_capital,allocated_capital,withdrawable,status,created_at,updated_at").eq("user_id",uid).maybeSingle(),
    db.from("sandbox_balances").select("id,sandbox_account_id,currency,cash,equity,updated_at").eq("user_id",uid).maybeSingle(),
    db.from("market_symbols").select("id,source,symbol,display_name,market,is_active,updated_at").eq("is_active",true).order("symbol").limit(40),
    db.from("service_health").select("service,status,latency_ms,last_success_at,last_failure_at,last_heartbeat_at,version,updated_at").order("service"),
    db.from("deriv_connections").select("status,last_success_at,last_failure_at,last_error,updated_at").eq("user_id",uid).maybeSingle(),
    db.from("mt5_connections").select("broker,server,login,environment,status,last_heartbeat_at,updated_at").eq("user_id",uid).maybeSingle(),
    db.from("user_sessions").select("id,status,last_seen_at,created_at,revoked_at").eq("user_id",uid).order("created_at",{ascending:false}).limit(10),
    db.from("audit_events").select("action,source,environment,result,created_at").eq("user_id",uid).order("created_at",{ascending:false}).limit(20)
  ]);

  state.sandbox = results[0].data || null;
  state.balance = results[1].data || null;
  state.symbols = results[2].data || [];
  state.health = results[3].data || [];
  state.deriv = results[4].data || null;
  state.mt5 = results[5].data || null;
  state.sessions = results[6].data || [];
  state.audit = results[7].data || [];
}

function stat(label,value,detail="",className="") {
  return `<div class="card stat"><div class="label">${esc(label)}</div><div class="value ${className}">${esc(value)}</div><div class="muted">${esc(detail)}</div></div>`;
}

function connectionBadge(connected) {
  return connected
    ? '<span class="pill good"><span class="dot"></span>CONNECTED</span>'
    : '<span class="pill"><span class="dot off"></span>NOT CONNECTED</span>';
}

function shell(body) {
  const items = nav.map(([id,label]) =>
    `<button class="${state.route===id?"active":""}" data-route="${id}">${label}</button>`).join("");
  return `
    <div class="shell">
      <aside class="side">
        <div class="brand"><b>VELTRION</b><small>PRIVATE TRADING PLATFORM</small></div>
        <div class="role">ROLE <strong>${esc((state.role||"ADMIN").toUpperCase())}</strong></div>
        <nav class="nav">${items}</nav>
        <button class="btn logout" id="logout">LOG OUT</button>
      </aside>
      <main class="main">
        <header class="top">
          <div><div class="label">VELTRION CONTROL CENTER</div><h1>${esc((nav.find(x=>x[0]===state.route)||["","Home"])[1])}</h1></div>
          <div class="status"><span class="dot"></span>AUTHENTICATED</div>
        </header>
        ${body}
      </main>
      <nav class="mobilebar">
        ${["home","markets","trading","wallet","operations"].map(id =>
          `<button class="${state.route===id?"active":""}" data-route="${id}">${nav.find(x=>x[0]===id)?.[1]||id}</button>`).join("")}
      </nav>
    </div>`;
}

function home() {
  const starting = state.sandbox?.initial_capital;
  const balance = state.balance?.equity ?? state.balance?.cash;
  const profit = starting != null && balance != null ? Number(balance)-Number(starting) : null;
  const derivConnected = state.deriv && ["connected","active","ready"].includes(String(state.deriv.status).toLowerCase());
  const mt5Connected = state.mt5 && ["connected","active","ready"].includes(String(state.mt5.status).toLowerCase());

  return `
    <section class="hero">
      <span class="pill"><span class="dot"></span>PHASE 1 FOUNDATION</span>
      <h2>Private trading control with verified backend state.</h2>
      <p class="muted">Sandbox figures are read from Supabase. Real Deriv and MT5 values appear only after an actual connection is recorded.</p>
      <div class="actions">
        <button class="btn primary" data-route="trading">OPEN TRADING</button>
        <button class="btn gold" data-route="deriv">CONNECT DERIV</button>
      </div>
    </section>
    <div class="grid cards" style="margin-top:15px">
      ${stat("Sandbox capital",money(starting),"Virtual capital only","gold")}
      ${stat("Sandbox equity",money(balance),"Supabase sandbox balance")}
      ${stat("Sandbox P/L",profit==null?"—":money(profit),"Derived from stored sandbox values",profit>=0?"green":"red")}
      ${stat("Withdrawable",money(state.sandbox?.withdrawable),"Not sandbox capital")}
    </div>
    <div class="grid two" style="margin-top:15px">
      <div class="card">
        <div class="section-head"><div><div class="label">Connections</div><h3>Provider status</h3></div></div>
        <div class="connection-row"><div><b>DERIV</b><span class="muted">${state.deriv?.status || "No connection record"}</span></div>${connectionBadge(!!derivConnected)}</div>
        <div class="connection-row"><div><b>MT5</b><span class="muted">${state.mt5?.status || "No connection record"}</span></div>${connectionBadge(!!mt5Connected)}</div>
      </div>
      <div class="card">
        <div class="label">Account control</div>
        <h3>Real-money separation</h3>
        <p class="muted">The sandbox account is isolated from real Deriv wallets, deposits, withdrawals and MT5 balances.</p>
      </div>
    </div>
    <div class="grid two" style="margin-top:15px">
      <div class="card"><div class="label">Market overview</div><table class="table"><thead><tr><th>Symbol</th><th>Source</th><th>Status</th></tr></thead><tbody>
        ${state.symbols.slice(0,8).map(x=>`<tr><td>${esc(x.symbol)}</td><td>${esc(x.source)}</td><td>ACTIVE</td></tr>`).join("") || '<tr><td colspan="3" class="empty">No active market symbols are synced.</td></tr>'}
      </tbody></table></div>
      <div class="card"><div class="label">Service health</div>
        ${state.health.map(x=>`<div class="health-row"><b>${esc(x.service)}</b><span>${esc(x.status||"unknown")}</span></div>`).join("") || '<div class="empty">No service health records.</div>'}
      </div>
    </div>`;
}

function page(title, subtitle, body) {
  return `<div class="card"><div class="label">${esc(title)}</div><h2>${esc(subtitle)}</h2>${body}</div>`;
}

function view() {
  if (state.route==="home") return home();
  if (state.route==="markets") return page("MARKETS","Verified market data",
    `<table class="table"><thead><tr><th>Symbol</th><th>Display</th><th>Market</th><th>Source</th></tr></thead><tbody>
    ${state.symbols.map(x=>`<tr><td>${esc(x.symbol)}</td><td>${esc(x.display_name)}</td><td>${esc(x.market)}</td><td>${esc(x.source)}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">No verified market symbols.</td></tr>'}</tbody></table>`);
  if (state.route==="deriv") return page("DERIV","Real-account integration",
    `<p class="muted">VELTRION never asks for a Deriv password. OAuth and provider tokens remain behind Supabase backend services.</p>
     <div class="connection-panel"><div><b>Connection status</b><p class="muted">${esc(state.deriv?.status || "not connected")}</p></div>${connectionBadge(state.deriv && ["connected","active","ready"].includes(String(state.deriv.status).toLowerCase()))}</div>
     ${state.deriv?.last_error ? `<div class="error">${esc(state.deriv.last_error)}</div>`:""}
     <button class="btn primary" id="derivConnect">CONNECT / REFRESH DERIV</button>`);
  if (state.route==="trading") return page("TRADING","Execution workspace",
    `<div class="grid two"><div class="card"><div class="label">Market stream</div><div class="chart">${state.symbols.length?"Verified symbols loaded from Supabase":"No verified market stream data"}</div></div>
     <div class="card"><div class="label">Sandbox order</div><p class="muted">Execution is backend-controlled. The browser cannot directly alter sandbox balances.</p><div class="field"><label>Symbol</label><select id="tradeSymbol">${state.symbols.map(x=>`<option>${esc(x.symbol)}</option>`).join("")}</select></div><div class="field"><label>Quantity</label><input id="tradeQty" type="number" min="0" step="0.01" placeholder="0.10"></div><button class="btn primary" id="sandboxOrder">SUBMIT SANDBOX ORDER</button></div></div>`);
  if (state.route==="sandbox") return page("SANDBOX","Virtual trading account",
    `<div class="grid cards">${stat("Initial capital",money(state.sandbox?.initial_capital),"Supabase")}${stat("Available capital",money(state.sandbox?.available_capital),"Supabase")}${stat("Equity",money(state.balance?.equity),"Supabase")}${stat("Allocated",money(state.sandbox?.allocated_capital),"Open sandbox allocation")}</div>
     <div class="card" style="margin-top:15px"><div class="label">Sandbox isolation</div><p class="muted">No sandbox value is represented as a real Deriv balance, real wallet balance or withdrawable customer funds.</p></div>`);
  if (state.route==="mt5") return page("MT5","Broker/server connection",
    state.mt5 ? `<div class="connection-panel"><div><b>${esc(state.mt5.broker||"Broker")}</b><p class="muted">${esc(state.mt5.server||"Server not specified")} · login ${esc(state.mt5.login||"—")}</p></div>${connectionBadge(["connected","active","ready"].includes(String(state.mt5.status).toLowerCase()))}</div>` :
    '<div class="empty">No live MT5 connection is recorded. No invented credentials or balances are shown.</div>');
  if (state.route==="security") return page("SECURITY","Sessions & audit visibility",
    `<div class="grid two"><div class="card"><div class="label">Recent sessions</div>${state.sessions.map(x=>`<div class="health-row"><b>${esc(x.status)}</b><span>${esc(x.created_at)}</span></div>`).join("")||'<div class="empty">No session records.</div>'}</div>
     <div class="card"><div class="label">Audit events</div>${state.audit.map(x=>`<div class="audit-row"><b>${esc(x.action)}</b><span>${esc(x.result||"recorded")} · ${esc(x.created_at)}</span></div>`).join("")||'<div class="empty">No audit events recorded for this account.</div>'}</div></div>`);
  if (state.route==="wallet") return page("WALLET","Real funds boundary",'<div class="empty">No real wallet balance is displayed until an authenticated provider wallet is recorded in Supabase.</div>');
  if (state.route==="analytics") return page("ANALYTICS","Performance and risk",'<div class="grid cards">'+stat("P/L","—","No audited sandbox performance yet")+stat("Win rate","—","No completed trades")+stat("Drawdown","—","No calculated series")+stat("Exposure","—","No open sandbox positions")+'</div>');
  if (state.route==="operations") return page("OPERATIONS","System health",
    state.health.map(x=>`<div class="health-card"><b>${esc(x.service)}</b><span class="pill">${esc(x.status||"unknown")}</span><p class="muted">Latency: ${esc(x.latency_ms ?? "—")} ms · Updated: ${esc(x.updated_at || "—")}</p></div>`).join("") || '<div class="empty">No health records.</div>');
  if (state.route==="positions") return page("POSITIONS","Sandbox positions",'<div class="empty">No sandbox positions recorded.</div>');
  if (state.route==="orders") return page("ORDERS","Sandbox orders",'<div class="empty">No sandbox orders recorded.</div>');
  if (state.route==="settings") return page("SETTINGS","Account controls",`<p class="muted">Authenticated role: <b>${esc(state.role||"—")}</b></p><p class="muted">Public registration is disabled at the application layer.</p>`);
  return page("VELTRION","Protected workspace",'<div class="empty">This module will render only verified backend records.</div>');
}

function bind() {
  document.querySelectorAll("[data-route]").forEach(el => el.onclick = () => go(el.dataset.route));
  document.getElementById("logout")?.addEventListener("click", async () => { await db.auth.signOut(); });
  document.getElementById("derivConnect")?.addEventListener("click", () => {
    location.href = SUPABASE_URL + "/functions/v1/deriv-oauth?action=start";
  });
  document.getElementById("sandboxOrder")?.addEventListener("click", () => {
    alert("Sandbox execution remains backend-controlled in Phase 1. No client-side balance mutation is permitted.");
  });
}

async function render() {
  if (!state.user) { login(); return; }
  appRoot.innerHTML = shell(view());
  bind();
}

db.auth.onAuthStateChange(async (_, session) => {
  state.user = session?.user || null;
  if (!state.user) { state.role = null; state.sandbox = null; state.balance = null; render(); return; }
  await bootstrap();
  render();
});

(async () => {
  const { data } = await db.auth.getSession();
  state.user = data.session?.user || null;
  if (state.user) {
    const { data: roles } = await db.from("user_roles").select("role").eq("user_id",state.user.id);
    state.role = (roles||[]).find(r=>["admin","risk_admin","finance_admin","support"].includes(r.role))?.role || null;
    if (!state.role) { await db.auth.signOut(); return; }
    await bootstrap();
  }
  render();
})();

window.addEventListener("hashchange", () => {
  state.route = location.hash.slice(1) || "home";
  render();
});