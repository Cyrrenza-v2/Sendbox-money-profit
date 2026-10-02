import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Security from "./pages/Security";
import RealTradingTerminal from "./pages/RealTradingTerminal";
import ProfitWalletView from "./pages/ProfitWalletView";
import OperationsControlView from "./pages/OperationsControlView";
import ConnectDeriv from "./pages/ConnectDeriv";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/security" element={<Security />} />
        <Route path="/real-trading" element={<RealTradingTerminal />} />
        <Route path="/deriv/connect" element={<ConnectDeriv />} />
        <Route path="/profit-wallet" element={<ProfitWalletView />} />
        <Route path="/operations" element={<OperationsControlView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
