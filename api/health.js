export default async function handler(req,res){
  const {SystemHealthChecker}=await import("../monitoring/systemHealthChecker.js");
  const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
  const key=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY;
  const client=url&&key?{from:(table)=>({select:()=>({limit:async(n)=>{const response=await fetch(url+"/rest/v1/"+table+"?select=control_key&limit="+n,{headers:{apikey:key,Authorization:"Bearer "+key}});return {data:response.ok?await response.json():null,error:response.ok?null:new Error("SUPABASE_"+response.status)};}})})}:null;
  try{const report=await new SystemHealthChecker(client).checkAllServices();return res.status(200).json({ok:true,...report});}
  catch(error){return res.status(503).json({ok:false,error:error.message||"HEALTH_CHECK_FAILED"});}
}
