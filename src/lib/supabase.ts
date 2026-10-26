import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://komrzgeixedcofpeccwj.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_zMc59usQYp9R-2vutucIIA_mx8A7U69";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
