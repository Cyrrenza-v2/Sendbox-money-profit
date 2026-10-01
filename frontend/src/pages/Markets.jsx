import { useEffect,useState } from "react";
import Sidebar from "../components/Sidebar";
import { derivMarketService } from "../services/derivWebSocket";

const TARGETS=[{key:"EURUSD",label:"EUR/USD",pattern:"EUR/USD"},{key:"GBPUSD",label:"GBP/USD",pattern:"GBP/USD"},{key:"USDJPY",label:"USD/JPY",pattern:"USD/JPY"},{key:"XAUUSD",label:"Gold (XAU/USD)",pattern:"Gold"}];

export default function Markets(){
 const [open,setOpen]=useState(false),[status,setStatus]=useState("CONNECTING"),[prices,setPrices]=useState({}),[resolved,setResolved]=useState({});
 useEffect(()=>{const off=derivMarketService.onStatus(setStatus);derivMarketService.connect();const t=setInterval(()=>{const n={};TARGETS.forEach(x=>{const i=derivMarketService.getSymbolByName(x.pattern);if(i)n[x.key]=i.code});setResolved(n)},1000);return()=>{off();clearInterval(t);derivMarketService.disconnect()}},[]);
 useEffect(()=>{Object.entries(resolved).forEach(([key,code])=>derivMarketService.subscribeTick(code,tick=>setPrices(p=>({...p,[key]:{price:Number(tick.quote),time:new Date(Number(tick.epoch)*1000).toLocaleTimeString()}})))},[resolved]);
 return <div className="app-shell"><Sidebar open={open} onClose={()=>setOpen(false)}/><main className="main"><header><button className="menu" onClick={()=>setOpen(true)}>☰</button><b>LIVE MARKETS</b><span className="online">● {status}</span></header><section className="content"><div className="hero"><span className="secure-badge">LIVE PUBLIC MARKET DATA • NO TRADE EXECUTION</span><h1>Deriv market monitor</h1><p className="muted">Public market ticks stream directly from Deriv. They do not change the VELTRION sandbox ledger.</p></div><div className="card">{TARGETS.map(t=>{const d=prices[t.key];return <div className="row" key={t.key}><div><b>{t.label}</b><small>{resolved[t.key]||"Resolving symbol…"}</small></div><div style={{textAlign:"right"}}><strong>{d?d.price.toFixed(5):"—"}</strong><small>{d?"● LIVE "+d.time:status}</small></div></div>})}</div></section></main></div>
}
