import { supabase } from "../supabaseClient";

const API_BASE = "https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/veltrion-api";

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
