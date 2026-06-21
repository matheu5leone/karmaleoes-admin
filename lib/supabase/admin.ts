import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Supabase com a chave service-role — IGNORA RLS.
 * SERVER-ONLY. Nunca importar em Client Components nem expor a chave ao browser.
 * Uso restrito: seed, operações administrativas controladas (ex.: criação de usuários).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
