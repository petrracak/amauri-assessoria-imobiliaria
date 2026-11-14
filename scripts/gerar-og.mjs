/**
 * Gera a imagem de compartilhamento do site (1200×630), a que aparece quando
 * o link vai para WhatsApp, Instagram, LinkedIn ou resultado de busca.
 *
 *   node scripts/gerar-og.mjs
 *
 * Parte do banner largo — o corretor fica à direita e a esquerda é escura,
 * então o logo cabe ali sem cobrir o rosto — e põe o logo branco por cima.
 */
import sharp from "sharp";

const L = 1200;
const A = 630;

const banner = await sharp("public/banner-largo.webp")
  // "right" ancora o corte no lado do rosto.
  .resize(L, A, { fit: "cover", position: "right" })
  .toBuffer();

const logo = await sharp("public/logo-amauri-branca.png")
  .resize({ width: 330 })
  .toBuffer();

const saida = await sharp(banner)
  .composite([{ input: logo, left: 72, top: 72 }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toBuffer();

await sharp(saida).toFile("public/og.jpg");
console.log(`public/og.jpg  ${L}×${A}  ${(saida.length / 1024).toFixed(0)} KB`);
