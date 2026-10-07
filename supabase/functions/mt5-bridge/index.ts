import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const url=Deno.env.get("SUPABASE_URL")!,serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,serviceKey,{auth:{persistSession:false}});
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-mt5-bridge-token","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const bearer=(r:Request)=>String(r.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
async function userFromJwt(r:Request){const t=bearer(r);if(!t)return null;const c=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")||"",{global:{headers:{Authorization:"Bearer "+t}},auth:{persistSession:false}});const {data}=await c.auth.getUser();return data.user||null}
function bridgeAuthorized(r:Request){const configured=Deno.env.get("MT5_BRIDGE_TOKEN"),supplied=String(r.headers.get("x-mt5-bridge-token")||"").trim();return !!configured&&!!supplied&&supplied===configured}
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0};

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const path=new URL(req.url).pathname.replace(/\/+$/,"");
 try{
  if(req.method==="GET"&&(path.endsWith("/status")||path.endsWith("/snapshot")||path.endsWith("/mt5-bridge")||path.endsWith("/functions/v1/mt5-bridge"))){
   const user=await userFromJwt(req);if(!user)return json({ok:false,error:"Authentication required"},401);
   const {data,error}=await db.from("mt5_connections").select("id,user_id,broker,server,login,account_currency,environment,status,last_heartbeat_at,metadata,updated_at").eq("user_id",user.id).order("last_heartbeat_at",{ascending:false}).limit(1).maybeSingle();if(error)throw error;
   const hb=data?.last_heartbeat_at?Date.parse(data.last_heartbeat_at):0,connected=!!data&&data.status==="connected"&&hb>Date.now()-45000;
   return json({ok:true,status:connected?"connected":data?"stale":"not_connected",snapshot:data?{...data,status:connected?"connected":"stale"}:null,capabilities:{account_snapshot:true,positions_snapshot:true,orders_snapshot:true,trade_history_snapshot:true,real_mt5_execution:false,reason:"Read-only MT5 telemetry. Real trading remains in the official Deriv MT5 terminal."}});
  }
  if(req.method==="POST"&&path.endsWith("/heartbeat")){
   if(!bridgeAuthorized(req))return json({ok:false,error:"Bridge authentication required"},401);
   const b=await req.json(),userId=String(b.user_id||"").trim(),server=String(b.server||"").trim(),login=String(b.login||"").trim();
   if(!userId||!server||!login)return json({ok:false,error:"user_id, server and login are required"},400);
   const jwtUser=await userFromJwt(req);if(jwtUser&&userId!==jwtUser.id)return json({ok:false,error:"user_id does not match authenticated user"},403);
   const now=new Date().toISOString(),environment=String(b.environment||"real").toLowerCase();
   if(!["sandbox","real"].includes(environment))return json({ok:false,error:"environment must be sandbox or real"},400);
   const positions=Array.isArray(b.positions)?b.positions:[],orders=Array.isArray(b.orders)?b.orders:[],deals=Array.isArray(b.deals)?b.deals:[],historyOrders=Array.isArray(b.history_orders)?b.history_orders:[],historyDeals=Array.isArray(b.history_deals)?b.history_deals:[];
   const snapshot={terminal_connected:b.terminal_connected!==false,balance:num(b.balance),equity:num(b.equity),margin:num(b.margin),free_margin:num(b.free_margin),margin_level:num(b.margin_level),positions,orders,deals,history_orders:historyOrders,history_deals:historyDeals,environment,received_at:now};
   const {data:connection,error}=await db.from("mt5_connections").upsert({user_id:userId,broker:String(b.broker||"MT5"),server,login,account_currency:String(b.account_currency||"USD"),environment,status:snapshot.terminal_connected?"connected":"degraded",last_heartbeat_at:now,metadata:snapshot,updated_at:now},{onConflict:"user_id,server,login"}).select().single();if(error)throw error;
   const hb=await db.from("mt5_heartbeats").insert({user_id:userId,connection_id:connection.id,heartbeat_at:now,latency_ms:Number.isFinite(Number(b.latency_ms))?Number(b.latency_ms):null,terminal_connected:snapshot.terminal_connected,metadata:snapshot});if(hb.error)throw hb.error;
   const {data:accountRow,error:accountError}=await db.from("mt5_accounts").select("id").eq("connection_id",connection.id).eq("account_number",login).maybeSingle();if(accountError)throw accountError;
   const accountPayload={user_id:userId,connection_id:connection.id,account_number:login,currency:String(b.account_currency||"USD"),balance:num(b.balance),equity:num(b.equity),margin:num(b.margin),free_margin:num(b.free_margin),observed_at:now,raw:snapshot};
   if(accountRow?.id){const u=await db.from("mt5_accounts").update(accountPayload).eq("id",accountRow.id);if(u.error)throw u.error}else{const ins=await db.from("mt5_accounts").insert(accountPayload);if(ins.error)throw ins.error}
   const ev=await db.from("mt5_sync_events").insert({user_id:userId,connection_id:connection.id,event_type:"SNAPSHOT",status:"received",payload:{account:accountPayload,positions,orders,deals,history_orders:historyOrders,history_deals:historyDeals}});if(ev.error)throw ev.error;
   const ie=await db.from("integration_events").insert({user_id:userId,integration:"mt5",event_type:"snapshot",external_id:login,status:"received",payload:snapshot});if(ie.error)throw ie.error;
   return json({ok:true,status:"connected",environment,connection_id:connection.id,heartbeat_at:now,synced:{account:true,positions:positions.length,orders:orders.length,deals:deals.length,history_orders:historyOrders.length,history_deals:historyDeals.length},real_execution:"locked"});
  }
  if(!bridgeAuthorized(req))return json({ok:false,error:"Bridge authentication required"},401);
  return json({ok:false,error:"Route not found"},404);
 }catch(e){console.error("mt5-bridge failed",e instanceof Error?e.message:"unknown");return json({ok:false,error:"MT5 bridge request failed"},500)}
});