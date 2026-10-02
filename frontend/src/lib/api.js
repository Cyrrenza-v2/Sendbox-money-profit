import { supabase } from "../supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qalowxnqngzsdlayqivr.supabase.co";
const API_BASE = `${SUPABASE_URL}/functions/v1/veltrion-gateway-v2`;

export async function api(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("AUTH_REQUIRED");
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `API ${response.status}`);
  return body;
}

export const gatewayBaseUrl = API_BASE;
