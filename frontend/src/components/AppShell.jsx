import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../supabaseClient";

const navGroups = [
  { label: "COMMAND", items: [["Home","/app/home","⌂"],["Trading Terminal","/app/trading/terminal","▥"],["Markets","/app/trading/markets","↗"],["Positions","/app/trading/positions","◈"],["Orders","/app/trading/orders","≋"],["Trade History","/app/trading/history","◷"],["AI Market Assistant","/app/trading/ai","✦"]] },
  { label: "ACCOUNTS & INFRASTRUCTURE", items: [["Deriv Connection","/app/deriv/account","⚡"],["MT5 Infrastructure","/app/mt5/overview","▦"],["Sandbox","/app/sandbox/overview","◇"],["Real Account","/app/real/account","▣"],["Profit Wallet","/app/wallet/overview","$"]] },
  { label: "CONTROL", items: [["Analytics","/app/analytics/performance","▥"],["Operations","/app/operations/health","⚙"],["Security","/app/security/overview","⬡"],["Settings","/app/settings","☷"]] },
];

async function fetchSystemHealth() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/system-health`, {
    method: "GET",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, Accept: "application/json" },
    cache: "no-store",
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error("Invalid system health response"); }
  if (!response.ok) throw new Error(data?.error || `System health HTTP ${response.status}`);
  return data;
}

export default function AppShell() {
  const [drawerOpen,setDrawerOpen]=useState(false), [health,setHealth]=useState("CHECKING"), [mode,setMode]=useState("SANDBOX"), [userEmail,setUserEmail]=useState("");
  const location=useLocation(), navigate=useNavigate();
  const pageName=useMemo(()=>{ const all=navGroups.flatMap(g=>g.items); return all.find(([,path])=>path===location.pathname)?.[0] || (location.pathname.endsWith("alerts")?"Operations Alerts":"VELTRION"); },[location.pathname]);

  useEffect(()=>{ let alive=true; async function refresh(){ try { const data=await fetchSystemHealth(); const status=String(data?.globalStatus||data?.status||(data?.ok?"LIVE":"DEGRADED")).toUpperCase(); if(alive)setHealth(["OK","HEALTHY","ONLINE","LIVE","CONNECTED"].includes(status)?"LIVE":status.includes("DEGRAD")?"DEGRADED":"OFFLINE"); } catch { if(alive)setHealth("OFFLINE"); } } refresh(); const timer=window.setInterval(refresh,30000); return()=>{alive=false;window.clearInterval(timer)}; },[]);
  useEffect(()=>{let alive=true; supabase.auth.getUser().then(({data})=>{if(alive)setUserEmail(data?.user?.email||"Authorized admin")}); return()=>{alive=false}},[]);
  async function logout(){await supabase.auth.signOut();navigate("/login",{replace:true})}
  function go(path){navigate(path);setDrawerOpen(false)}
  const sidebar=<aside className={`vel-sidebar ${drawerOpen?"is-open":""}`}>
    <div className="vel-brand-row"><div><div className="vel-brand">VELTRION</div><div className="vel-brand-sub">COMMAND TERMINAL</div></div><span className={`vel-mode ${mode==="REAL"?"is-real":""}`}>{mode}</span><button className="vel-close" onClick={()=>setDrawerOpen(false)} aria-label="Close menu">×</button></div>
    <div className="vel-nav-scroll">{navGroups.map(group=><section className="vel-nav-group" key={group.label}><div className="vel-nav-label">{group.label}</div>{group.items.map(([label,path,icon])=><button key={path} className={`vel-nav-item ${location.pathname===path||(path!=="/app/home"&&location.pathname.startsWith(path))?"active":""}`} onClick={()=>go(path)}><span className="vel-nav-icon">{icon}</span><span>{label}</span></button>)}</section>)}</div>
    <div className="vel-sidebar-bottom"><div className="vel-session"><span className="vel-session-dot" /> SESSION AUTHENTICATED</div><button className="vel-logout" onClick={logout}>↪ &nbsp; Log Out</button></div>
  </aside>;
  return <div className="vel-app">{drawerOpen&&<button className="vel-drawer-backdrop" onClick={()=>setDrawerOpen(false)} aria-label="Close navigation"/>}{sidebar}<div className="vel-main">
    <header className="vel-topbar"><button className="vel-menu-toggle" onClick={()=>setDrawerOpen(true)} aria-label="Open navigation">☰</button><div className="vel-breadcrumb"><span>VELTRION</span><i>/</i><strong>{pageName}</strong></div><div className="vel-topbar-right"><div className={`vel-health health-${health.toLowerCase()}`}><span/> SYSTEM {health}</div><button className="vel-mode-switch" onClick={()=>setMode(current=>current==="SANDBOX"?"REAL":"SANDBOX")} title="Display mode only; this does not enable trading">{mode} MODE <span>⌄</span></button><div className="vel-user"><span className="vel-avatar">A</span><div><b>ADMIN</b><small>{userEmail||"Authenticated"}</small></div></div></div></header>
    <main className="vel-content"><Outlet/></main>
    <nav className="vel-mobile-nav"><button onClick={()=>go("/app/home")} className={location.pathname==="/app/home"?"active":""}><span>⌂</span>Home</button><button onClick={()=>go("/app/trading/markets")} className={location.pathname.startsWith("/app/trading/markets")?"active":""}><span>↗</span>Markets</button><button onClick={()=>go("/app/trading/positions")} className={location.pathname.startsWith("/app/trading/positions")?"active":""}><span>◈</span>Portfolio</button><button onClick={()=>go("/app/wallet/overview")} className={location.pathname.startsWith("/app/wallet")?"active":""}><span>$</span>Wallet</button><button onClick={()=>setDrawerOpen(true)}><span>☰</span>Menu</button></nav>
  </div></div>;
}
