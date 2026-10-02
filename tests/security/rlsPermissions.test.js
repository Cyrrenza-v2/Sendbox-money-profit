import test from "node:test"; import assert from "node:assert/strict";
const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||"https://qalowxnqngzsdlayqivr.supabase.co";
const key=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||"sb_publishable_Fp2Y0kbwgE8z-ldpvhzmsw_zQMTxcPQ";
async function denied(path,options={}){const r=await fetch(url+path,{...options,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...(options.headers||{})}});return r.status;}
test("anonymous audit log read is denied",async()=>assert.ok((await denied("/rest/v1/audit_logs?select=id&limit=1"))>=400));
test("anonymous real order insert is denied",async()=>assert.ok((await denied("/rest/v1/real_orders",{method:"POST",body:JSON.stringify({})}))>=400));
