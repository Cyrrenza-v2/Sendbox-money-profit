import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Placeholder() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <div style={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div style={styles.main}>
        <header style={styles.header}>
          <button onClick={() => setSidebarOpen(true)} style={styles.menuBtn}>☰</button>
          <span style={styles.brand}>VELTRION</span>
          <span style={styles.badge}>● ADMIN</span>
        </header>

        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.icon}>🚀</div>
            <h2 style={styles.title}>Coming in the next system phase</h2>
            <p style={styles.description}>This feature is under development and will be available in Phase 2.</p>
            <button onClick={() => navigate('/')} style={styles.button}>← Back to Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', backgroundColor: '#0b0e14', minHeight: '100vh', color: '#c9d1d9', fontFamily: 'sans-serif' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #30363d', background: '#161b22' },
  menuBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
  brand: { fontWeight: 'bold', letterSpacing: '1px' },
  badge: { color: '#3fb950', fontSize: '12px', fontWeight: 'bold' },
  content: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  card: { textAlign: 'center', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '40px', maxWidth: '400px' },
  icon: { fontSize: '60px', marginBottom: '20px' },
  title: { marginBottom: '15px', fontSize: '24px' },
  description: { color: '#8b949e', marginBottom: '25px', fontSize: '14px' },
  button: { background: '#238636', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }
};
