import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Home from './pages/Home';
import Security from './pages/Security';
import Placeholder from './pages/Placeholder';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0b0e14',
        color: '#fff',
        fontSize: '14px'
      }}>
        Initializing VELTRION...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute user={user}><Security /></ProtectedRoute>} />
        <Route path="/*" element={<ProtectedRoute user={user}><Placeholder /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
