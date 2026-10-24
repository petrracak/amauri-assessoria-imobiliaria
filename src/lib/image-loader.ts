"use client";

import { urlDaMidia } from "@/lib/midia";

/**
 * Carregador de imagem do next/image.
 *
 * O otimizador da Vercel tem cota no plano free e passou a responder 402
 * com as 396 fotos da importação — as imagens simplesmente sumiam. As fotos
 * já são guardadas prontas no Storage, em dois tamanhos, então aqui é só
 * escolher qual servir:
 *
 *   foto.webp      até 1600px  — ficha e galeria
 *   foto-sm.webp   até 640px   — cards e listagens
 *
 * e passar pelo /midia, que dá cache longo (ver lib/midia.ts).
 */
export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}) {
  // Arquivos locais (logo, ícones) já vêm no tamanho certo.
  return urlDaMidia(src, { pequena: width <= 768 });
}
