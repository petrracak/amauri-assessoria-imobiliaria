/**
 * Gera os ícones do PWA a partir de SVG, sem depender de fonte instalada:
 * o "A" é desenhado com traços, não com texto.
 *
 *   node scripts/gerar-icones.mjs
 *
 * Provisório até a logo oficial chegar — troque os arquivos em public/
 * mantendo os mesmos nomes e nada mais precisa mudar.
 */
import { mkdir, writeFile } from "node:fs/promises";

import sharp from "sharp";

const NAVY = "#121F33";
const AZUL = "#1060A8";

/**
 * @param {number} escala fração do lado ocupada pelo monograma.
 *   Ícone maskable precisa de folga: o sistema recorta as bordas.
 */
function svg(escala) {
  const L = 512;
  const c = L / 2;
  const t = (L * escala) / 2; // meia-altura do monograma

  const topo = c - t;
  const base = c + t;
  const meiaLargura = t * 0.92;
  const traco = t * 0.34;
  const barraY = c + t * 0.42;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${L}" viewBox="0 0 ${L} ${L}">
  <rect width="${L}" height="${L}" fill="${NAVY}"/>
  <rect y="${L * 0.62}" width="${L}" height="${L * 0.38}" fill="${AZUL}" opacity="0.28"/>
  <line x1="0" y1="${L * 0.62}" x2="${L}" y2="${L * 0.62}" stroke="${AZUL}" stroke-width="${L * 0.012}"/>
  <g stroke="#ffffff" stroke-width="${traco}" stroke-linecap="round" fill="none">
    <line x1="${c}" y1="${topo}" x2="${c - meiaLargura}" y2="${base}"/>
    <line x1="${c}" y1="${topo}" x2="${c + meiaLargura}" y2="${base}"/>
    <line x1="${c - meiaLargura * 0.52}" y1="${barraY}" x2="${c + meiaLargura * 0.52}" y2="${barraY}"/>
  </g>
</svg>`;
}

const padrao = Buffer.from(svg(0.62));
const folgado = Buffer.from(svg(0.44)); // maskable: 80% de área segura

const saidas = [
  { arquivo: "public/icone-192.png", fonte: padrao, lado: 192 },
  { arquivo: "public/icone-512.png", fonte: padrao, lado: 512 },
  { arquivo: "public/icone-maskable-512.png", fonte: folgado, lado: 512 },
  { arquivo: "public/apple-icon.png", fonte: padrao, lado: 180 },
  { arquivo: "src/app/icon.png", fonte: padrao, lado: 64 },
];

await mkdir("public", { recursive: true });

for (const { arquivo, fonte, lado } of saidas) {
  const png = await sharp(fonte).resize(lado, lado).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(arquivo, png);
  console.log(`${arquivo.padEnd(32)} ${lado}×${lado}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log("\nÍcones gerados.");
