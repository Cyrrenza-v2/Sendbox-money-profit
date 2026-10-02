import { useEffect, useState } from "react";
import { api } from "../lib/api";

const endpointMap = {
  "/app/trading/markets": "/market/symbols",
  "/app/trading/positions": "/trading/overview",
  "/app/trading/orders": "/trading/history",
  "/app/trading/history": "/trading/history",
  "/app/mt5/overview": "/mt5/status",
  "/app/sandbox/overview": "/sandbox",
  "/app/real/account": "/portfolio",
  "/app/wallet/overview": "/wallet",
  "/app/analytics/performance": "/trading/overview",
  "/app/operations/health": "/system/health",
  "/app/operations/alerts": "/system/health",
  "/app/security/overview": "/audit",
  "/app/settings": "/system/health",
};

export default function SectionPage({ title, purpose }) {
  const [data,setData] = useState(null), [error,setError] = useState("");
  const endpoint = endpointMap[window.location.pathname] || "/system/health";
  useEffect(() => { let live=true; api(endpoint).then(x=>live&&setData(x)).catch(e=>live&&setError(e.message)); return()=>{live=false}; }, [endpoint]);
  return <div className="page"><div className="page-head"><div><span className="eyebrow">VELTRION / CONTROLLED VIEW</span><h1>{title}</h1><p>{purpose}</p></div><span className="live-stamp">BACKEND BOUND</span></div><section className="panel"><div className="panel-title"><h2>Authoritative response</h2><span>{endpoint}</span></div>{error?<div className="error-panel">{error}</div>:!data?<div className="loading">Loading live backend state…</div>:<pre className="data-view">{JSON.stringify(data,null,2)}</pre>}</section></div>;
}
