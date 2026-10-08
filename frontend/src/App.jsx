import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Security from "./pages/Security";
import RealMT5Terminal from "./pages/RealMT5Terminal";
import TradingTerminal from "./pages/TradingTerminal";
import ProfitWalletView from "./pages/ProfitWalletView";
import OperationsControlView from "./pages/OperationsControlView";
import AdminPanel from "./pages/AdminPanel";
import AnalyticsOverviewLive from "./pages/AnalyticsOverviewLive";
import ConnectDeriv from "./pages/ConnectDeriv";
import WorkspacePage from "./pages/WorkspacePage";
import AIAssistants from "./pages/AIAssistants";
import MarketDetails from "./pages/MarketDetails";
import Wallet from "./pages/Wallet";
import MobileTradingChart from "./pages/MobileTradingChart";
import DerivContinuity from "./components/DerivContinuity";
const screens=[["/app/home","Home","home"],["/app/trading/markets","Markets","markets"],["/app/trading/positions","Portfolio","positions"],["/app/trading/orders","Orders","orders"],["/app/trading/history","Trade History","history"],["/app/trading/ai","AI Market Assistant","ai"],["/app/deriv/account","Deriv Connection","deriv"],["/app/mt5/overview","MT5 Infrastructure","mt5"],["/app/real/account","Real Account","real"],["/app/wallet/overview","Wallet","wallet"],["/app/analytics/performance","Analytics","analytics"],["/app/operations/health","Operations & Health","operations"],["/app/security/overview","Security","security"],["/app/settings","Settings","settings"]];
export default function App(){return <Routes><Route path="/login" element={<Login/>}/><Route element={<ProtectedRoute/>}><Route element={<AppShell/>}><Route element={<DerivContinuity/>}>{screens.map(([path,title,section])=>section==="home"?<Route key={path} path={path} element={<Home/>}/>:section==="analytics"?<Route key={path} path={path} element={<AnalyticsOverviewLive/>}/>:section==="deriv"?<Route key={path} path={path} element={<ConnectDeriv/>}/>:section==="ai"?<Route key={path} path={path} element={<AIAssistants/>}/>:section==="wallet"?<Route key={path} path={path} element={<Wallet/>}/>:<Route key={path} path={path} element={<WorkspacePage title={title} section={section}/>}/>)}
<Route path="/app/trading/market-details" element={<MarketDetails/>}/><Route path="/app/trading/terminal" element={<TradingTerminal/>}/><Route path="/app/trading/mobile-chart" element={<MobileTradingChart/>}/><Route path="/app/trading/real-terminal" element={<RealMT5Terminal/>}/><Route path="/real-trading" element={<RealMT5Terminal/>}/><Route path="/profit-wallet" element={<ProfitWalletView/>}/><Route path="/operations" element={<OperationsControlView/>}/><Route path="/admin" element={<AdminPanel/>}/><Route path="/security" element={<Security/>}/><Route path="/deriv/connect" element={<ConnectDeriv/>}/><Route path="/deriv/account" element={<ConnectDeriv/>}/><Route path="/" element={<Navigate to="/app/home" replace/>}/></Route></Route></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
