"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirAdmin, exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function slugify(texto: string) {
  return texto
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

const schema = z.object({
  id: z.uuid().optional().or(z.literal("")),
  titulo: z.string().trim().min(3, "Dê um título ao texto."),
  slug: z.string().trim().max(80).optional(),
  resumo: z.string().trim().max(400).optional(),
  conteudo: z.string().trim().max(60000).optional(),
  categoria: z.string().trim().max(60).optional(),
  status: z.enum(["rascunho", "publicado"]),
  capa_url: z.string().trim().optional(),
  capa_path: z.string().trim().optional(),
  meta_title: z.string().trim().max(120).optional(),
  meta_description: z.string().trim().max(200).optional(),
});

export type EstadoPost = {
  ok: boolean;
  id?: string;
  mensagem?: string;
  erros?: Record<string, string>;
};

/** Garante slug único: "titulo", depois "titulo-2", "titulo-3"… */
async function slugLivre(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  ignorarId?: string,
) {
  for (let n = 1; n < 50; n++) {
    const tentativa = n === 1 ? base : `${base}-${n}`;
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", tentativa)
      .maybeSingle();

    if (!data || data.id === ignorarId) return tentativa;
  }
  return `${base}-${Date.now()}`;
}

export async function salvarPost(
  _anterior: EstadoPost,
  formData: FormData,
): Promise<EstadoPost> {
  const perfil = await exigirPerfil();

  const resultado = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!resultado.success) {
    const erros: Record<string, string> = {};
    for (const p of resultado.error.issues) {
      erros[String(p.path[0] ?? "form")] ??= p.message;
    }
    return { ok: false, erros };
  }

  const { id, ...dados } = resultado.data;
  const supabase = await createClient();

  const base = slugify(dados.slug || dados.titulo);
  const slug = await slugLivre(supabase, base || `texto-${Date.now()}`, id || undefined);

  const campos = {
    titulo: dados.titulo,
    slug,
    resumo: dados.resumo || null,
    conteudo: dados.conteudo || null,
    categoria: dados.categoria || null,
    status: dados.status,
    capa_url: dados.capa_url || null,
    capa_path: dados.capa_path || null,
    meta_title: dados.meta_title || null,
    meta_description: dados.meta_description || dados.resumo || null,
  };

  if (id) {
    // A data de publicação é gravada na primeira vez que vai ao ar.
    const { data: atual } = await supabase
      .from("posts")
      .select("publicado_em")
      .eq("id", id)
      .maybeSingle();

    const publicado_em =
      dados.status === "publicado" && !atual?.publicado_em
        ? new Date().toISOString()
        : atual?.publicado_em ?? null;

    const { error } = await supabase
      .from("posts")
      .update({ ...campos, publicado_em })
      .eq("id", id);

    if (error) return { ok: false, mensagem: `Não deu para salvar: ${error.message}` };

    revalidatePath("/admin", "layout");
  revalidatePath("/admin/posts");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return { ok: true, id, mensagem: "Alterações salvas." };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...campos,
      autor_id: perfil.id,
      publicado_em: dados.status === "publicado" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, mensagem: `Não deu para criar: ${error.message}` };

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  return { ok: true, id: data.id, mensagem: "Texto criado." };
}

export async function apagarPost(id: string) {
  // Mesma regra do imóvel: esconder o botão não autoriza nada.
  await exigirAdmin();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("capa_path")
    .eq("id", id)
    .maybeSingle();

  if (post?.capa_path) {
    await supabase.storage.from("blog").remove([post.capa_path]);
  }

  await supabase.from("posts").delete().eq("id", id);

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
}
