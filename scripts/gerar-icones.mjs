/**
 * Gera os arquivos de marca usados pelo site, a partir dos originais em
 * assets/marca/.
 *
 *   node scripts/gerar-icones.mjs
 *
 * Rode de novo sempre que um original mudar. Os arquivos em public/ são
 * saída deste script — não edite à mão.
 */
import { mkdir, writeFile } from "node:fs/promises";

import sharp from "sharp";

const ORIGEM = "assets/marca";
const AZUL = "#1868a8"; // cor dominante do ícone oficial

/**
 * Só o triângulo, sem a assinatura — usado na abertura animada do site.
 * Entre o símbolo e o texto há uma faixa vazia; o corte é ali.
 */
async function simbolo(origem, destino, altura) {
  const aparado = await sharp(`${ORIGEM}/${origem}`).trim({ threshold: 1 }).toBuffer();
  const { width } = await sharp(aparado).metadata();

  const png = await sharp(aparado)
    .extract({ left: 0, top: 0, width, height: 1353 })
    .trim({ threshold: 1 })
    .resize({ height: altura, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(destino, png);
  const m = await sharp(png).metadata();
  return { destino, dim: `${m.width}×${m.height}`, kb: png.length / 1024 };
}

/** Tira a margem transparente e redimensiona pela largura. */
async function logo(origem, destino, largura) {
  const png = await sharp(`${ORIGEM}/${origem}`)
    .trim({ threshold: 1 })
    .resize({ width: largura, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  await writeFile(destino, png);
  const { width, height } = await sharp(png).metadata();
  return { destino, dim: `${width}×${height}`, kb: png.length / 1024 };
}

async function icone(destino, lado) {
  const png = await sharp(`${ORIGEM}/icone.webp`)
    .resize(lado, lado, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(destino, png);
  return { destino, dim: `${lado}×${lado}`, kb: png.length / 1024 };
}

/**
 * Maskable: o sistema recorta as bordas num círculo ou squircle, então o
 * fundo precisa ser cheio. Usa o símbolo branco sobre o azul da marca —
 * reaproveitar o ícone pronto deixaria um quadrado arredondado dentro de
 * outro, visível depois do recorte.
 */
async function iconeMaskable(destino, lado = 512) {
  const seguro = Math.round(lado * 0.56); // 80% de área segura, com folga

  // O arquivo do símbolo traz a assinatura embaixo, ilegível neste tamanho.
  // Entre o triângulo e o texto há uma faixa vazia: corta ali.
  const aparado = await sharp(`${ORIGEM}/simbolo-branco.webp`)
    .trim({ threshold: 1 })
    .toBuffer();
  const { width: largura } = await sharp(aparado).metadata();

  const miolo = await sharp(aparado)
    .extract({ left: 0, top: 0, width: largura, height: 1353 })
    .trim({ threshold: 1 })
    .resize({ height: seguro, fit: "inside" })
    .toBuffer();

  const png = await sharp({
    create: {
      width: lado,
      height: lado,
      channels: 4,
      background: AZUL,
    },
  })
    .composite([{ input: miolo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(destino, png);
  return { destino, dim: `${lado}×${lado}`, kb: png.length / 1024 };
}

/** Banner e retrato: fotos, não marca — WebP com qualidade alta. */
async function foto(origem, destino, largura, qualidade = 82) {
  const webp = await sharp(`${ORIGEM}/${origem}`)
    .resize({ width: largura, withoutEnlargement: true })
    .webp({ quality: qualidade })
    .toBuffer();

  await writeFile(destino, webp);
  const m = await sharp(webp).metadata();
  return { destino, dim: `${m.width}×${m.height}`, kb: webp.length / 1024 };
}

await mkdir("public", { recursive: true });

const saidas = [
  await logo("logo-colorida.webp", "public/logo-amauri.png", 720),
  await logo("logo-branca.webp", "public/logo-amauri-branca.png", 720),
  await logo("simbolo-colorido.webp", "public/simbolo-amauri.png", 400),
  await simbolo("simbolo-branco.webp", "public/simbolo-branco.png", 320),
  await icone("public/icone-192.png", 192),
  await icone("public/icone-512.png", 512),
  await icone("public/apple-icon.png", 180),
  await icone("src/app/icon.png", 64),
  await iconeMaskable("public/icone-maskable-512.png"),

  // Duas composições do banner: na larga o Amauri fica à direita e sobra
  // espaço escuro à esquerda para o título; na estreita ele fica no topo e
  // o texto desce. Recortar uma só estragaria o enquadramento.
  await foto("banner-largo.webp", "public/banner-largo.webp", 1920),
  await foto("banner-estreito.webp", "public/banner-estreito.webp", 1080),
  await foto("amauri-retrato.webp", "public/amauri-retrato.webp", 900, 86),
];

for (const s of saidas) {
  console.log(`${s.destino.padEnd(34)} ${s.dim.padEnd(11)} ${s.kb.toFixed(1)} KB`);
}

console.log("\nArquivos de marca gerados.");
