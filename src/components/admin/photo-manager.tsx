"use client";

import { Camera, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { definirCapa, removerFoto } from "@/app/actions/imoveis";
import { Cartao, botao } from "@/components/admin/ui";
import { enviarFotos } from "@/lib/enviar-fotos";
import { cn } from "@/lib/utils";

export type Foto = { id: string; url: string; capa: boolean; ordem: number };

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

    const resultado = await enviarFotos({
      propertyId,
      refImovel,
      arquivos: Array.from(lista),
      aoProgresso: (feitas, total) => setEnviando({ feitas, total }),
    });

    if (resultado.erro) setErro(resultado.erro);
    if (resultado.enviadas) router.refresh();

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
