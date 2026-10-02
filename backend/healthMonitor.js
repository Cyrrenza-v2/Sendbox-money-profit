const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function getHealthSnapshot() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { checkedAt: new Date().toISOString(), services: [], configured: false };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/system_health?select=service_name,status,last_heartbeat,metadata&order=service_name`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  if (!response.ok) throw new Error(`SUPABASE_${response.status}`);
  return { checkedAt: new Date().toISOString(), services: await response.json(), configured: true };
}
