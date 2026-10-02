import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  function go(path) { navigate(path); onClose?.(); }

  return <>
    {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand"><b>VELTRION</b><small>PRIVATE TRADING PLATFORM</small></div>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>
      <nav className="sidebar-menu">
        <button className={location.pathname === "/" ? "active" : ""} onClick={() => go("/")}>HOME</button>
        <div className="menu-category">TRADING</div>
        {["Markets","Positions","Orders","History"].map(item =>
          <button key={item} className="menu-item" onClick={() => alert("Coming in the next system phase")}>{item}</button>
        )}
        <div className="menu-category">DERIV</div>
        <button className="menu-item" onClick={() => alert("Coming in the next system phase")}>Connection</button>
        <button className="menu-item" onClick={() => alert("Coming in the next system phase")}>Account</button>
        <div className="menu-category">MT5</div>
        <button className="menu-item" onClick={() => alert("Coming in the next system phase")}>Virtual Account</button>
        <div className="menu-category">SECURITY</div>
        <button className={location.pathname === "/security" ? "active" : "menu-item"} onClick={() => go("/security")}>Profile &amp; Audit Log</button>
      </nav>
      <button className="logout-button" onClick={logout}>LOG OUT</button>
    </aside>
  </>;
}