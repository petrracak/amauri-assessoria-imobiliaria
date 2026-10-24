import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  nome: string;
  email: string | null;
  role: "admin" | "corretor";
  ativo: boolean;
  avatar_url: string | null;
};

/**
 * Perfil de quem está logado. Redireciona para o login se não houver sessão,
 * e trata um usuário sem perfil (ou desativado) como sem acesso.
 */
export async function exigirPerfil(): Promise<Perfil> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nome, email, role, ativo, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil || !perfil.ativo) redirect("/admin/login?erro=sem-acesso");

  return perfil as Perfil;
}

export async function exigirAdmin(): Promise<Perfil> {
  const perfil = await exigirPerfil();
  if (perfil.role !== "admin") redirect("/admin");
  return perfil;
}
