"use client";

import { registrarFotoPlaca, registrarFotos } from "@/app/actions/imoveis";
import { createClient } from "@/lib/supabase/client";

const LADO_GRANDE = 1600;
const LADO_PEQUENO = 640;

/**
 * Gera os dois tamanhos que o site serve, direto no aparelho.
 *
 * Uma foto de celular tem 4–12 MB; depois disso a grande fica em torno de
 * 200 KB e a pequena em 40 KB. Isso muda tudo no upload feito na rua, e
 * mantém o padrão das fotos importadas — o carregador de imagem conta com
 * os dois arquivos existirem.
 */
async function reduzir(bitmap: ImageBitmap, lado: number, qualidade: number) {
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", qualidade),
  );
}

async function preparar(arquivo: File) {
  if (!arquivo.type.startsWith("image/") || arquivo.type === "image/svg+xml") {
    return null;
  }

  try {
    const bitmap = await createImageBitmap(arquivo);
    const grande = await reduzir(bitmap, LADO_GRANDE, 0.82);
    const pequeno = await reduzir(bitmap, LADO_PEQUENO, 0.78);
    bitmap.close();

    if (!grande || !pequeno) return null;
    return { grande, pequeno };
  } catch {
    return null;
  }
}

/**
 * Foto da placa instalada — a comprovação de que alguém esteve lá.
 *
 * Vai nos dois tamanhos como as fotos de imóvel, mesmo sendo de uso
 * interno: tudo em imoveis/*.webp tem par, e o /midia conta com isso para
 * servir a miniatura.
 */
export async function enviarFotoPlaca({
  propertyId,
  refImovel,
  arquivo,
}: {
  propertyId: string;
  refImovel: string;
  arquivo: File;
}): Promise<{ erro?: string }> {
  const versoes = await preparar(arquivo);
  if (!versoes) return { erro: "Esse arquivo não é uma imagem que dê para processar." };

  const supabase = createClient();
  const base = `placas/${refImovel}/${Date.now()}`;
  const caminho = `${base}.webp`;

  const pequena = await supabase.storage
    .from("imoveis")
    .upload(`${base}-sm.webp`, versoes.pequeno, {
      contentType: "image/webp",
      upsert: false,
    });

  if (pequena.error) return { erro: `Falhou ao enviar: ${pequena.error.message}` };

  const grande = await supabase.storage
    .from("imoveis")
    .upload(caminho, versoes.grande, { contentType: "image/webp", upsert: false });

  if (grande.error) return { erro: `Falhou ao enviar: ${grande.error.message}` };

  const { data } = supabase.storage.from("imoveis").getPublicUrl(caminho);
  const resposta = await registrarFotoPlaca(propertyId, {
    url: data.publicUrl,
    path: caminho,
  });

  return resposta.ok ? {} : { erro: resposta.mensagem ?? "Erro ao salvar a foto." };
}

export type ResultadoEnvio = { enviadas: number; erro?: string };

/**
 * Reduz, sobe para o Storage e registra no banco as fotos de um imóvel.
 * Usada no gerenciador de fotos (imóvel já existente) e no cadastro inicial.
 *
 * Para na primeira falha e registra o que já subiu: foto enviada não se
 * perde por causa de uma que falhou depois.
 */
export async function enviarFotos({
  propertyId,
  refImovel,
  arquivos,
  aoProgresso,
}: {
  propertyId: string;
  /** Referência do imóvel (035). Vira a pasta no Storage. */
  refImovel: string;
  arquivos: File[];
  aoProgresso?: (feitas: number, total: number) => void;
}): Promise<ResultadoEnvio> {
  const supabase = createClient();
  const enviadas: { url: string; path: string }[] = [];
  let erro: string | undefined;

  aoProgresso?.(0, arquivos.length);

  for (const [i, arquivo] of arquivos.entries()) {
    const versoes = await preparar(arquivo);
    if (!versoes) {
      erro = `${arquivo.name} não é uma imagem que dê para processar.`;
      break;
    }

    const base = `${refImovel}/${Date.now()}-${i}`;
    const caminho = `${base}.webp`;

    // A pequena vai primeiro: se o par não ficar completo, nada é gravado
    // no banco e o site não aponta para um arquivo que não existe.
    const pequena = await supabase.storage
      .from("imoveis")
      .upload(`${base}-sm.webp`, versoes.pequeno, {
        contentType: "image/webp",
        upsert: false,
      });

    if (pequena.error) {
      erro = `Falhou ao enviar ${arquivo.name}: ${pequena.error.message}`;
      break;
    }

    const grande = await supabase.storage
      .from("imoveis")
      .upload(caminho, versoes.grande, {
        contentType: "image/webp",
        upsert: false,
      });

    if (grande.error) {
      erro = `Falhou ao enviar ${arquivo.name}: ${grande.error.message}`;
      break;
    }

    const { data } = supabase.storage.from("imoveis").getPublicUrl(caminho);
    enviadas.push({ url: data.publicUrl, path: caminho });
    aoProgresso?.(i + 1, arquivos.length);
  }

  if (enviadas.length) {
    const resposta = await registrarFotos(propertyId, enviadas);
    if (!resposta.ok) erro ??= resposta.mensagem ?? "Erro ao salvar as fotos.";
  }

  return { enviadas: enviadas.length, erro };
}
