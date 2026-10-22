"use client";

/**
 * Carregador de imagem do next/image.
 *
 * O otimizador da Vercel tem cota no plano free e passou a responder 402
 * com as 396 fotos da importação — as imagens simplesmente sumiam. As fotos
 * já são guardadas prontas no Storage, em dois tamanhos, então aqui é só
 * escolher qual servir.
 *
 *   foto.webp      até 1600px  — ficha e galeria
 *   foto-sm.webp   até 640px   — cards e listagens
 */
export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}) {
  // Arquivos locais (logo, ícones) já vêm no tamanho certo.
  if (!src.includes("/storage/v1/object/public/")) return src;
  if (!src.endsWith(".webp")) return src;
  if (src.endsWith("-sm.webp")) return src;

  return width <= 768 ? src.replace(/\.webp$/, "-sm.webp") : src;
}
