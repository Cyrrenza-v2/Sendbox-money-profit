import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3>VELTRION</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.menu}>
          <div style={styles.itemActive} onClick={() => { navigate('/'); onClose(); }}>HOME</div>
          
          <div style={styles.category}>TRADING</div>
          <div style={styles.subItem} onClick={() => { navigate('/markets'); onClose(); }}>Markets</div>
          <div style={styles.subItem} onClick={() => { navigate('/positions'); onClose(); }}>Positions</div>
          <div style={styles.subItem} onClick={() => { navigate('/orders'); onClose(); }}>Orders</div>
          
          <div style={styles.category}>DERIV</div>
          <div style={styles.subItem} onClick={() => { navigate('/deriv'); onClose(); }}>Connection</div>
          
          <div style={styles.category}>MT5</div>
          <div style={styles.subItem} onClick={() => { navigate('/mt5'); onClose(); }}>Virtual Account</div>
          
          <div style={styles.category}>SANDBOX</div>
          <div style={styles.subItem} onClick={() => { navigate('/sandbox'); onClose(); }}>Overview</div>
          
          <div style={styles.category}>SECURITY</div>
          <div style={styles.subItem} onClick={() => { navigate('/security'); onClose(); }}>Audit Log & Sessions</div>

          <div style={styles.logout} onClick={handleLogout}>LOG OUT</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000 },
  sidebar: { position: 'fixed', top: 0, left: 0, width: '260px', height: '100%', backgroundColor: '#161b22', borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #30363d', paddingBottom: '15px' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' },
  menu: { display: 'flex', flexDirection: 'column', gap: '5px' },
  itemActive: { padding: '10px 12px', background: '#21262d', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#3fb950' },
  category: { fontSize: '11px', color: '#8b949e', marginTop: '15px', letterSpacing: '1px', fontWeight: 'bold' },
  subItem: { padding: '8px 12px', color: '#c9d1d9', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', transition: 'background 0.2s' },
  logout: { marginTop: 'auto', padding: '10px', color: '#f85149', cursor: 'pointer', fontWeight: 'bold', borderTop: '1px solid #30363d', textAlign: 'center', borderRadius: '4px', transition: 'background 0.2s' }
};
