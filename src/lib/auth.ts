import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  nome: string;
  email: string | null;
  role: "admin" | "corretor";
  ativo: boolean;
  avatar_url: string | null;
  /** Já definiu a própria senha em /admin/conta. */
  senhaPropria: boolean;
};

/**
 * Perfil de quem está logado. Redireciona para o login se não houver sessão,
 * e trata um usuário sem perfil (ou desativado) como sem acesso.
 *
 * Envolvida em cache(): o layout e a página chamam isto na mesma requisição,
 * e sem o cache cada um faria a própria ida ao banco.
 *
 * A identidade vem de getClaims(), que confere a assinatura do token sem
 * rede. O que decide o acesso é o perfil (ativo, papel), lido do banco a cada
 * requisição — então suspender alguém vale na hora, sem esperar o token
 * expirar.
 */
export const exigirPerfil = cache(async (): Promise<Perfil> => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nome, email, role, ativo, avatar_url")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!perfil || !perfil.ativo) redirect("/admin/login?erro=sem-acesso");

  const meta = claims.user_metadata as { senha_propria?: boolean } | undefined;

  return {
    ...(perfil as Omit<Perfil, "senhaPropria">),
    // O Supabase grava uma senha aleatória em conta criada sem senha, então
    // o banco não distingue quem tem senha de quem não tem. A marca é gravada
    // quando a pessoa salva a própria senha. Uma senha que o administrador
    // definiu não conta: é provisória, e o aviso é o lembrete de trocar.
    senhaPropria: meta?.senha_propria === true,
  };
});

export async function exigirAdmin(): Promise<Perfil> {
  const perfil = await exigirPerfil();
  if (perfil.role !== "admin") redirect("/admin");
  return perfil;
}
