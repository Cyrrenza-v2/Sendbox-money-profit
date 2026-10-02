import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

const empty = { total_trades:0, win_rate:0, profit_factor:0, average_win:0, average_loss:0 };
const money = value => Number(value || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

export default function AnalyticsOverviewView() {
  const [sidebarOpen,setSidebarOpen] = useState(false), [activeTab,setActiveTab] = useState("SANDBOX");
  const [metrics,setMetrics] = useState(empty), [snapshots,setSnapshots] = useState([]), [loading,setLoading] = useState(true), [error,setError] = useState("");
  useEffect(() => {
    let cancelled=false;
    (async()=>{
      setLoading(true); setError("");
      const [m,d]=await Promise.all([
        supabase.from("analytics_trade_metrics").select("*").eq("account_type",activeTab).maybeSingle(),
        supabase.from("analytics_daily_snapshots").select("*").eq("account_type",activeTab).order("snapshot_date",{ascending:false}).limit(30)
      ]);
      if(cancelled)return;
      if(m.error||d.error){setError((m.error||d.error).message);setMetrics(empty);setSnapshots([]);}
      else{setMetrics(m.data||empty);setSnapshots(d.data||[]);}
      setLoading(false);
    })();
    return()=>{cancelled=true;};
  },[activeTab]);
  const totalPnl=snapshots.reduce((sum,row)=>sum+Number(row.realized_pnl||0),0);
  const insights = metrics.total_trades ? [
    Number(metrics.win_rate)>=50 ? "Closed-trade win rate is at or above 50% for the selected account." : "Closed-trade win rate is below 50%; review the trade distribution.",
    Number(metrics.profit_factor)>1 ? "Gross profits exceed gross losses in the persisted closed-trade metrics." : "Gross losses meet or exceed gross profits in the persisted closed-trade metrics.",
    "Analytics are derived from source records; this screen cannot submit, modify, or execute orders."
  ] : ["No persisted closed-trade metrics are available for the selected account."];
  return <div style={styles.layout}><Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/><main style={styles.main}>
    <header style={styles.header}><button onClick={()=>setSidebarOpen(true)} style={styles.menu}>☰</button><span style={styles.brand}>VELTRION ANALYTICS INTELLIGENCE</span><div style={styles.tabs}>{["SANDBOX","REAL"].map(t=><button key={t} onClick={()=>setActiveTab(t)} style={activeTab===t?styles.active:styles.tab}>{t==="REAL"?"REAL DERIV":t}</button>)}</div></header>
    <section style={styles.content}>{loading&&<div style={styles.muted}>Loading derived analytics…</div>}{error&&<div style={styles.error}>{error}</div>}
      <div style={styles.grid}>
        <Card label={"TOTAL P/L ("+activeTab+")"} value={money(totalPnl)}/>
        <Card label="WIN RATE" value={Number(metrics.win_rate||0).toFixed(2)+"%"}/>
        <Card label="PROFIT FACTOR" value={Number(metrics.profit_factor||0).toFixed(2)}/>
        <Card label="MAX DRAWDOWN" value={snapshots.length?money(Math.max(...snapshots.map(x=>Number(x.max_drawdown||0)))):"0.00"}/>
      </div>
      <div style={styles.card}><h3>Trade distribution</h3><p style={styles.muted}>{metrics.total_trades||0} closed trades · {Number(metrics.win_rate||0).toFixed(2)}% win rate · average win {money(metrics.average_win)} · average loss {money(metrics.average_loss)}</p></div>
      <div style={styles.card}><h3>VELTRION AI INSIGHTS ENGINE</h3><ul style={styles.list}>{insights.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
      <div style={styles.card}><h3>Daily performance & drawdown</h3>{snapshots.length?snapshots.map(r=><div key={r.id} style={styles.row}><span>{r.snapshot_date}</span><span>P/L {money(r.realized_pnl)}</span><span>DD {money(r.max_drawdown)}</span></div>):<p style={styles.muted}>No daily snapshots available.</p>}</div>
    </section>
  </main></div>;
}
function Card({label,value}){return <div style={styles.card}><span style={styles.label}>{label}</span><strong style={styles.value}>{value}</strong></div>}
const styles={layout:{display:"flex",minHeight:"100vh",background:"transparent"},main:{flex:1,minWidth:0},header:{display:"flex",alignItems:"center",gap:16,padding:"15px 20px",borderBottom:"1px solid #30363d",background:"#161b22",flexWrap:"wrap"},menu:{background:"none",border:0,color:"inherit",fontSize:20,cursor:"pointer"},brand:{fontWeight:800,letterSpacing:1,flex:1},tabs:{display:"flex",border:"1px solid #30363d",borderRadius:6,overflow:"hidden"},tab:{background:"transparent",border:0,color:"#8b949e",padding:"7px 12px",fontWeight:700,fontSize:11},active:{background:"#238636",border:0,color:"#fff",padding:"7px 12px",fontWeight:700,fontSize:11},content:{padding:20,maxWidth:1100,margin:"0 auto",boxSizing:"border-box"},grid:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:15,marginBottom:20},card:{background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:18,marginBottom:15},label:{display:"block",color:"#8b949e",fontSize:11,fontWeight:800},value:{display:"block",fontSize:24,marginTop:8},muted:{color:"#8b949e"},list:{color:"#8b949e",lineHeight:1.7},row:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"9px 0",borderBottom:"1px solid #30363d"},error:{padding:12,color:"#f85149"}};
