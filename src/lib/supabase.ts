import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://komrzgeixedcofpeccwj.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbXJ6Z2VpeGVkY29mcGVjY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTQzMDMsImV4cCI6MjEwODU5MDMwM30.RDZxPRMgvcDGUSScbSSLrTsbXO6ejNRk5YfxYULbBm4";

// Cliente público estándar (para el navegador / frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo con permisos Service Role (para APIs de servidor seguras)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase;
