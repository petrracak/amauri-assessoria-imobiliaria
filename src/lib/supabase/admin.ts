import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Cliente com service_role: ignora RLS e fala com a API de administração
 * do Auth. Necessário para criar conta e definir senha de outra pessoa.
 *
 * Regras de uso, sem exceção:
 * - só em Server Action ou Route Handler, nunca em componente de cliente;
 * - sempre depois de `exigirAdmin()`, nunca antes;
 * - nunca devolver o resultado cru para o navegador.
 *
 * O "server-only" acima faz o build quebrar se alguém importar isto de um
 * componente de cliente, em vez de vazar a chave silenciosamente.
 */
export function createAdminClient() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada: a gestão de equipe precisa dela.",
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    chave,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
