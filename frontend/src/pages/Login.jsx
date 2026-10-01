import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Verify Admin Authorization
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('status', 'ACTIVE')
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        throw new Error('Access denied: Unauthorized account.');
      }

      // 3. Log session & audit trail
      await supabase.from('user_sessions').insert([
        { user_id: authData.user.id, device_info: navigator.userAgent, status: 'ACTIVE' }
      ]);

      await supabase.from('audit_logs').insert([
        { user_id: authData.user.id, action: 'LOGIN', actor_role: adminData.role, status: 'SUCCESS' }
      ]);

      navigate('/');
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>VELTRION</h2>
        <p style={styles.subtitle}>PRIVATE TRADING PLATFORM</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="admin@veltrion.local"
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'VERIFYING...' : 'SIGN IN'}
          </button>
        </form>
        <p style={styles.security}>🔒 Secure connection</p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0e14', color: '#fff', fontFamily: 'sans-serif' },
  card: { background: '#161b22', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '360px', border: '1px solid #30363d' },
  title: { textAlign: 'center', letterSpacing: '2px', margin: '0 0 5px 0', fontSize: '28px' },
  subtitle: { textAlign: 'center', fontSize: '11px', color: '#8b949e', marginBottom: '25px', letterSpacing: '0.5px' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '12px', color: '#8b949e', marginBottom: '5px', fontWeight: '500' },
  input: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', padding: '10px 12px', color: '#c9d1d9', marginBottom: '15px', fontSize: '14px', transition: 'border-color 0.2s' },
  button: { background: '#238636', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' },
  error: { background: '#da3633', color: '#fff', padding: '10px', fontSize: '12px', borderRadius: '4px', marginBottom: '15px' },
  security: { textAlign: 'center', fontSize: '10px', color: '#484f58', marginTop: '20px' }
};
