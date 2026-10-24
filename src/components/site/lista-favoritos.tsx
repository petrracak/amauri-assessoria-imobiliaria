"use client";

import { Check, Link2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PropertyCard } from "@/components/site/property-card";
import { limparFavoritos, useFavoritos } from "@/lib/favoritos";
import type { ImovelCard } from "@/lib/queries";
import { whatsappLink } from "@/lib/utils";

export function ListaFavoritos({
  catalogo,
  whatsappNumero,
  siteUrl,
  refsCompartilhadas,
}: {
  /** Todos os publicados: a filtragem é no cliente, pela lista do aparelho. */
  catalogo: ImovelCard[];
  whatsappNumero: string;
  siteUrl: string;
  /** Vem do endereço, lido no servidor — evita depender de useSearchParams
      dentro de Suspense, que duplicava a lista na hidratação. */
  refsCompartilhadas: string[];
}) {
  const salvos = useFavoritos();
  const [copiado, setCopiado] = useState(false);

  const compartilhado = refsCompartilhadas.length > 0;
  const refs = compartilhado ? refsCompartilhadas : salvos;

  const imoveis = refs
    .map((ref) => catalogo.find((i) => i.ref === ref))
    .filter((i): i is ImovelCard => Boolean(i));

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2500);
    return () => clearTimeout(t);
  }, [copiado]);

  if (imoveis.length === 0) {
    return (
      <div className="border-t border-border-base pt-10">
        <p className="font-display text-2xl">
          {compartilhado
            ? "Esses imóveis não estão mais disponíveis."
            : "Você ainda não salvou nenhum imóvel."}
        </p>
        <p className="mt-3 max-w-[52ch] text-pretty leading-relaxed text-fg-muted">
          Toque no coração sobre a foto para guardar um imóvel aqui. A lista
          fica neste aparelho e serve para mandar tudo de uma vez ao Amauri.
        </p>
        <Link
          href="/imoveis"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm text-accent-fg"
        >
          Ver os imóveis
        </Link>
      </div>
    );
  }

  const listaTexto = imoveis
    .map((i) => `• ${i.titulo} (ref. ${i.ref})\n  ${siteUrl}/imoveis/${i.slug}`)
    .join("\n");

  const mensagem =
    imoveis.length === 1
      ? `Olá, Amauri! Tenho interesse neste imóvel:\n\n${listaTexto}`
      : `Olá, Amauri! Separei ${imoveis.length} imóveis e queria falar sobre eles:\n\n${listaTexto}`;

  const linkCompartilhavel = `${siteUrl}/favoritos?refs=${imoveis.map((i) => i.ref).join(",")}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkCompartilhavel);
      setCopiado(true);
    } catch {
      // Sem permissão de área de transferência: mostra o endereço na barra.
      window.prompt("Copie o link:", linkCompartilhavel);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-y border-border-base py-5">
        <a
          href={whatsappLink(whatsappNumero, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-accent px-6 py-3 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Mandar {imoveis.length === 1 ? "este imóvel" : "a lista"} no WhatsApp
        </a>

        <button
          type="button"
          onClick={copiar}
          className="flex items-center gap-2 rounded-full border border-border-strong px-5 py-3 text-sm transition-colors hover:border-fg"
        >
          {copiado ? (
            <Check className="size-4 text-accent" strokeWidth={2} />
          ) : (
            <Link2 className="size-4" strokeWidth={1.5} />
          )}
          {copiado ? "Link copiado" : "Copiar link da lista"}
        </button>

        {!compartilhado ? (
          <button
            type="button"
            onClick={limparFavoritos}
            className="ml-auto flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
            Limpar
          </button>
        ) : null}
      </div>

      {compartilhado ? (
        <p className="mt-5 text-sm text-fg-muted">
          Esta é uma lista compartilhada. Toque no coração para guardar os
          imóveis também neste aparelho.
        </p>
      ) : null}

      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {imoveis.map((imovel, i) => (
          <PropertyCard key={imovel.id} imovel={imovel} prioridade={i < 3} />
        ))}
      </div>
    </div>
  );
}
