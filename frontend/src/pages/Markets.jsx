import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LiveMarketPanel from "../components/LiveMarketPanel";

export default function Markets() {
  const [open, setOpen] = useState(false);
 const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <main className="app-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <b>LIVE MARKETS</b>
          <span className="admin-badge">● PUBLIC MARKET DATA</span>
        </header>
        <section className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">VELTRION / MARKETS</span>
              <h1>Deriv Market Watch</h1>
              <p>All dynamically discovered Deriv instruments, live quotes, market categories and terminal entry.</p>
            </div>
            <span className="live-badge">NO TRADE EXECUTION FROM MARKET WATCH</span>
          </div>
          <LiveMarketPanel
            onOpenTerminal={(symbol) => {
              navigate(`/app/trading/real-terminal?symbol=${encodeURIComponent(symbol)}`);
            }}
          />
        </section>
      </main>
    </div>
  );
}
