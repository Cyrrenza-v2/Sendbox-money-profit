import {useEffect,useState} from "react"; import {Navigate} from "react-router-dom"; import {supabase} from "../supabaseClient";
export default function ProtectedRoute({children}){const [state,setState]=useState("loading");
useEffect(()=>{let live=true;(async()=>{const {data:{session}}=await supabase.auth.getSession(); if(!session){if(live)setState("denied");return}
const {data:roles}=await supabase.from("user_roles").select("role").eq("user_id",session.user.id);
const ok=(roles||[]).some(x=>["admin","risk_admin","finance_admin","support"].includes(x.role)); if(!ok){await supabase.auth.signOut();if(live)setState("denied");return} if(live)setState("ok")})();return()=>{live=false}},[]);
if(state==="loading")return <div className="secure">SECURING VELTRION...</div>; return state==="ok"?children:<Navigate to="/login" replace/>}