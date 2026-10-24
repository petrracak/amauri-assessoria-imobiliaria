"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { Facetas } from "@/lib/queries";

function Coluna({
  titulo,
  itens,
  aoNavegar,
  capitalizar = false,
}: {
  titulo: string;
  itens: { href: string; rotulo: string; total: number }[];
  aoNavegar: () => void;
  /** Só para bairro, que vem em caixa baixa do banco. Nos demais, deixar
      o navegador capitalizar viraria "4 Ou Mais Quartos". */
  capitalizar?: boolean;
}) {
  if (!itens.length) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-fg-subtle">{titulo}</p>
      <ul className="mt-4 space-y-0.5">
        {itens.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={aoNavegar}
              className="group flex items-baseline justify-between gap-4 rounded-md px-2 py-2 text-[0.9375rem] text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              <span className={capitalizar ? "capitalize" : undefined}>{item.rotulo}</span>
              <span className="numeros text-xs text-fg-subtle">{item.total}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Painel de categorias do menu "Imóveis".
 *
 * Mostra a contagem em cada opção: saber que há 5 imóveis na Aparecida e 1
 * no Urumari muda para onde a pessoa clica — e evita o clique que leva a
 * uma lista vazia.
 */
export function MegaMenu({
  facetas,
  aoNavegar,
}: {
  facetas: Facetas;
  aoNavegar: () => void;
}) {
  const url = (chave: string, valor: string) =>
    `/imoveis?${chave}=${encodeURIComponent(valor)}`;

  return (
    <div className="container-site py-9">
      <div className="grid gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-4">
        <Coluna
          titulo="Por tipo"
          aoNavegar={aoNavegar}
          itens={facetas.tipos.map((t) => ({
            href: url("tipo", t.nome),
            rotulo: t.nome,
            total: t.total,
          }))}
        />

        <Coluna
          titulo="Por dormitórios"
          aoNavegar={aoNavegar}
          itens={facetas.dormitorios.map((d) => ({
            href: url("dormitorios", String(d.minimo)),
            rotulo: `${d.rotulo} ${d.minimo === 1 ? "quarto" : "quartos"}`,
            total: d.total,
          }))}
        />

        <Coluna
          titulo="Por valor"
          aoNavegar={aoNavegar}
          itens={facetas.faixas.map((f) => ({
            href: url("faixa", f.chave),
            rotulo: f.rotulo,
            total: f.total,
          }))}
        />

        <div>
          <Coluna
            titulo="Por bairro"
            aoNavegar={aoNavegar}
            capitalizar
            itens={facetas.bairros.slice(0, 7).map((b) => ({
              href: url("bairro", b.nome),
              rotulo: b.nome,
              total: b.total,
            }))}
          />
          {facetas.bairros.length > 7 ? (
            <Link
              href="/imoveis"
              onClick={aoNavegar}
              className="group mt-3 inline-flex items-center gap-2 px-2 text-sm text-accent"
            >
              Ver os {facetas.bairros.length} bairros
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border-base pt-6">
        <p className="text-sm text-fg-muted">
          <span className="numeros text-fg">{facetas.total}</span> imóveis
          publicados agora
        </p>
        <Link
          href="/imoveis"
          onClick={aoNavegar}
          className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Ver o catálogo completo
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </Link>
      </div>
    </div>
  );
}
