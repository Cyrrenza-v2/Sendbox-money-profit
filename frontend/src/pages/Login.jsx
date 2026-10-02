import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
const ADMIN_ROLES=["admin","risk_admin","finance_admin","support"];
export default function Login(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const navigate=useNavigate();
 async function handleLogin(e){
  e.preventDefault();setLoading(true);setError("");
  try{
   const {data,error:authError}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(authError)throw authError;
   const {data:roles,error:roleError}=await supabase.from("user_roles").select("role").eq("user_id",data.user.id);
   if(roleError)throw roleError;
   const admin=(roles||[]).find(r=>ADMIN_ROLES.includes(String(r.role).toLowerCase()));
   if(!admin){await supabase.auth.signOut();throw new Error("Access denied: unauthorized identity.");}
   await supabase.from("user_sessions").insert({user_id:data.user.id,status:"active",last_seen_at:new Date().toISOString()});
   navigate("/",{replace:true});
  }catch(err){setError(err?.message||"Sign in failed.");}finally{setLoading(false);}
 }
 return <main className="login-screen"><form className="login-card" onSubmit={handleLogin}>
  <div className="brand center"><b>VELTRION</b><small>PRIVATE TRADING PLATFORM</small></div>
  <div className="secure-badge">SECURE ADMIN ACCESS</div>
  <h1>Sign in</h1><p className="muted">Authorized accounts only. There is no public registration.</p>
  {error&&<div className="error-box">{error}</div>}
  <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/></label>
  <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>
  <button className="button primary" disabled={loading}>{loading?"VERIFYING…":"SIGN IN"}</button>
  <small className="security-note">Supabase Auth + database role authorization</small>
 </form></main>;
}
