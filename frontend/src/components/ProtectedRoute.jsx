import {useEffect,useState} from "react";
import {Navigate} from "react-router-dom";
import {supabase} from "../supabaseClient";

export default function ProtectedRoute({children}){
  const [state,setState]=useState("loading");

  useEffect(()=>{
    let live=true;
    let channel;
    const verify=async()=>{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session){if(live)setState("denied");return}
      const [{data:roles},{data:deviceRows}]=await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id",session.user.id),
        supabase.from("user_sessions").select("id,status,device_info").eq("user_id",session.user.id).eq("device_info",navigator.userAgent).order("created_at",{ascending:false}).limit(1)
      ]);
      const ok=(roles||[]).some(x=>["admin","risk_admin","finance_admin","support"].includes(String(x.role).toLowerCase()));
      if(!ok){await supabase.auth.signOut();if(live)setState("denied");return}
      const revoked=deviceRows?.[0]?.status==="REVOKED";
      if(revoked){await supabase.auth.signOut();if(live)setState("denied");return}
      if(live)setState("ok");
      channel=supabase.channel("veltrion-session-enforcement")
        .on("postgres_changes",{event:"UPDATE",schema:"public",table:"user_sessions",filter:"user_id=eq."+session.user.id},async payload=>{
          if(payload.new?.device_info===navigator.userAgent&&payload.new?.status==="REVOKED"){
            await supabase.auth.signOut();
            if(live)setState("denied");
          }
        }).subscribe();
    };
    verify();
    const timer=setInterval(verify,15000);
    return()=>{live=false;clearInterval(timer);if(channel)supabase.removeChannel(channel)};
  },[]);

  if(state==="loading")return <div className="secure">SECURING VELTRION...</div>;
  return state==="ok"?children:<Navigate to="/login" replace/>;
}