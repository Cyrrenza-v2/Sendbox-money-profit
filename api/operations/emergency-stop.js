export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  try{
    const {requireAdmin}=await import("../../backend/authGuard.js");
    await requireAdmin(req);
    const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key) return res.status(503).json({error:"SERVER_SECURITY_NOT_CONFIGURED"});
    const response=await fetch(url+"/rest/v1/emergency_controls?control_key=eq.EMERGENCY_STOP",{method:"PATCH",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({is_active:true,updated_at:new Date().toISOString()})});
    if(!response.ok) return res.status(502).json({error:"EMERGENCY_STOP_UPDATE_FAILED"});
    return res.status(200).json({ok:true,emergencyStopped:true});
  }catch(error){return res.status(Number(error.statusCode)||500).json({error:error.message||"INTERNAL_ERROR"});}
}
