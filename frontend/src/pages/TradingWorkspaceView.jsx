import React,{useState} from "react";
import ConfirmationModal from "../components/ConfirmationModal";
import Markets from "./Markets";
export default function TradingWorkspaceView(){
 const [mode,setMode]=useState("SANDBOX"),[pending,setPending]=useState(false);
 return <div className="vel-page"><div className="vel-page-heading"><div><div className="vel-eyebrow">TRADING WORKSPACE</div><h1>Unified Trading Workspace</h1><p>Sandbox and real channels are explicitly separated.</p></div><span className={mode==="REAL"?"vel-badge vel-badge-danger":"vel-badge"}>{mode} MODE</span></div>
 <div className="vel-panel vel-mode-panel"><div><b>Execution channel</b><small>{mode==="SANDBOX"?"Virtual ledger / sandbox":"Live Deriv channel"}</small></div><div className="vel-mode-buttons"><button className={mode==="SANDBOX"?"active":""} onClick={()=>setMode("SANDBOX")}>SANDBOX</button><button className={mode==="REAL"?"active danger":""} onClick={()=>setPending(true)}>REAL DERIV</button></div></div><Markets/>
 <ConfirmationModal open={pending} title="Real trading authorization required" message="Switching to the live Deriv channel changes the execution context. Confirm only if you intentionally want to enter the authenticated real-trading workflow." confirmLabel="Enter real mode" cancelLabel="Stay in sandbox" danger onConfirm={()=>{setMode("REAL");setPending(false)}} onCancel={()=>setPending(false)}/></div>;
}