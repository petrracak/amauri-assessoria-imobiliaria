"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LeadForm } from "@/components/site/lead-form";
import type { ImovelCard } from "@/lib/queries";
import { formatPreco } from "@/lib/utils";

const CHAVE = "amauri:saida";

/**
 * Convite de última chance, quando a pessoa demonstra que vai embora.
 *
 * Regras que evitam que isso vire incômodo:
 * - uma vez por pessoa, lembrado no navegador;
 * - só depois de 15 segundos e alguma rolagem, senão aparece para quem nem
 *   chegou a ver o site;
 * - no desktop, pelo cursor subindo para fora da janela; no celular não
 *   existe esse gesto, então entra ao tocar em voltar, sem travar a saída.
 */
export function Saida({ imoveis }: { imoveis: ImovelCard[] }) {
  const [aberto, setAberto] = useState(false);
  const jaFoi = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE)) return;
    } catch {
      return; // sem armazenamento, não insiste
    }

    const inicio = Date.now();

    /** Vale a pena convidar? Só depois de tempo de leitura e alguma rolagem. */
    function momentoBom() {
      return Date.now() - inicio > 15000 && window.scrollY > 200;
    }

    function abrir() {
      if (jaFoi.current || !momentoBom()) return;
      jaFoi.current = true;
      try {
        localStorage.setItem(CHAVE, "1");
      } catch {
        /* segue sem lembrar */
      }
      setAberto(true);
    }

    const aoSair = (e: MouseEvent) => {
      // Só conta quando o cursor sobe para fora, em direção às abas.
      if (e.clientY <= 0) abrir();
    };

    function aoVoltar() {
      if (jaFoi.current) return;
      abrir();
      // Devolve o estado para não prender a pessoa no site.
      history.pushState(null, "", location.href);
    }

    document.addEventListener("mouseout", aoSair);
    window.addEventListener("popstate", aoVoltar);
    history.pushState(null, "", location.href);

    return () => {
      document.removeEventListener("mouseout", aoSair);
      window.removeEventListener("popstate", aoVoltar);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saida-titulo"
      className="fixed inset-0 z-[70] grid place-items-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => setAberto(false)}
        className="absolute inset-0 bg-brand-950/70 backdrop-blur-sm"
      />

      <div className="saida-painel relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto border border-border-base bg-bg shadow-2xl">
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-border-base bg-bg text-fg-muted transition-colors hover:text-fg"
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>

        <div className="px-6 pb-7 pt-10 sm:px-9">
          <Image
            src="/simbolo-amauri.png"
            alt=""
            width={400}
            height={310}
            className="h-11 w-auto dark:hidden"
          />
          <Image
            src="/simbolo-branco.png"
            alt=""
            width={448}
            height={320}
            className="hidden h-11 w-auto dark:block"
          />

          <h2
            id="saida-titulo"
            className="mt-6 max-w-[22ch] text-balance font-display text-display-sm"
          >
            Antes de sair, veja o que acabou de entrar
          </h2>
          <p className="mt-4 max-w-[52ch] text-pretty leading-relaxed text-fg-muted">
            Deixe seu WhatsApp e avisamos quando chegar um imóvel com o perfil
            que você procura. Sem disparo em massa.
          </p>

          <div className="mt-7">
            <LeadForm origem="saida" />
          </div>
        </div>

        {imoveis.length > 0 ? (
          <div className="border-t border-border-base pb-8 pt-7">
            <p className="px-6 text-xs uppercase tracking-[0.18em] text-fg-subtle sm:px-9">
              Em destaque agora
            </p>

            {/* Rolagem horizontal com encaixe: funciona no toque e no mouse,
                sem biblioteca de carrossel. */}
            <ul className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:px-9">
              {imoveis.map((imovel) => (
                <li key={imovel.id} className="w-52 shrink-0 snap-start">
                  <Link
                    href={`/imoveis/${imovel.slug}`}
                    onClick={() => setAberto(false)}
                    className="group block"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-bg-subtle">
                      {imovel.imagens?.[0] ? (
                        <Image
                          src={imovel.imagens[0].url}
                          alt=""
                          fill
                          sizes="208px"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <p className="numeros mt-3 font-display text-lg">
                      {formatPreco(imovel.preco)}
                    </p>
                    <p className="mt-1 truncate text-sm text-fg-muted">
                      {imovel.bairro ?? imovel.cidade}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
