import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const items=[
  ["Home","/app/home"],["Markets","/app/trading/markets"],["Trade","/app/trading/positions"],
  ["Wallet","/app/wallet/overview"],["Analytics","/app/analytics/performance"],["Operations","/app/operations/health"],["Security","/app/security/overview"]
];

export default function Navigation(){
 const location=useLocation(),navigate=useNavigate();
 return <nav className="vel-assembly-nav" aria-label="VELTRION primary navigation">
  {items.map(([label,path])=><button key={path} className={location.pathname.startsWith(path)?"active":""} onClick={()=>navigate(path)}>{label}</button>)}
 </nav>;
}
