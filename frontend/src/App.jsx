import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Security from "./pages/Security";
import ConnectDeriv from "./pages/ConnectDeriv";
import DerivCallback from "./pages/DerivCallback";
import Markets from "./pages/Markets";

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/connect-deriv" element={<ProtectedRoute><ConnectDeriv /></ProtectedRoute>} />
    <Route path="/connect-deriv/callback" element={<ProtectedRoute><DerivCallback /></ProtectedRoute>} />
    <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}