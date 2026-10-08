import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qalowxnqngzsdlayqivr.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Fp2Y0kbwgE8z-ldpvhzmsw_zQMTxcPQ";

// One browser client owns the persisted VELTRION session. Supabase automatically
// restores the session on app startup and refreshes short-lived access tokens.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
