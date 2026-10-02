import { supabase } from "../frontend/src/supabaseClient.js";

export async function getHealthSnapshot() {
  const { data, error } = await supabase.from("system_health").select("service_name,status,last_heartbeat,metadata").order("service_name");
  if (error) throw error;
  return { checkedAt: new Date().toISOString(), services: data || [] };
}
