import { createPublicClient } from "@/lib/supabase/public";

/** Colunas que o card precisa — não traz descrição, que é pesada. */
const CAMPOS_CARD = `
  id, ref, slug, titulo, tipo, bairro, cidade, preco, preco_anterior,
  dormitorios, suites, banheiros, vagas, area_total, area_privativa,
  alto_padrao, badge, destaque,
  imagens:property_images (url, alt, ordem)
`;

export type ImovelCard = {
  id: string;
  ref: string;
  slug: string;
  titulo: string;
  tipo: string;
  bairro: string | null;
  cidade: string;
  preco: number | null;
  preco_anterior: number | null;
  dormitorios: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area_total: number | null;
  area_privativa: number | null;
  alto_padrao: boolean;
  badge: string | null;
  destaque: boolean;
  imagens: { url: string; alt: string | null; ordem: number }[];
};

function ordenarImagens<T extends { imagens: { ordem: number }[] }>(linhas: T[]) {
  for (const linha of linhas) {
    linha.imagens?.sort((a, b) => a.ordem - b.ordem);
  }
  return linhas;
}

/** Vitrine da home: destaques primeiro, depois os mais caros. */
export async function getDestaques(limite = 6) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("properties")
    .select(CAMPOS_CARD)
    .eq("status", "publicado")
    .order("destaque", { ascending: false })
    .order("preco", { ascending: false, nullsFirst: false })
    .limit(limite);

  if (error) throw error;
  return ordenarImagens((data ?? []) as unknown as ImovelCard[]);
}

export type FiltroImoveis = {
  tipo?: string;
  bairro?: string;
  precoMin?: number;
  precoMax?: number;
  dormitorios?: number;
  busca?: string;
};

export async function getImoveis(filtro: FiltroImoveis = {}, limite = 48) {
  const supabase = createPublicClient();
  let q = supabase
    .from("properties")
    .select(CAMPOS_CARD)
    .eq("status", "publicado");

  if (filtro.tipo) q = q.eq("tipo", filtro.tipo);
  if (filtro.bairro) q = q.eq("bairro", filtro.bairro);
  if (filtro.precoMin) q = q.gte("preco", filtro.precoMin);
  if (filtro.precoMax) q = q.lte("preco", filtro.precoMax);
  if (filtro.dormitorios) q = q.gte("dormitorios", filtro.dormitorios);
  if (filtro.busca) {
    // Busca por referência (#026) ou texto livre.
    const so_digitos = filtro.busca.replace(/\D/g, "");
    q = so_digitos && so_digitos.length <= 3
      ? q.eq("ref", so_digitos.padStart(3, "0").replace(/^0+(?=\d)/, ""))
      : q.textSearch("busca", filtro.busca, { type: "websearch", config: "portuguese" });
  }

  const { data, error } = await q
    .order("destaque", { ascending: false })
    .order("ordem", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return ordenarImagens((data ?? []) as unknown as ImovelCard[]);
}

export async function getImovel(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `*, imagens:property_images (url, alt, ordem, largura, altura),
       caracteristicas:property_features (features (nome, grupo))`,
    )
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  data.imagens?.sort(
    (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem,
  );
  return data;
}

/** Bairros e tipos que realmente têm imóvel publicado, para montar filtros. */
export async function getFacetas() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("properties")
    .select("tipo, bairro, preco")
    .eq("status", "publicado");

  if (error) throw error;

  const tipos = new Map<string, number>();
  const bairros = new Map<string, number>();
  for (const linha of data ?? []) {
    if (linha.tipo) tipos.set(linha.tipo, (tipos.get(linha.tipo) ?? 0) + 1);
    if (linha.bairro) bairros.set(linha.bairro, (bairros.get(linha.bairro) ?? 0) + 1);
  }

  const ordenar = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
      .map(([nome, total]) => ({ nome, total }));

  return {
    tipos: ordenar(tipos),
    bairros: ordenar(bairros),
    total: data?.length ?? 0,
  };
}
