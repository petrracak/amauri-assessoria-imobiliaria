"use client";

import { Camera, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Cartao, botao } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const LIMITE = 40;

type Item = { id: string; arquivo: File; url: string };

/**
 * Escolha de fotos no cadastro de um imóvel novo, antes de ele existir.
 *
 * Nada sobe daqui: o formulário guarda os arquivos e envia tudo junto com o
 * cadastro. A primeira da fila vira a capa; a estrela passa outra para a
 * frente.
 */
export function SeletorFotos({
  aoMudar,
  progresso,
  travado,
}: {
  aoMudar: (arquivos: File[]) => void;
  progresso: { feitas: number; total: number } | null;
  travado: boolean;
}) {
  const [itens, setItens] = useState<Item[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  // Libera as miniaturas da memória quando a tela fecha.
  useEffect(() => {
    const guardadas = urls;
    return () => guardadas.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function atualizar(proximos: Item[]) {
    setItens(proximos);
    aoMudar(proximos.map((i) => i.arquivo));
  }

  function adicionar(lista: FileList | null) {
    if (!lista?.length) return;
    setAviso(null);

    const imagens = Array.from(lista).filter((a) => a.type.startsWith("image/"));
    if (imagens.length < lista.length) {
      setAviso("Alguns arquivos não eram imagens e foram ignorados.");
    }

    const vagas = LIMITE - itens.length;
    if (imagens.length > vagas) {
      setAviso(`Cabem até ${LIMITE} fotos por cadastro. As demais podem entrar depois, na aba Fotos.`);
    }

    const novos = imagens.slice(0, Math.max(0, vagas)).map((arquivo) => {
      const url = URL.createObjectURL(arquivo);
      urls.current.push(url);
      return { id: `${arquivo.name}-${arquivo.size}-${crypto.randomUUID()}`, arquivo, url };
    });

    atualizar([...itens, ...novos]);
    if (galeria.current) galeria.current.value = "";
    if (camera.current) camera.current.value = "";
  }

  function remover(id: string) {
    atualizar(itens.filter((i) => i.id !== id));
  }

  function tornarCapa(id: string) {
    const escolhida = itens.find((i) => i.id === id);
    if (!escolhida) return;
    atualizar([escolhida, ...itens.filter((i) => i.id !== id)]);
  }

  return (
    <Cartao
      titulo={
        <>
          Fotos{" "}
          <span className="numeros text-base font-normal text-fg-muted">({itens.length})</span>
        </>
      }
      descricao="Escolha as fotos agora e elas sobem junto com o cadastro. A primeira é a capa do anúncio."
    >
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button
          type="button"
          onClick={() => camera.current?.click()}
          disabled={travado}
          className={cn(botao.primario, "sm:hidden")}
        >
          <Camera className="size-5" strokeWidth={1.7} />
          Tirar foto
        </button>
        <button
          type="button"
          onClick={() => galeria.current?.click()}
          disabled={travado}
          className={cn(botao.secundario, "max-sm:px-4")}
        >
          <ImagePlus className="size-5" strokeWidth={1.7} />
          <span className="sm:hidden">Galeria</span>
          <span className="hidden sm:inline">Escolher fotos</span>
        </button>
      </div>

      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => adicionar(e.target.files)}
      />
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => adicionar(e.target.files)}
      />

      {aviso ? (
        <p role="status" className="mt-3 text-sm text-fg-muted">
          {aviso}
        </p>
      ) : null}

      {progresso ? (
        <div className="mt-4" role="status">
          <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${Math.max(8, (progresso.feitas / progresso.total) * 100)}%` }}
            />
          </div>
          <p className="numeros mt-2 text-sm text-fg-muted">
            Enviando fotos: {progresso.feitas} de {progresso.total}
          </p>
        </div>
      ) : null}

      {itens.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {itens.map((item, i) => (
            <li
              key={item.id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-bg-subtle"
            >
              {/* Miniatura local (blob:), fora do carregador de imagens do site. */}
              <Image src={item.url} alt="" fill unoptimized sizes="25vw" className="object-cover" />

              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg">
                  Capa
                </span>
              ) : null}

              {!travado ? (
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/65 to-transparent p-2 pt-8">
                  {i !== 0 ? (
                    <button
                      type="button"
                      onClick={() => tornarCapa(item.id)}
                      aria-label="Usar como capa"
                      title="Usar como capa"
                      className="grid size-11 place-items-center rounded-full bg-white/95 text-brand-950 transition-transform active:scale-90"
                    >
                      <Star className="size-[1.15rem]" strokeWidth={1.7} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remover(item.id)}
                    aria-label="Remover foto"
                    title="Remover foto"
                    className="grid size-11 place-items-center rounded-full bg-white/95 text-red-600 transition-transform active:scale-90"
                  >
                    <Trash2 className="size-[1.15rem]" strokeWidth={1.7} />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-fg-muted">
          Nenhuma foto escolhida ainda. Dá para cadastrar sem foto e adicionar depois.
        </p>
      )}
    </Cartao>
  );
}
