import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ConnectDeriv from "./pages/ConnectDeriv";
import DerivCallback from "./pages/DerivCallback";
import SectionPage from "./pages/SectionPage";
import TradeTerminal from "./pages/TradeTerminal";
import SandboxDashboard from "./pages/SandboxDashboard";

const sections=[
 ["trading/markets","Markets","Live symbols and backend market state."],
 ["trading/positions","Positions","Open sandbox positions and floating P/L."],
 ["trading/orders","Orders","Working and historical order state."],
 ["trading/history","Trade History","Backend trade history and audit data."],
 ["mt5/overview","MT5 Infrastructure","MT5 bridge health and connection state."],
 ["real/account","Real Account","Real-account state; execution remains backend-controlled."],
 ["wallet/overview","Profit Wallet","Settled wallet state and available balances."],
 ["analytics/performance","Analytics","Performance and risk data from backend services."],
 ["operations/health","Operations","System and infrastructure health."],
 ["operations/alerts","Alert Center","Operational alert and health state."],
 ["security/overview","Security","Authenticated audit and security state."],
 ["settings","Settings","Backend configuration and system state."]
];

export default function App(){
 return <Routes>
  <Route path="/login" element={<Login/>}/>
  <Route path="/connect-deriv/callback" element={<DerivCallback/>}/>
  <Route element={<ProtectedRoute><AppShell/></ProtectedRoute>}>
   <Route path="/app/home" element={<Home/>}/>
   <Route path="/app/deriv/account" element={<ConnectDeriv/>}/>
   <Route path="/app/trading/terminal" element={<TradeTerminal/>}/>
   <Route path="/app/sandbox/overview" element={<SandboxDashboard/>}/>
   {sections.map(([path,title,purpose])=>(
     <Route key={path} path={"/app/"+path} element={<SectionPage title={title} purpose={purpose}/>} />
   ))}
   <Route path="/app" element={<Navigate to="/app/home" replace/>}/>
  </Route>
  <Route path="/" element={<Navigate to="/app/home" replace/>}/>
  <Route path="*" element={<Navigate to="/app/home" replace/>}/>
 </Routes>;
}