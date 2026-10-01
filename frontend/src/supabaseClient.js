import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://qalowxnqngzsdlayqivr.supabase.co";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Fp2Y0kbwgE8z-ldpvhzmsw_zQMTxcPQ";

export const supabase = createClient(url, key);
