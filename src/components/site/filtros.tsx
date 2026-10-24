"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Facetas } from "@/lib/queries";
import { cn } from "@/lib/utils";

export type FiltrosAtivos = {
  tipo?: string;
  bairro?: string;
  dormitorios?: string;
  faixa?: string;
  busca?: string;
  ordenacao?: string;
};

/** Monta o endereço alternando um valor: clicar no ativo desliga o filtro. */
function montarUrl(atuais: FiltrosAtivos, chave: keyof FiltrosAtivos, valor?: string) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(atuais)) {
    if (v && k !== chave) p.set(k, v);
  }
  if (valor && atuais[chave] !== valor) p.set(chave, valor);
  const q = p.toString();
  return q ? `/imoveis?${q}` : "/imoveis";
}

function Grupo({
  titulo,
  chave,
  itens,
  atuais,
  capitalizar = false,
}: {
  titulo: string;
  chave: keyof FiltrosAtivos;
  itens: { valor: string; rotulo: string; total: number }[];
  atuais: FiltrosAtivos;
  /** Só o bairro vem em caixa baixa do banco; nos outros isso estragaria
      o rótulo, virando "4 Ou Mais Quartos". */
  capitalizar?: boolean;
}) {
  if (!itens.length) return null;

  return (
    <div className="border-t border-border-base py-5 first:border-t-0 first:pt-0">
      <p className="text-xs uppercase tracking-[0.18em] text-fg-subtle">{titulo}</p>
      <ul className="mt-3 space-y-0.5">
        {itens.map((item) => {
          const ativo = atuais[chave] === item.valor;
          return (
            <li key={item.valor}>
              <Link
                href={montarUrl(atuais, chave, item.valor)}
                scroll={false}
                aria-current={ativo ? "true" : undefined}
                className={cn(
                  "flex items-baseline justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                  ativo
                    ? "bg-accent text-accent-fg"
                    : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                )}
              >
                <span className={capitalizar ? "capitalize" : undefined}>
                  {item.rotulo}
                </span>
                <span
                  className={cn(
                    "numeros text-xs",
                    ativo ? "text-accent-fg/70" : "text-fg-subtle",
                  )}
                >
                  {item.total}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Painel({ facetas, atuais }: { facetas: Facetas; atuais: FiltrosAtivos }) {
  return (
    <>
      <Grupo
        titulo="Tipo"
        chave="tipo"
        atuais={atuais}
        itens={facetas.tipos.map((t) => ({
          valor: t.nome,
          rotulo: t.nome,
          total: t.total,
        }))}
      />
      <Grupo
        titulo="Dormitórios"
        chave="dormitorios"
        atuais={atuais}
        itens={facetas.dormitorios.map((d) => ({
          valor: String(d.minimo),
          rotulo: `${d.rotulo} ${d.minimo === 1 ? "quarto" : "quartos"}`,
          total: d.total,
        }))}
      />
      <Grupo
        titulo="Valor"
        chave="faixa"
        atuais={atuais}
        itens={facetas.faixas.map((f) => ({
          valor: f.chave,
          rotulo: f.rotulo,
          total: f.total,
        }))}
      />
      <Grupo
        titulo="Bairro"
        chave="bairro"
        atuais={atuais}
        capitalizar
        itens={facetas.bairros.map((b) => ({
          valor: b.nome,
          rotulo: b.nome,
          total: b.total,
        }))}
      />
    </>
  );
}

export function Filtros({
  facetas,
  atuais,
  resultados,
}: {
  facetas: Facetas;
  atuais: FiltrosAtivos;
  resultados: number;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* Celular: a gaveta sobe por cima, com a contagem sempre à vista. */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm lg:hidden"
      >
        <SlidersHorizontal className="size-4" strokeWidth={1.5} />
        Filtrar
      </button>

      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <div className="border border-border-base bg-bg-elevated p-5">
            <Painel facetas={facetas} atuais={atuais} />
          </div>
        </div>
      </aside>

      {aberto ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border-base bg-bg">
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-border-base bg-bg px-5 py-4">
              <p className="font-display text-xl">Filtrar</p>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar filtros"
                className="grid size-9 place-items-center rounded-full border border-border-base"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-5 pb-6 pt-2">
              <Painel facetas={facetas} atuais={atuais} />
            </div>

            <div className="sticky bottom-0 border-t border-border-base bg-bg px-5 py-4">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="w-full rounded-full bg-accent px-6 py-3.5 text-sm text-accent-fg"
              >
                Ver {resultados} {resultados === 1 ? "imóvel" : "imóveis"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Chips do que está aplicado, cada um removível. */
export function FiltrosAplicados({
  atuais,
  rotulos,
}: {
  atuais: FiltrosAtivos;
  rotulos: Partial<Record<keyof FiltrosAtivos, string>>;
}) {
  const ativos = (Object.keys(rotulos) as (keyof FiltrosAtivos)[]).filter(
    (k) => atuais[k],
  );

  if (!ativos.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ativos.map((chave) => (
        <Link
          key={chave}
          href={montarUrl(atuais, chave)}
          scroll={false}
          className="group flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm transition-colors hover:border-fg"
        >
          <span className={chave === "bairro" ? "capitalize" : undefined}>
            {rotulos[chave]}
          </span>
          <X
            className="size-3.5 text-fg-subtle transition-colors group-hover:text-fg"
            strokeWidth={2}
          />
        </Link>
      ))}

      <Link
        href="/imoveis"
        scroll={false}
        className="px-2 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
      >
        Limpar tudo
      </Link>
    </div>
  );
}
