import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';

export default function Security() {
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSecurityData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch user sessions
        const { data: sessionsData } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch audit logs
        const { data: logsData } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setSessions(sessionsData || []);
        setAuditLogs(logsData || []);
      } catch (err) {
        console.error("Error fetching security data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSecurityData();
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div style={styles.main}>
        <header style={styles.header}>
          <button onClick={() => setSidebarOpen(true)} style={styles.menuBtn}>☰</button>
          <span style={styles.brand}>SECURITY</span>
          <span style={styles.badge}>● ADMIN</span>
        </header>

        <div style={styles.content}>
          <h2 style={styles.title}>Security Overview</h2>

          {/* Sessions */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Active Sessions</h3>
            {sessions.length === 0 ? (
              <p style={styles.empty}>No sessions recorded.</p>
            ) : (
              <div style={styles.table}>
                {sessions.map((session) => (
                  <div key={session.id} style={styles.tableRow}>
                    <div>
                      <div style={styles.label}>Device</div>
                      <div style={styles.value}>{session.device_info.substring(0, 50)}...</div>
                    </div>
                    <div>
                      <div style={styles.label}>Status</div>
                      <div style={styles.value}>{session.status}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Created</div>
                      <div style={styles.value}>{new Date(session.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Audit Logs</h3>
            {auditLogs.length === 0 ? (
              <p style={styles.empty}>No audit logs recorded.</p>
            ) : (
              <div style={styles.table}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={styles.tableRow}>
                    <div>
                      <div style={styles.label}>Action</div>
                      <div style={styles.value}>{log.action}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Role</div>
                      <div style={styles.value}>{log.actor_role}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Status</div>
                      <div style={{...styles.value, color: log.status === 'SUCCESS' ? '#3fb950' : '#f85149'}}>{log.status}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Time</div>
                      <div style={styles.value}>{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #30363d', background: '#161b22' },
  menuBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
  brand: { fontWeight: 'bold', letterSpacing: '1px' },
  badge: { color: '#3fb950', fontSize: '12px', fontWeight: 'bold' },
  content: { padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  title: { marginBottom: '25px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#c9d1d9' },
  table: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tableRow: { background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' },
  label: { fontSize: '11px', color: '#8b949e', marginBottom: '4px', fontWeight: 'bold' },
  value: { fontSize: '12px', color: '#c9d1d9' },
  empty: { color: '#8b949e', fontSize: '13px' }
};
