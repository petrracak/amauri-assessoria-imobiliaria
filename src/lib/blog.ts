import { createPublicClient } from "@/lib/supabase/public";

export type PostCard = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  capa_url: string | null;
  categoria: string | null;
  publicado_em: string | null;
};

export type Post = PostCard & {
  conteudo: string | null;
  meta_title: string | null;
  meta_description: string | null;
  autor: { nome: string } | null;
};

const CAMPOS_CARD = "id, slug, titulo, resumo, capa_url, categoria, publicado_em";

/** Posts no ar, do mais recente para o mais antigo. */
export async function getPosts(limite = 24, categoria?: string) {
  const supabase = createPublicClient();
  let q = supabase
    .from("posts")
    .select(CAMPOS_CARD)
    .eq("status", "publicado")
    .lte("publicado_em", new Date().toISOString());

  if (categoria) q = q.eq("categoria", categoria);

  const { data, error } = await q
    .order("publicado_em", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return (data ?? []) as PostCard[];
}

export async function getPost(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      `${CAMPOS_CARD}, conteudo, meta_title, meta_description,
       autor:profiles (nome)`,
    )
    .eq("slug", slug)
    .eq("status", "publicado")
    .lte("publicado_em", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return (data as Post | null) ?? null;
}

/** Categorias que têm post publicado, para montar o filtro. */
export async function getCategorias() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("posts")
    .select("categoria")
    .eq("status", "publicado")
    .not("categoria", "is", null);

  const contagem = new Map<string, number>();
  for (const linha of data ?? []) {
    if (linha.categoria) {
      contagem.set(linha.categoria, (contagem.get(linha.categoria) ?? 0) + 1);
    }
  }

  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([nome, total]) => ({ nome, total }));
}
