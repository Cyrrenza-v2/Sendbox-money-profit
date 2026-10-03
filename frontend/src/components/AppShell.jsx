import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../supabaseClient";

const secondaryGroups=[
 {label:"TRADING",items:[["AI Market Assistant","/app/trading/ai","✦"],["Orders","/app/trading/orders","≋"],["Trade History","/app/trading/history","◷"],["Deriv Connection","/app/deriv/account","⚡"],["MT5 Infrastructure","/app/mt5/overview","▦"]]},
 {label:"ACCOUNT",items:[["Real Account","/app/real/account","▣"],["Analytics","/app/analytics/performance","▥"],["Operations & Health","/app/operations/health","⚙"],["Security","/app/security/overview","⬡"],["Settings","/app/settings","☷"]]}
];
const primary=[["Home","/app/home","⌂"],["Markets","/app/trading/markets","↗"],["Wallet","/app/wallet/overview","$"],["Portfolio","/app/trading/positions","◈"]];

async function fetchSystemHealth(){
 const response=await fetch(SUPABASE_URL+"/functions/v1/system-health",{method:"GET",headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+SUPABASE_PUBLISHABLE_KEY,Accept:"application/json"},cache:"no-store"});
 const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{throw new Error("Invalid system health response");}
 if(!response.ok)throw new Error(data?.error||"System health HTTP "+response.status);
 return data;
}

export default function AppShell(){
 const [drawerOpen,setDrawerOpen]=useState(false),[health,setHealth]=useState("CHECKING"),[mode]=useState("REAL"),[userEmail,setUserEmail]=useState(""),[theme,setTheme]=useState(()=>localStorage.getItem("veltrion-theme")||"system");
 const location=useLocation(),navigate=useNavigate(),isHome=location.pathname==="/app/home";
 const pageName=useMemo(()=>{
  const all=[...primary,...secondaryGroups.flatMap(g=>g.items)];
  const match=all.find(([,path])=>path===location.pathname);
  if(match)return match[0];
  if(location.pathname.includes("market-details"))return "Market Details";
  if(location.pathname.includes("terminal"))return "Web Terminal";
  return "VELTRION";
 },[location.pathname]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("veltrion-theme",theme);},[theme]);
 useEffect(()=>{let alive=true;async function refresh(){try{const data=await fetchSystemHealth();const status=String(data?.globalStatus||data?.status||(data?.ok?"LIVE":"DEGRADED")).toUpperCase();if(alive)setHealth(["OK","HEALTHY","ONLINE","LIVE","CONNECTED"].includes(status)?"LIVE":status.includes("DEGRAD")?"DEGRADED":"OFFLINE");}catch{if(alive)setHealth("OFFLINE");}}refresh();const timer=window.setInterval(refresh,30000);return()=>{alive=false;window.clearInterval(timer)};},[]);
 useEffect(()=>{let alive=true;supabase.auth.getUser().then(({data})=>{if(alive)setUserEmail(data?.user?.email||"Authenticated")});return()=>{alive=false}},[]);
 async function logout(){await supabase.auth.signOut();navigate("/login",{replace:true})}
 function go(path){navigate(path);setDrawerOpen(false)}
 const sidebar=<aside className={"vel-sidebar "+(drawerOpen?"is-open":"")}>
  <div className="vel-brand-row"><div><div className="vel-brand">VELTRION</div><div className="vel-brand-sub">HOME NAVIGATION</div></div><button className="vel-close" onClick={()=>setDrawerOpen(false)} aria-label="Close menu">×</button></div>
  <div className="vel-nav-scroll">
   {secondaryGroups.map(group=><section className="vel-nav-group" key={group.label}><div className="vel-nav-label">{group.label}</div>{group.items.map(([label,path,icon])=><button key={path} className={"vel-nav-item "+(location.pathname===path?"active":"")} onClick={()=>go(path)}><span className="vel-nav-icon">{icon}</span><span>{label}</span></button>)}</section>)}
  </div>
  <div className="vel-sidebar-bottom"><div className="vel-session"><span className="vel-session-dot"/> SESSION AUTHENTICATED</div><button className="vel-logout" onClick={logout}>↪ &nbsp; Log Out</button></div>
 </aside>;
 const primaryNav=<nav className="vel-primary-nav" aria-label="Primary navigation">{primary.map(([label,path,icon])=><button key={path} onClick={()=>go(path)} className={location.pathname===path?"active":""}><span>{icon}</span>{label}</button>)}</nav>;
 return <div className={"vel-app "+(isHome?"is-home":"is-secondary")}>
  {isHome&&drawerOpen&&<button className="vel-drawer-backdrop" onClick={()=>setDrawerOpen(false)} aria-label="Close navigation"/>}
  {isHome&&sidebar}
  <div className="vel-main">
   <header className="vel-topbar">
    {isHome?<button className="vel-menu-toggle" onClick={()=>setDrawerOpen(true)} aria-label="Open secondary navigation">☰</button>:<button className="vel-back-home" onClick={()=>go("/app/home")} aria-label="Back to Home">←</button>}
    <button className="vel-topbar-brand" onClick={()=>go("/app/home")}>VELTRION</button>
    {!isHome&&primaryNav}
    <div className="vel-topbar-right">
     <div className={"vel-health health-"+health.toLowerCase()}><span/> SYSTEM {health}</div>
     <button className="vel-theme-switch" onClick={()=>setTheme(t=>t==="dark"?"light":t==="light"?"system":"dark")} title="Cycle light, system and dark appearance">{theme==="dark"?"☾":theme==="light"?"☀":"◐"}</button>
     <span className="vel-mode-switch" title="VELTRION is configured for the real Sendbox account only">{mode} ACCOUNT <span>•</span></span>
     <div className="vel-user"><span className="vel-avatar">A</span><div><b>ACCOUNT</b><small>{userEmail||"Authenticated"}</small></div></div>
    </div>
   </header>
   {isHome&&primaryNav}
   <main className="vel-content"><Outlet/></main>
   <nav className="vel-mobile-nav" aria-label="Primary mobile navigation">{primary.map(([label,path,icon])=><button key={path} onClick={()=>go(path)} className={location.pathname===path?"active":""}><span>{icon}</span>{label}</button>)}{isHome&&<button onClick={()=>setDrawerOpen(true)}><span>☰</span>Menu</button>}</nav>
  </div>
 </div>;
}