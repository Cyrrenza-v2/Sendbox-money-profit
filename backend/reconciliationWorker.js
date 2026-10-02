import { supabase } from "../frontend/src/supabaseClient.js";

export async function runReconciliation() {
  const started = new Date().toISOString();
  const { data, error } = await supabase.from("system_health").select("service_name,status,last_heartbeat").order("service_name");
  if (error) throw error;
  return { status: "COMPLETED", startedAt: started, completedAt: new Date().toISOString(), servicesChecked: (data || []).length, corrections: 0 };
}
