/**
 * Põe no mapa, por aproximação, os imóveis que têm endereço escrito e
 * nenhum link do Google Maps.
 *
 *   node scripts/geocodificar-imoveis.mjs --previa   # só mostra
 *   node scripts/geocodificar-imoveis.mjs            # grava
 *
 * O ponto vem do Nominatim (OpenStreetMap) e cai na RUA, não no número —
 * o OSM não tem os números de Santarém. Por isso o que é gravado leva
 * coordenada_origem = 'endereco', e o painel desenha esse pino diferente.
 * Quem já tem link do Maps não é tocado: link é o lugar, isto é palpite.
 *
 * A limpeza do endereço aqui espelha src/lib/geocodificar.ts, que faz o
 * mesmo na hora de salvar um cadastro. Mexeu em um, confira o outro.
 */
import { readFileSync } from "node:fs";

const PREVIA = process.argv.includes("--previa");
const CLIENTE = "PainelImobiliario/1.0 (geocodificacao-interna)";

// Rodar da raiz do projeto, como os outros scripts.
const env = {};
for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
  const l = linha.trim();
  if (!l || l.startsWith("#") || !l.includes("=")) continue;
  const [c, ...r] = l.split("=");
  env[c.trim()] = r.join("=").trim();
}

const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  "Content-Type": "application/json",
};

const VIAS = new Set([
  "primary", "secondary", "tertiary", "residential", "unclassified",
  "trunk", "motorway", "living_street", "pedestrian", "road", "service", "track",
]);

const ABREVIACOES = [
  [/\bav\.?\b/gi, "Avenida"],
  [/\btv\.?\b/gi, "Travessa"],
  [/\btrav\.?\b/gi, "Travessa"],
  [/\brod\.?\b/gi, "Rodovia"],
  [/\beng\.?\b/gi, "Engenheiro"],
  [/\bdr\.?\b/gi, "Doutor"],
  [/\bdra\.?\b/gi, "Doutora"],
  [/\bpç\.?\b|\bpc\.?\b/gi, "Praça"],
  [/\bal\.?\b/gi, "Alameda"],
  [/\best\.?\b/gi, "Estrada"],
];

function limparRua(endereco) {
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

function pareceRua(endereco, bairro) {
  const limpo = endereco.trim();
  if (limpo.length < 6) return false;
  if (bairro && limpo.toLowerCase() === bairro.trim().toLowerCase()) return false;
  return /\d|\b(rua|r\.|av|avenida|travessa|tv|rod|rodovia|alameda|estrada|praça|passagem)\b/i.test(limpo);
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function ponto(imovel) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("street", limparRua(imovel.endereco));
  url.searchParams.set("city", (imovel.cidade ?? "Santarém").trim());
  url.searchParams.set("state", imovel.uf === "PA" ? "Pará" : (imovel.uf ?? "Pará"));
  url.searchParams.set("country", "Brasil");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "pt-BR");

  const r = await fetch(url, { headers: { "User-Agent": CLIENTE, Accept: "application/json" } });
  if (!r.ok) return null;

  const a = (await r.json())?.[0];
  if (!a) return null;

  const tipo = (a.addresstype ?? a.type ?? "").toLowerCase();
  if (!VIAS.has(tipo)) return { recusado: tipo };

  const lat = Number(a.lat);
  const lng = Number(a.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng, via: a.display_name?.split(",")[0] };
}

const consulta = new URLSearchParams({
  select: "id,ref,endereco,bairro,cidade,uf,latitude,coordenada_origem,mapa_url",
  status: "neq.arquivado",
  endereco: "not.is.null",
  order: "ref",
});

const resposta = await fetch(`${base}/rest/v1/properties?${consulta}`, { headers: cabecalhos });
const todos = await resposta.json();

// Link do Maps manda. E coordenada que já veio de link não se toca.
const candidatos = todos.filter(
  (i) =>
    !i.mapa_url &&
    i.endereco?.trim() &&
    pareceRua(i.endereco, i.bairro) &&
    (i.latitude === null || i.coordenada_origem === "endereco"),
);

console.log(
  `${todos.length} com endereço · ${candidatos.length} para buscar${PREVIA ? " (prévia, nada será gravado)" : ""}\n`,
);

let gravados = 0;
let semVia = 0;

for (const imovel of candidatos) {
  const achado = await ponto(imovel);

  if (!achado) {
    console.log(`${String(imovel.ref).padStart(3)} · nada encontrado · ${imovel.endereco}`);
    semVia++;
  } else if (achado.recusado) {
    console.log(`${String(imovel.ref).padStart(3)} · recusado (${achado.recusado}) · ${imovel.endereco}`);
    semVia++;
  } else {
    console.log(
      `${String(imovel.ref).padStart(3)} · ${achado.lat.toFixed(5)},${achado.lng.toFixed(5)} · ${achado.via}`,
    );

    if (!PREVIA) {
      const r = await fetch(`${base}/rest/v1/properties?id=eq.${imovel.id}`, {
        method: "PATCH",
        headers: { ...cabecalhos, Prefer: "return=minimal" },
        body: JSON.stringify({
          latitude: achado.lat,
          longitude: achado.lng,
          coordenada_origem: "endereco",
        }),
      });
      if (!r.ok) console.log(`      ↳ não gravou: ${r.status}`);
      else gravados++;
    }
  }

  await dormir(1200); // política do Nominatim: no máximo um por segundo
}

console.log(
  `\n${PREVIA ? "prévia" : `${gravados} gravados`} · ${semVia} sem via encontrada`,
);
