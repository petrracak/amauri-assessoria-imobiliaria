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

export type Ordenacao = "destaque" | "menor-preco" | "maior-preco" | "recentes";

export type FiltroImoveis = {
  tipo?: string;
  bairro?: string;
  precoMin?: number;
  precoMax?: number;
  dormitorios?: number;
  suites?: number;
  vagas?: number;
  busca?: string;
  ordenacao?: Ordenacao;
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
  if (filtro.suites) q = q.gte("suites", filtro.suites);
  if (filtro.vagas) q = q.gte("vagas", filtro.vagas);
  if (filtro.busca) {
    // Busca por referência (#026) ou texto livre.
    const so_digitos = filtro.busca.replace(/\D/g, "");
    q = so_digitos && so_digitos.length <= 3
      ? q.eq("ref", so_digitos.padStart(3, "0").replace(/^0+(?=\d)/, ""))
      : q.textSearch("busca", filtro.busca, { type: "websearch", config: "portuguese" });
  }

  // nullsFirst: false mantém "sob consulta" no fim, e não no topo da lista
  // de menor preço, que seria a leitura errada.
  switch (filtro.ordenacao) {
    case "menor-preco":
      q = q.order("preco", { ascending: true, nullsFirst: false });
      break;
    case "maior-preco":
      q = q.order("preco", { ascending: false, nullsFirst: false });
      break;
    case "recentes":
      q = q.order("created_at", { ascending: false });
      break;
    default:
      q = q.order("destaque", { ascending: false }).order("ordem", { ascending: false });
  }

  const { data, error } = await q.limit(limite);

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
    .select("tipo, bairro, preco, dormitorios")
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

  // Contagem por dormitório, com 4 ou mais somados num grupo só: acima
  // disso o filtro deixa de ajudar e vira lista de exceções.
  const dormitorios = [2, 3, 4].map((n) => ({
    minimo: n,
    rotulo: n >= 4 ? "4 ou mais" : String(n),
    total: (data ?? []).filter((l) =>
      n >= 4 ? (l.dormitorios ?? 0) >= 4 : l.dormitorios === n,
    ).length,
  })).filter((d) => d.total > 0);

  const precos = (data ?? [])
    .map((l) => l.preco)
    .filter((p): p is number => typeof p === "number");

  const faixas = FAIXAS_PRECO.map((faixa) => ({
    ...faixa,
    total: precos.filter(
      (p) => p >= faixa.min && (faixa.max === null || p < faixa.max),
    ).length,
  })).filter((f) => f.total > 0);

  return {
    tipos: ordenar(tipos),
    bairros: ordenar(bairros),
    dormitorios,
    faixas,
    total: data?.length ?? 0,
    menorPreco: precos.length ? Math.min(...precos) : null,
  };
}

/** Faixas pensadas para o estoque de Santarém, não cortes genéricos. */
export const FAIXAS_PRECO = [
  { chave: "ate-700", rotulo: "Até R$ 700 mil", min: 0, max: 700_000 },
  { chave: "700-1m", rotulo: "R$ 700 mil a 1 milhão", min: 700_000, max: 1_000_000 },
  { chave: "1m-2m", rotulo: "R$ 1 a 2 milhões", min: 1_000_000, max: 2_000_000 },
  { chave: "2m+", rotulo: "Acima de R$ 2 milhões", min: 2_000_000, max: null },
] as const;

export type Facetas = Awaited<ReturnType<typeof getFacetas>>;
