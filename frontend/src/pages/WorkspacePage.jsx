import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
const configBySection = {
 markets:{intro:"Market instruments returned by the connected data service.",source:"market_symbols"},
 positions:{intro:"Position records from the authenticated account.",source:"sandbox_positions"},
 orders:{intro:"Order records from the connected trading service.",source:"trading service"},
 history:{intro:"Historical activity from the connected trading service.",source:"trading service"},
 mt5:{intro:"MT5 connection and infrastructure state.",source:"mt5_connections"},
 sandbox:{intro:"Virtual account state and sandbox controls.",source:"sandbox_accounts"},
 analytics:{intro:"Performance metrics derived from recorded account activity.",source:"backend analytics"},
 settings:{intro:"Application configuration managed by the backend.",source:"app_settings"},
 alerts:{intro:"Recent system and operational alerts.",source:"audit_logs"}
};
export default function WorkspacePage({title,section}){
 const [state,setState]=useState({loading:true,error:"",data:null});
 const config=configBySection[section]||{intro:"Live account information from Supabase.",source:"Supabase"};
 useEffect(()=>{let alive=true;async function load(){setState({loading:true,error:"",data:null});try{
 let data=null,error=null;
 if(section==="markets"){const r=await supabase.from("market_symbols").select("*").limit(30);data=r.data;error=r.error;}
 else if(section==="positions"){const r=await supabase.from("sandbox_positions").select("*").order("updated_at",{ascending:false}).limit(50);data=r.data;error=r.error;}
 else {const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Your session has expired. Sign in again.");
 if(section==="mt5"){const r=await supabase.from("mt5_connections").select("status,server,last_heartbeat_at,environment").eq("user_id",user.id).maybeSingle();data=r.data;error=r.error;}
 else if(section==="sandbox"){const r=await supabase.from("sandbox_accounts").select("id,currency,initial_capital,available_capital,allocated_capital,withdrawable,status,updated_at").eq("user_id",user.id).maybeSingle();data=r.data;error=r.error;}
 else if(section==="settings"){const r=await supabase.from("app_settings").select("environment,trading_mode,real_trading_enabled,updated_at").order("updated_at",{ascending:false}).limit(1).maybeSingle();data=r.data;error=r.error;}
 else if(section==="alerts"){const r=await supabase.from("audit_logs").select("id,action,created_at,status,details").order("created_at",{ascending:false}).limit(20);data=r.data;error=r.error;}
 else data=null;
 }
 if(error)throw error;if(alive)setState({loading:false,error:"",data});
 }catch(e){if(alive)setState({loading:false,error:e?.message||"Unable to load backend data.",data:null});}}
 load();return()=>{alive=false};},[section]);
 const rows=Array.isArray(state.data)?state.data:state.data&&typeof state.data==="object"?Object.entries(state.data).map(([field,value])=>({field,value})):[];
 return <div className="vel-page"><div className="vel-page-heading"><div><div className="vel-eyebrow">VELTRION / OPERATIONS PLATFORM</div><h1>{title}</h1><p>{config.intro}</p></div><span className="vel-data-source">SOURCE · {config.source}</span></div>
 {state.loading?<div className="vel-panel vel-state">Loading authorized backend data…</div>:state.error?<div className="vel-panel vel-error"><b>Data unavailable</b><p>{state.error}</p><small>No sample values are being shown.</small></div>:!state.data||(Array.isArray(state.data)&&state.data.length===0)?<div className="vel-panel vel-state"><div className="vel-state-mark">—</div><h3>No records returned</h3><p>The connected backend did not return data for this view. This is not a fabricated zero balance.</p></div>:<div className="vel-panel"><div className="vel-panel-title">BACKEND RESPONSE <span>{rows.length} FIELD{rows.length===1?"":"S"}</span></div>
 {Array.isArray(state.data)?<div className="vel-table-wrap"><table className="vel-table"><thead><tr>{Object.keys(state.data[0]||{}).slice(0,6).map(k=><th key={k}>{k.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{state.data.map((row,i)=><tr key={row.id||row.symbol||i}>{Object.keys(state.data[0]||{}).slice(0,6).map(k=><td key={k}>{row[k]==null?"—":typeof row[k]==="object"?JSON.stringify(row[k]):String(row[k])}</td>)}</tr>)}</tbody></table></div>:<div className="vel-data-grid">{rows.map(row=><div className="vel-data-field" key={row.field}><span>{row.field.replaceAll("_"," ")}</span><strong>{row.value==null||row.value===""?"Unavailable":typeof row.value==="object"?JSON.stringify(row.value):String(row.value)}</strong></div>)}</div>}</div>}
 </div>;
}