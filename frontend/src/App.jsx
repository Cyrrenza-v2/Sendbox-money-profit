import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Security from "./pages/Security";
import RealTradingTerminal from "./pages/RealTradingTerminal";
import ProfitWalletView from "./pages/ProfitWalletView";
import OperationsControlView from "./pages/OperationsControlView";
import ConnectDeriv from "./pages/ConnectDeriv";
import WorkspacePage from "./pages/WorkspacePage";

const screens = [
 ["/app/home","Home Command Center","home"],
 ["/app/trading/markets","Markets","markets"],
 ["/app/trading/positions","Positions","positions"],
 ["/app/trading/orders","Orders","orders"],
 ["/app/trading/history","Trade History","history"],
 ["/app/deriv/account","Deriv Connection","deriv"],
 ["/app/mt5/overview","MT5 Infrastructure","mt5"],
 ["/app/sandbox/overview","Sandbox Overview","sandbox"],
 ["/app/real/account","Real Account","real"],
 ["/app/wallet/overview","Profit Wallet","wallet"],
 ["/app/analytics/performance","Analytics","analytics"],
 ["/app/operations/health","Operations & Health","operations"],
 ["/app/security/overview","Security","security"],
 ["/app/settings","Settings","settings"]
];
export default function App(){
 return <Routes>
  <Route path="/login" element={<Login/>}/>
  <Route element={<ProtectedRoute/>}>
   <Route element={<AppShell/>}>
    {screens.map(([path,title,section])=>section==="home"
      ? <Route key={path} path={path} element={<Home/>}/>
      : section==="deriv"
        ? <Route key={path} path={path} element={<ConnectDeriv/>}/>
        : <Route key={path} path={path} element={<WorkspacePage title={title} section={section}/>}/>)}
    <Route path="/app/operations/alerts" element={<WorkspacePage title="Operations Alerts" section="alerts"/>}/>
    <Route path="/" element={<Navigate to="/app/home" replace/>}/>
   </Route>
   <Route path="/real-trading" element={<RealTradingTerminal/>}/>
   <Route path="/profit-wallet" element={<ProfitWalletView/>}/>
   <Route path="/operations" element={<OperationsControlView/>}/>
   <Route path="/security" element={<Security/>}/>
   <Route path="/deriv/connect" element={<ConnectDeriv/>}/>
  </Route>
  <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes>;
}
