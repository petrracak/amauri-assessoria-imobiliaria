"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SpecsLinha, specsDe } from "@/components/site/specs";
import type { ImovelCard } from "@/lib/queries";
import { cn, formatPreco } from "@/lib/utils";

export function PropertyCard({
  imovel,
  prioridade = false,
  formato = "retrato",
}: {
  imovel: ImovelCard;
  prioridade?: boolean;
  /** "largo" ocupa mais colunas na grade e pede foto panorâmica. */
  formato?: "retrato" | "largo" | "alto";
}) {
  const [indice, setIndice] = useState(0);

  const fotos = imovel.imagens?.length ? imovel.imagens : [];
  const foto = fotos[indice] ?? fotos[0];
  const temSegunda = fotos.length > 1;
  const specs = specsDe(imovel);

  const proporcao =
    formato === "largo"
      ? "aspect-[16/10]"
      : formato === "alto"
        ? "aspect-[3/4]"
        : "aspect-[4/3]";

  return (
    <Link
      href={`/imoveis/${imovel.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-border-base bg-bg-elevated transition-colors duration-500 hover:border-border-strong"
      onMouseEnter={() => temSegunda && setIndice(1)}
      onMouseLeave={() => setIndice(0)}
    >
      <div className={cn("relative overflow-hidden bg-bg-subtle", proporcao)}>
        {foto ? (
          <Image
            src={foto.url}
            alt={foto.alt ?? imovel.titulo}
            fill
            priority={prioridade}
            sizes={
              formato === "largo"
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
            className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-fg-subtle">
            Sem foto
          </div>
        )}

        {/* Selo e contagem ficam sobre a foto, no padrão da referência. */}
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          {imovel.badge ? (
            <span className="bg-bg px-3 py-1.5 text-[0.6875rem] uppercase tracking-wider text-fg">
              {imovel.badge}
            </span>
          ) : imovel.alto_padrao ? (
            <span className="bg-bg/90 px-3 py-1.5 text-[0.6875rem] uppercase tracking-wider text-fg">
              Alto padrão
            </span>
          ) : (
            <span />
          )}

          {fotos.length > 1 ? (
            <span className="numeros bg-bg/90 px-2.5 py-1 text-[0.6875rem] text-fg-muted">
              {fotos.length} fotos
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="numeros font-display text-[1.6rem] leading-none text-fg">
            {formatPreco(imovel.preco)}
          </p>
          <ArrowUpRight
            className="mt-0.5 size-5 shrink-0 text-fg-subtle transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            strokeWidth={1.5}
          />
        </div>

        <h3 className="mt-3 text-pretty text-[0.9375rem] leading-snug text-fg">
          {imovel.titulo}
        </h3>

        <p className="mt-1 text-sm text-fg-muted">
          {imovel.bairro ? `${imovel.bairro}, ` : ""}
          {imovel.cidade}
        </p>

        {specs.length > 0 ? (
          <SpecsLinha
            specs={specs}
            limite={formato === "largo" ? 5 : 3}
            className="mt-auto border-t border-border-base pt-4 [margin-top:1.25rem]"
          />
        ) : null}
      </div>
    </Link>
  );
}
