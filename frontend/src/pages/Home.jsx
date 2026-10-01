import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const [sandbox, setSandbox] = useState({ balance: 100000, starting_balance: 100000, equity: 100000 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        // Fetch admin info
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        // Fetch sandbox account
        const { data: sandboxData } = await supabase
          .from('sandbox_accounts')
          .select('*')
          .eq('admin_id', adminData.id)
          .single();

        if (sandboxData) setSandbox(sandboxData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  const profit = sandbox.balance - sandbox.starting_balance;

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
          <div style={styles.greeting}>
            <h2>Good afternoon, Admin</h2>
            <p style={styles.subtitle}>VELTRION Command Center</p>
          </div>

          {/* Sandbox Profit Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>SANDBOX PROFIT</div>
            <div style={{...styles.amount, color: profit >= 0 ? '#3fb950' : '#f85149'}}
            >
              ${profit.toFixed(2)}
            </div>
            <div style={styles.row}>
              <div>
                <div style={styles.label}>Today</div>
                <div style={styles.value}>$0.00</div>
              </div>
              <div>
                <div style={styles.label}>Total</div>
                <div style={styles.value}>${profit.toFixed(2)}</div>
              </div>
            </div>
            <div style={styles.badge2}>VIRTUAL / NON-REAL</div>
          </div>

          {/* Capital Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>VIRTUAL CAPITAL</div>
            <div style={styles.amount}>${Number(sandbox.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div style={styles.row}>
              <div>
                <div style={styles.label}>Balance</div>
                <div style={styles.value}>${Number(sandbox.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div style={styles.label}>Equity</div>
                <div style={styles.value}>${Number(sandbox.equity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <div style={styles.label}>TODAY'S P/L</div>
              <div style={styles.value}>$0.00</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.label}>OPEN POSITIONS</div>
              <div style={styles.value}>0</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.label}>EXPOSURE</div>
              <div style={styles.value}>$0.00</div>
            </div>
          </div>

          {/* System Status */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>SYSTEM STATUS</div>
            <div style={styles.statusRow}>
              <span>Deriv</span>
              <span style={styles.offline}>● NOT CONNECTED</span>
            </div>
            <hr style={styles.divider}/>
            <div style={styles.statusRow}>
              <span>MT5</span>
              <span style={styles.offline}>● NOT CONNECTED</span>
            </div>
            <hr style={styles.divider}/>
            <div style={styles.statusRow}>
              <span>Sandbox</span>
              <span style={styles.online}>● ACTIVE</span>
            </div>
            <hr style={styles.divider}/>
            <div style={styles.statusRow}>
              <span>Real</span>
              <span style={styles.offline}>● PAUSED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0e14', color: '#fff' },
  layout: { display: 'flex', backgroundColor: '#0b0e14', minHeight: '100vh', color: '#c9d1d9', fontFamily: 'sans-serif' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #30363d', background: '#161b22', position: 'sticky', top: 0, zIndex: 100 },
  menuBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' },
  brand: { fontWeight: 'bold', letterSpacing: '1px', fontSize: '14px' },
  badge: { color: '#3fb950', fontSize: '12px', fontWeight: 'bold' },
  content: { padding: '20px', maxWidth: '600px', margin: '0 auto', width: '100%' },
  greeting: { marginBottom: '25px' },
  subtitle: { fontSize: '12px', color: '#8b949e', marginTop: '5px' },
  card: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '20px', marginBottom: '15px' },
  cardTitle: { fontSize: '11px', color: '#8b949e', letterSpacing: '1px', marginBottom: '12px', fontWeight: 'bold' },
  amount: { fontSize: '28px', fontWeight: 'bold', color: '#3fb950', marginBottom: '15px' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  label: { fontSize: '11px', color: '#8b949e', marginBottom: '4px' },
  value: { fontSize: '14px', fontWeight: '600' },
  badge2: { fontSize: '9px', color: '#8b949e', marginTop: '10px', display: 'inline-block', letterSpacing: '0.5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' },
  stat: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '15px', textAlign: 'center' },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 0' },
  online: { color: '#3fb950', fontSize: '12px' },
  offline: { color: '#f85149', fontSize: '12px' },
  divider: { borderColor: '#30363d', margin: '8px 0' }
};
