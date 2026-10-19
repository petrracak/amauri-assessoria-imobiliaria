"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { ImovelCard } from "@/lib/queries";
import { cn, formatArea, formatPreco } from "@/lib/utils";

function Especificacao({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="numeros text-sm text-fg">{valor}</span>
      <span className="text-[0.6875rem] text-fg-subtle">{rotulo}</span>
    </div>
  );
}

export function PropertyCard({
  imovel,
  prioridade = false,
  largo = false,
}: {
  imovel: ImovelCard;
  prioridade?: boolean;
  largo?: boolean;
}) {
  const [indice, setIndice] = useState(0);

  const fotos = imovel.imagens?.length ? imovel.imagens : [];
  const foto = fotos[indice] ?? fotos[0];
  const temSegunda = fotos.length > 1;

  const area = imovel.area_privativa ?? imovel.area_total;
  const specs = [
    imovel.dormitorios
      ? { valor: String(imovel.dormitorios), rotulo: imovel.dormitorios === 1 ? "quarto" : "quartos" }
      : null,
    imovel.suites ? { valor: String(imovel.suites), rotulo: imovel.suites === 1 ? "suíte" : "suítes" } : null,
    imovel.vagas ? { valor: String(imovel.vagas), rotulo: imovel.vagas === 1 ? "vaga" : "vagas" } : null,
    area ? { valor: formatArea(area)!, rotulo: imovel.area_privativa ? "privativos" : "de terreno" } : null,
  ].filter(Boolean) as { valor: string; rotulo: string }[];

  return (
    <Link
      href={`/imoveis/${imovel.slug}`}
      className="group block"
      onMouseEnter={() => temSegunda && setIndice(1)}
      onMouseLeave={() => setIndice(0)}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-bg-subtle",
          largo ? "aspect-[16/10]" : "aspect-[4/3]",
        )}
      >
        {foto ? (
          <Image
            src={foto.url}
            alt={foto.alt ?? imovel.titulo}
            fill
            priority={prioridade}
            sizes={largo ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-fg-subtle">
            Sem foto
          </div>
        )}

        {imovel.badge ? (
          <span className="absolute left-4 top-4 bg-bg px-3 py-1.5 text-[0.6875rem] text-fg">
            {imovel.badge}
          </span>
        ) : null}

        {/* Quantas fotos esperam no anúncio — informação, não enfeite. */}
        {fotos.length > 1 ? (
          <span className="numeros absolute bottom-4 right-4 bg-bg/90 px-2.5 py-1 text-[0.6875rem] text-fg-muted">
            {fotos.length} fotos
          </span>
        ) : null}
      </div>

      <div className="pt-5">
        <p className="font-display text-[1.75rem] leading-none tracking-[-0.015em] numeros">
          {formatPreco(imovel.preco)}
        </p>

        <h3 className="mt-3 text-pretty text-[0.9375rem] leading-snug text-fg transition-colors group-hover:text-accent">
          {imovel.titulo}
        </h3>

        <p className="mt-1 text-sm text-fg-muted">
          {imovel.bairro ? `${imovel.bairro}, ` : ""}
          {imovel.cidade}
        </p>

        {specs.length > 0 ? (
          <div className="mt-4 flex gap-6 border-t border-border-base pt-4">
            {specs.map((s) => (
              <Especificacao key={s.rotulo} valor={s.valor} rotulo={s.rotulo} />
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
