/**
 * Define a foto de perfil de alguém da equipe.
 *
 *   node scripts/definir-avatar.mjs <usuario> <arquivo>
 *   node scripts/definir-avatar.mjs maria.souza ~/Desktop/maria.jpg
 *
 * Recorta no centro, reduz para 400x400 e grava no perfil. Serve para a
 * carga inicial; no dia a dia cada pessoa troca a própria em Conta.
 */
import { readFileSync } from "node:fs";

import sharp from "sharp";

const LADO = 400;

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

const [usuario, arquivo] = process.argv.slice(2);
if (!usuario || !arquivo) {
  console.error("Uso: node scripts/definir-avatar.mjs <usuario> <arquivo>");
  process.exit(1);
}

const env = carregarEnv();
const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
const cabecalhos = { apikey: chave, Authorization: `Bearer ${chave}` };

// 1. Localiza o perfil pelo apelido de acesso.
const busca = await fetch(
  `${base}/rest/v1/profiles?usuario=eq.${encodeURIComponent(usuario)}&select=id,nome,avatar_url`,
  { headers: { ...cabecalhos, Accept: "application/json" } },
);
const [perfil] = await busca.json();

if (!perfil) {
  console.error(`Nenhum perfil com o usuário "${usuario}".`);
  process.exit(1);
}

// 2. Quadrado centralizado, no tamanho que o painel usa.
const quadrado = await sharp(readFileSync(arquivo))
  .rotate()
  .resize(LADO, LADO, { fit: "cover", position: "attention" })
  .webp({ quality: 86 })
  .toBuffer();

const caminho = `${perfil.id}/${Date.now()}.webp`;

const envio = await fetch(`${base}/storage/v1/object/avatares/${caminho}`, {
  method: "POST",
  headers: { ...cabecalhos, "Content-Type": "image/webp", "x-upsert": "true" },
  body: quadrado,
});

if (!envio.ok) {
  console.error("Falha no upload:", await envio.text());
  process.exit(1);
}

const url = `${base}/storage/v1/object/public/avatares/${caminho}`;

const gravou = await fetch(`${base}/rest/v1/profiles?id=eq.${perfil.id}`, {
  method: "PATCH",
  headers: { ...cabecalhos, "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({ avatar_url: url }),
});

if (!gravou.ok) {
  console.error("Falha ao gravar no perfil:", await gravou.text());
  process.exit(1);
}

console.log(`${perfil.nome}: foto definida (${(quadrado.length / 1024).toFixed(0)} KB)`);
