"use server";

import { revalidatePath } from "next/cache";

import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Grava no perfil a foto que o navegador já enviou ao storage.
 *
 * O caminho é validado contra o id de quem está logado: mesmo que alguém
 * chame a ação direto, não consegue apontar a foto de outra pessoa — e a
 * própria política do storage já impede escrever fora da pasta.
 */
export async function salvarAvatar(path: string | null) {
  const perfil = await exigirPerfil();
  const supabase = await createClient();

  if (path && !path.startsWith(`${perfil.id}/`)) {
    return { ok: false, mensagem: "Caminho de foto inválido." };
  }

  const { data: antes } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", perfil.id)
    .maybeSingle();

  let url: string | null = null;
  if (path) {
    const { data } = supabase.storage.from("avatares").getPublicUrl(path);
    url = data.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", perfil.id);

  if (error) return { ok: false, mensagem: `Não deu para salvar: ${error.message}` };

  // Tira o arquivo antigo do storage, senão cada troca deixa lixo para trás.
  const anterior = antes?.avatar_url;
  if (anterior && anterior !== url) {
    const marcador = "/avatares/";
    const i = anterior.indexOf(marcador);
    if (i >= 0) {
      await supabase.storage
        .from("avatares")
        .remove([anterior.slice(i + marcador.length)]);
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true, mensagem: path ? "Foto atualizada." : "Foto removida." };
}
