import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function MarketDetails(){
 const [params]=useSearchParams();
 const navigate=useNavigate();
 const symbol=useMemo(()=>params.get("symbol")||"frxEURUSD",[params]);
 const label=symbol==="frxEURUSD"?"EUR/USD":symbol.replace(/^frx/,"");
 const terminalPath=`/app/trading/real-terminal?symbol=${encodeURIComponent(symbol)}`;
 return <div className="vel-page market-details-page">
  <div className="vel-page-heading">
   <div>
    <div className="vel-eyebrow">MARKET / SELECTED SYMBOL</div>
    <h1>{label}</h1>
    <p>Select the trading experience after selecting the market. The web terminal is the sandbox trading workspace; real-money execution remains a separate, server-gated surface.</p>
   </div>
   <span className="vel-data-source">DERIV PUBLIC MARKET DATA</span>
  </div>
  <section className="vel-panel market-details-hero">
   <div><span className="market-kicker">SELECTED TRADING SYMBOL</span><h2>{label}</h2><p>{symbol}</p></div>
   <div className="market-price-placeholder"><span>Live quote</span><strong>Available in terminal</strong></div>
  </section>
  <div className="market-terminal-choice">
   <section className="vel-panel market-choice-card">
    <div className="market-choice-top"><span className="market-choice-icon">WEB</span><span className="market-choice-status">AVAILABLE</span></div>
    <h2>Web Terminal</h2>
    <p>Open the verified market chart, live quote, AI review and VELTRION sandbox trading workflow for this symbol.</p>
    <button type="button" className="vel-button market-terminal-link" onClick={()=>navigate(terminalPath)}>Open Web Terminal <span>→</span></button>
   </section>
   <section className="vel-panel market-choice-card">
    <div className="market-choice-top"><span className="market-choice-icon">MT5</span><span className="market-choice-status muted">COMING LATER</span></div>
    <h2>MT5 Terminal</h2>
    <p>MT5 stays secondary and remains disabled until the required licensing, broker/server and integration work is complete.</p>
    <button type="button" className="vel-button vel-button-muted" disabled>Coming later</button>
   </section>
  </div>
  <section className="vel-panel market-details-note">
   <div className="vel-panel-title">TRADING FLOW <span>MARKET FIRST</span></div>
   <div className="market-flow-steps"><span>1 · Select market</span><span>2 · Review details</span><span>3 · Choose terminal</span><span>4 · Trade through Sendbox real account</span></div>
  </section>
  <Link className="vel-back-link" to="/app/trading/markets">← Back to Markets</Link>
 </div>;
}