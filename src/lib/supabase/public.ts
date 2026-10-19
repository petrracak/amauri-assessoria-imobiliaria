import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Cliente anônimo, sem cookie. Como não lê a requisição, as páginas que o
 * usam podem ser geradas estaticamente e revalidadas por ISR, em vez de
 * consultar o Supabase a cada acesso.
 *
 * O RLS garante que daqui só sai o que está publicado.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
