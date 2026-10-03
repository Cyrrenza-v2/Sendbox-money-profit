import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  async function logout() { await supabase.auth.signOut(); navigate("/login", { replace: true }); }
  function go(path) { navigate(path); onClose?.(); }
  const active = path => location.pathname === path ? "active" : "menu-item";

  return <>
    {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header"><div className="brand"><b>VELTRION</b><small>PRIVATE TRADING PLATFORM</small></div><button className="close-button" onClick={onClose}>✕</button></div>
      <nav className="sidebar-menu">
        <button className={active("/")} onClick={()=>go("/")}>HOME</button>
        <div className="menu-category">TRADING</div>
        {[["Markets","/app/trading/markets"],["Positions","/app/trading/positions"],["Orders","/app/trading/orders"],["History","/app/trading/history"]].map(([item,path]) => <button key={item} className={active(path)} onClick={()=>go(path)}>{item}</button>)}
        <div className="menu-category">DERIV</div>
        <button className={active("/real-trading")} onClick={()=>go("/real-trading")}>Real Trading Terminal</button>
        <button className={active("/deriv/connect")} onClick={()=>go("/deriv/connect")}>Connection</button>
        <button className={active("/deriv/account")} onClick={()=>go("/deriv/account")}>Account</button>
        <div className="menu-category">ACCOUNTS</div>
        <button className={active("/profit-wallet")} onClick={()=>go("/profit-wallet")}>Profit Wallet</button>
        <div className="menu-category">OPERATIONS</div>
        <button className={active("/operations")} onClick={()=>go("/operations")}>Operations Control</button>
        <div className="menu-category">SECURITY</div>
        <button className={active("/security")} onClick={()=>go("/security")}>Profile &amp; Audit Log</button>
      </nav>
      <button className="logout-button" onClick={logout}>LOG OUT</button>
    </aside>
  </>;
}
