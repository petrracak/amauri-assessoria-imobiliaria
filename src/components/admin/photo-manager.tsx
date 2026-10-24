"use client";

import { Camera, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { definirCapa, registrarFotos, removerFoto } from "@/app/actions/imoveis";
import { Cartao, botao } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type Foto = { id: string; url: string; capa: boolean; ordem: number };

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

export function PhotoManager({
  propertyId,
  refImovel,
  fotos,
}: {
  propertyId: string;
  /** Referência do imóvel (035). Vira a pasta no storage. */
  refImovel: string;
  fotos: Foto[];
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<{ feitas: number; total: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();
  const inputGaleria = useRef<HTMLInputElement>(null);
  const inputCamera = useRef<HTMLInputElement>(null);

  async function enviar(lista: FileList | null) {
    if (!lista?.length) return;
    setErro(null);

    const arquivos = Array.from(lista);
    setEnviando({ feitas: 0, total: arquivos.length });

    const supabase = createClient();
    const enviadas: { url: string; path: string }[] = [];

    for (const [i, arquivo] of arquivos.entries()) {
      const versoes = await preparar(arquivo);
      if (!versoes) {
        setErro(`${arquivo.name} não é uma imagem que dê para processar.`);
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
        setErro(`Falhou ao enviar ${arquivo.name}: ${pequena.error.message}`);
        break;
      }

      const { error } = await supabase.storage
        .from("imoveis")
        .upload(caminho, versoes.grande, {
          contentType: "image/webp",
          upsert: false,
        });

      if (error) {
        setErro(`Falhou ao enviar ${arquivo.name}: ${error.message}`);
        break;
      }

      const { data } = supabase.storage.from("imoveis").getPublicUrl(caminho);
      enviadas.push({ url: data.publicUrl, path: caminho });
      setEnviando({ feitas: i + 1, total: arquivos.length });
    }

    if (enviadas.length) {
      const resposta = await registrarFotos(propertyId, enviadas);
      if (!resposta.ok) setErro(resposta.mensagem ?? "Erro ao salvar as fotos.");
      router.refresh();
    }

    setEnviando(null);
    if (inputGaleria.current) inputGaleria.current.value = "";
    if (inputCamera.current) inputCamera.current.value = "";
  }

  return (
    <Cartao
      titulo={
        <>
          Fotos <span className="numeros text-base font-normal text-fg-muted">({fotos.length})</span>
        </>
      }
      descricao="A primeira foto é a capa do anúncio. Toque na estrela para trocar."
    >
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button
          type="button"
          onClick={() => inputCamera.current?.click()}
          disabled={Boolean(enviando)}
          className={cn(botao.primario, "sm:hidden")}
        >
          <Camera className="size-5" strokeWidth={1.7} />
          Tirar foto
        </button>

        <button
          type="button"
          onClick={() => inputGaleria.current?.click()}
          disabled={Boolean(enviando)}
          className={cn(botao.secundario, "max-sm:px-4")}
        >
          <ImagePlus className="size-5" strokeWidth={1.7} />
          <span className="sm:hidden">Galeria</span>
          <span className="hidden sm:inline">Adicionar fotos</span>
        </button>
      </div>

      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => enviar(e.target.files)}
      />
      <input
        ref={inputGaleria}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => enviar(e.target.files)}
      />

      {enviando ? (
        <div className="mt-4" role="status">
          <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${Math.max(8, (enviando.feitas / enviando.total) * 100)}%` }}
            />
          </div>
          <p className="numeros mt-2 text-sm text-fg-muted">
            Enviando {enviando.feitas} de {enviando.total}…
          </p>
        </div>
      ) : null}
      {erro ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          {erro}
        </p>
      ) : null}

      {fotos.length === 0 && !enviando ? (
        <p className="mt-5 rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-fg-muted">
          Sem fotos ainda. A primeira que entrar vira a capa do anúncio.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((foto) => (
            <li
              key={foto.id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-bg-subtle"
            >
              <Image
                src={foto.url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />

              {foto.capa ? (
                <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg">
                  Capa
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/65 to-transparent p-2 pt-8">
                {!foto.capa ? (
                  <button
                    type="button"
                    title="Usar como capa"
                    aria-label="Usar como capa"
                    disabled={pendente}
                    onClick={() =>
                      startTransition(async () => {
                        await definirCapa(foto.id, propertyId);
                        router.refresh();
                      })
                    }
                    className="grid size-11 place-items-center rounded-full bg-white/95 text-brand-950 transition-transform active:scale-90"
                  >
                    <Star className="size-[1.15rem]" strokeWidth={1.7} />
                  </button>
                ) : null}

                <button
                  type="button"
                  title="Remover foto"
                  aria-label="Remover foto"
                  disabled={pendente}
                  onClick={() => {
                    if (!confirm("Remover esta foto do imóvel?")) return;
                    startTransition(async () => {
                      await removerFoto(foto.id, propertyId);
                      router.refresh();
                    });
                  }}
                  className="grid size-11 place-items-center rounded-full bg-white/95 text-red-600 transition-transform active:scale-90"
                >
                  <Trash2 className="size-[1.15rem]" strokeWidth={1.7} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}
