import "server-only";

/**
 * Ponto aproximado a partir do endereço escrito, pelo Nominatim
 * (OpenStreetMap). De graça e sem chave, como o resto do mapa.
 *
 * Três decisões aqui vieram de testar contra os endereços reais da
 * carteira, e vale guardar o porquê:
 *
 * 1. Só consulta ESTRUTURADA (street/city/state separados). A busca livre
 *    inventa: "Liberdade" voltou como uma igreja e "Aparecida" como uma
 *    escola, prédios de nome parecido que entrariam no mapa como se
 *    fossem o imóvel.
 * 2. Só resultado de VIA é aceito. Bairro, cidade e CEP são área, não
 *    endereço, e viram pino no meio do nada.
 * 3. O que volta é um ponto da rua, NÃO o número: o OSM não tem os
 *    números de Santarém. Na Avenida Rui Barbosa, que atravessa a cidade,
 *    o ponto ficou 1,6 km do número cadastrado. Por isso quem chama isto
 *    grava a origem como 'endereco', e o mapa desenha diferente.
 */

/** Tipos de via do OSM. Qualquer outra coisa é recusada. */
const VIAS = new Set([
  "primary",
  "secondary",
  "tertiary",
  "residential",
  "unclassified",
  "trunk",
  "motorway",
  "living_street",
  "pedestrian",
  "road",
  "service",
  "track",
]);

const ABREVIACOES: [RegExp, string][] = [
  [/\bav\.?\b/gi, "Avenida"],
  [/\btv\.?\b/gi, "Travessa"],
  [/\btrav\.?\b/gi, "Travessa"],
  [/\br\.\B|\br\.\s/gi, "Rua "],
  [/\brod\.?\b/gi, "Rodovia"],
  [/\beng\.?\b/gi, "Engenheiro"],
  [/\bdr\.?\b/gi, "Doutor"],
  [/\bdra\.?\b/gi, "Doutora"],
  [/\bpç\.?\b|\bpc\.?\b/gi, "Praça"],
  [/\bal\.?\b/gi, "Alameda"],
  [/\best\.?\b/gi, "Estrada"],
];

/**
 * Tira o que atrapalha a consulta: o "nº", o complemento depois do
 * travessão e as repetições de bairro/cidade que a equipe às vezes cola
 * no mesmo campo.
 */
function limparRua(endereco: string) {
  let rua = endereco.split(" - ")[0];
  rua = rua.replace(/\bn[ºo°]\.?\s*/gi, " ");
  rua = rua.replace(/\s*,\s*/g, " ");
  for (const [de, para] of ABREVIACOES) rua = rua.replace(de, para);
  rua = rua.replace(/\s+/g, " ").trim();

  // Fora o número da casa, que vem no fim. O Nominatim o ignora de todo
  // jeito, e número estranho atrapalha: um imóvel tinha o CEP no lugar do
  // número e a avenida inteira deixava de ser encontrada. Só grupo de
  // dígitos solto no fim — "Rua 15 de Novembro" e "BR-163" ficam de pé.
  return rua.replace(/(?:\s+\d{1,8})+$/, "").trim();
}

/**
 * Endereço que é só o nome do bairro repetido ("Liberdade", no bairro
 * Liberdade) não chega a ser endereço — nem vale a viagem.
 */
function pareceRua(endereco: string, bairro?: string | null) {
  const limpo = endereco.trim();
  if (limpo.length < 6) return false;
  if (bairro && limpo.toLowerCase() === bairro.trim().toLowerCase()) return false;
  return /\d|\b(rua|r\.|av|avenida|travessa|tv|rod|rodovia|alameda|estrada|praça|passagem)\b/i.test(
    limpo,
  );
}

export type PontoAproximado = { lat: number; lng: number };

const CLIENTE = "PainelImobiliario/1.0 (geocodificacao-interna)";

export async function pontoDoEndereco(imovel: {
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}): Promise<PontoAproximado | null> {
  const endereco = imovel.endereco?.trim();
  if (!endereco || !pareceRua(endereco, imovel.bairro)) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("street", limparRua(endereco));
  url.searchParams.set("city", (imovel.cidade ?? "Santarém").trim());
  url.searchParams.set("state", imovel.uf?.trim() === "PA" ? "Pará" : (imovel.uf ?? "Pará"));
  url.searchParams.set("country", "Brasil");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "pt-BR");

  let achado: { lat?: string; lon?: string; type?: string; addresstype?: string } | undefined;
  try {
    const resposta = await fetch(url, {
      headers: { "User-Agent": CLIENTE, Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!resposta.ok) return null;
    achado = (await resposta.json())?.[0];
  } catch {
    return null;
  }

  if (!achado) return null;

  const tipo = (achado.addresstype ?? achado.type ?? "").toLowerCase();
  if (!VIAS.has(tipo)) return null;

  const lat = Number(achado.lat);
  const lng = Number(achado.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
}
