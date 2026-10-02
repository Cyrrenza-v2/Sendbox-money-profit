import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { api } from "../lib/api";

const navItems = [
  ["OVERVIEW", [
    ["Home", "/app/home", "⌂"],
  ]],
  ["TRADING", [
    ["Markets", "/app/trading/markets", "↗"],
    ["Positions", "/app/trading/positions", "◈"],
    ["Orders", "/app/trading/orders", "≡"],
    ["Trade History", "/app/trading/history", "◷"],
  ]],
  ["CONNECTIONS", [
    ["Deriv Connection", "/app/deriv/account", "⚡"],
    ["MT5 Infrastructure", "/app/mt5/overview", "▣"],
  ]],
  ["ACCOUNTS", [
    ["Sandbox Overview", "/app/sandbox/overview", "◇"],
    ["Real Account", "/app/real/account", "◆"],
    ["Profit Wallet", "/app/wallet/overview", "$"],
  ]],
  ["INTELLIGENCE", [
    ["Analytics", "/app/analytics/performance", "▥"],
  ]],
  ["CONTROL", [
    ["Operations", "/app/operations/health", "⚙"],
    ["Security", "/app/security/overview", "▣"],
    ["Settings", "/app/settings", "⌘"],
  ]],
];

export default function AppShell() {
  const [drawer, setDrawer] = useState(false);
  const [systemStatus, setSystemStatus] = useState("OFFLINE");
  const [mode, setMode] = useState("SANDBOX");
  const [realEnabled, setRealEnabled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api("/system/health");
        if (active) setSystemStatus(String(data.status || data.globalStatus || "LIVE").toUpperCase());
      } catch {
        if (active) setSystemStatus("OFFLINE");
      }
      try {
        const { data } = await supabase.from("app_settings")
          .select("trading_mode,real_trading_enabled")
          .order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (active && data) {
          setMode(String(data.trading_mode || "SANDBOX").toUpperCase());
          setRealEnabled(data.real_trading_enabled === true);
        }
      } catch {}
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const go = (path) => { navigate(path); setDrawer(false); };

  return <div className="shell">
    <aside className={`shell-sidebar ${drawer ? "open" : ""}`}>
      <div className="shell-brand"><b>VELTRION</b><span>COMMAND TERMINAL</span></div>
      <div className="shell-mode"><span>MODE</span><strong className={realEnabled ? "real" : ""}>{mode}</strong></div>
      <nav className="shell-nav">
        {navItems.map(([group, items]) => <React.Fragment key={group}>
          <div className="nav-heading">{group}</div>
          {items.map(([label, path, icon]) => <button key={path}
            className={location.pathname.startsWith(path) ? "active" : ""}
            onClick={() => go(path)}><i>{icon}</i><span>{label}</span></button>)}
        </React.Fragment>)}
      </nav>
      <button className="shell-logout" onClick={logout}>⇥ LOG OUT</button>
    </aside>
    {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} />}
    <div className="shell-main">
      <header className="shell-header">
        <button className="mobile-menu" onClick={() => setDrawer(true)}>☰</button>
        <div className="crumb">{location.pathname.replace(/^\/app\//, "").replaceAll("/", " / ").toUpperCase() || "HOME"}</div>
        <div className="header-actions">
          <span className={`health ${systemStatus.toLowerCase()}`}><b>●</b> SYSTEM {systemStatus}</span>
          <button className="icon-btn" onClick={() => go("/app/operations/alerts")}>♧</button>
          <span className="role-badge">ADMIN</span>
        </div>
      </header>
      <main className="shell-content"><Outlet /></main>
      <nav className="mobile-nav">
        <button onClick={() => go("/app/home")}>⌂<span>Home</span></button>
        <button onClick={() => go("/app/trading/markets")}>↗<span>Markets</span></button>
        <button onClick={() => go("/app/trading/positions")}>◈<span>Trade</span></button>
        <button onClick={() => go("/app/wallet/overview")}>$<span>Wallet</span></button>
        <button onClick={() => setDrawer(true)}>☰<span>Menu</span></button>
      </nav>
    </div>
  </div>;
}
