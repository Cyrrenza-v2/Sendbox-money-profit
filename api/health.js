export default async function handler(req,res){
  const { SystemHealthChecker }=await import("../monitoring/systemHealthChecker.js");
  const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
  const key=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY;
  let client=null;
  if(url&&key){ const {createClient}=await import("@supabase/supabase-js"); client=createClient(url,key,{auth:{persistSession:false}}); }
  const report=await new SystemHealthChecker(client).checkAllServices();
  res.status(200).json({ok:true,...report});
}
