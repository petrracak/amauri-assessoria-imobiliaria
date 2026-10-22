/**
 * Converte as fotos já guardadas no Storage para WebP, em dois tamanhos.
 *
 *   node scripts/otimizar-imagens.mjs [--dry]
 *
 * Por que: o otimizador de imagem da Vercel tem cota no plano free, e as 396
 * fotos da importação a esgotaram — as imagens passaram a responder 402 e
 * sumiram do site. Servindo arquivos já otimizados, o site não depende mais
 * dele, e fica mais rápido e mais barato.
 *
 * Cada foto vira:
 *   <pasta>/<nome>.webp      até 1600px  — ficha e galeria
 *   <pasta>/<nome>-sm.webp   até 640px   — cards e listagens
 */
import { readFileSync } from "node:fs";

import sharp from "sharp";

const LARGO = 1600;
const PEQUENO = 640;
const BUCKET = "imoveis";

function carregarEnv(caminho = ".env.local") {
  const env = {};
  for (const linha of readFileSync(caminho, "utf8").split("\n")) {
    const l = linha.trim();
    if (!l || l.startsWith("#") || !l.includes("=")) continue;
    const [k, ...resto] = l.split("=");
    env[k.trim()] = resto.join("=").trim();
  }
  return env;
}

const env = carregarEnv();
const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
const seco = process.argv.includes("--dry");

const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
};

async function listarFotos() {
  const r = await fetch(
    `${base}/rest/v1/property_images?select=id,url,path&order=path`,
    { headers: { ...cabecalhos, Accept: "application/json" } },
  );
  if (!r.ok) throw new Error(`listagem falhou: ${r.status} ${await r.text()}`);
  return r.json();
}

async function enviar(caminho, buffer) {
  const r = await fetch(`${base}/storage/v1/object/${BUCKET}/${caminho}`, {
    method: "POST",
    headers: { ...cabecalhos, "Content-Type": "image/webp", "x-upsert": "true" },
    body: buffer,
  });
  if (!r.ok) throw new Error(`upload ${caminho}: ${r.status} ${await r.text()}`);
}

async function atualizarLinha(id, url, caminho) {
  const r = await fetch(`${base}/rest/v1/property_images?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...cabecalhos, "Content-Type": "application/json" },
    body: JSON.stringify({ url, path: caminho }),
  });
  if (!r.ok) throw new Error(`update ${id}: ${r.status} ${await r.text()}`);
}

async function apagar(caminhos) {
  if (!caminhos.length) return;
  await fetch(`${base}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { ...cabecalhos, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: caminhos }),
  });
}

const fotos = await listarFotos();
console.log(`${fotos.length} fotos no banco${seco ? " (simulação)" : ""}\n`);

let convertidas = 0;
let puladas = 0;
let bytesAntes = 0;
let bytesDepois = 0;
const erros = [];

for (const [i, foto] of fotos.entries()) {
  const caminhoAntigo = foto.path;
  if (!caminhoAntigo) {
    puladas++;
    continue;
  }

  const semExt = caminhoAntigo.replace(/\.[a-z0-9]+$/i, "");
  const novo = `${semExt}.webp`;
  const novoSm = `${semExt}-sm.webp`;

  if (caminhoAntigo === novo && foto.url.endsWith(".webp")) {
    puladas++;
    continue;
  }

  try {
    const resposta = await fetch(foto.url);
    if (!resposta.ok) throw new Error(`download ${resposta.status}`);
    const original = Buffer.from(await resposta.arrayBuffer());
    bytesAntes += original.length;

    const grande = await sharp(original)
      .rotate() // respeita o EXIF: foto de celular vem deitada
      .resize({ width: LARGO, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const pequeno = await sharp(original)
      .rotate()
      .resize({ width: PEQUENO, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    bytesDepois += grande.length + pequeno.length;

    if (!seco) {
      await enviar(novo, grande);
      await enviar(novoSm, pequeno);
      await atualizarLinha(
        foto.id,
        `${base}/storage/v1/object/public/${BUCKET}/${novo}`,
        novo,
      );
      if (caminhoAntigo !== novo) await apagar([caminhoAntigo]);
    }

    convertidas++;
    if ((i + 1) % 25 === 0 || i === fotos.length - 1) {
      console.log(`  ${i + 1}/${fotos.length} processadas`);
    }
  } catch (e) {
    erros.push({ path: caminhoAntigo, erro: String(e).slice(0, 120) });
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`\nconvertidas: ${convertidas} | já estavam ok: ${puladas} | erros: ${erros.length}`);
console.log(`antes: ${mb(bytesAntes)} MB  →  depois: ${mb(bytesDepois)} MB (os dois tamanhos juntos)`);
if (erros.length) console.log("\nerros:", JSON.stringify(erros.slice(0, 10), null, 1));
