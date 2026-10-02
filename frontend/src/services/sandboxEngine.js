import { supabase } from "../supabaseClient";
const BASE="https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/sandbox-service";
async function request(path="",options={}){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token) throw new Error("AUTH_REQUIRED");
 const r=await fetch(BASE+path,{...options,headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token,...(options.headers||{})}});
 const body=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(body.error||"Sandbox API "+r.status);
 return body;
}
export const sandboxEngine={snapshot:()=>request(),executeOrder:p=>request("/order",{method:"POST",body:JSON.stringify(p)}),closePosition:p=>request("/close",{method:"POST",body:JSON.stringify(p)}),mark:p=>request("/mark",{method:"POST",body:JSON.stringify(p)})};