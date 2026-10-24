"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/site/logo";
import { MegaMenu } from "@/components/site/mega-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Facetas } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/imoveis", label: "Imóveis", temMenu: true },
  { href: "/blog", label: "Blog" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header({
  whatsapp,
  facetas,
  sobreposto = false,
}: {
  whatsapp: string;
  facetas: Facetas;
  /** Em páginas com banner de tela cheia, o menu flutua por cima dele. */
  sobreposto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [mega, setMega] = useState(false);
  const [rolou, setRolou] = useState(false);
  const pathname = usePathname();
  const fechaMega = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  // Fecha com Esc: o painel cobre a página e precisa de saída pelo teclado.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMega(false);
        setAberto(false);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  /** Pequeno atraso ao sair: o cursor cruza um vão entre o item e o painel. */
  function agendarFechamento() {
    fechaMega.current = setTimeout(() => setMega(false), 180);
  }
  function cancelarFechamento() {
    if (fechaMega.current) clearTimeout(fechaMega.current);
  }

  const transparente = sobreposto && !rolou && !aberto && !mega;

  return (
    <>
      <header
      className={cn(
        sobreposto ? "fixed inset-x-0 top-0" : "sticky top-0",
        "z-50 transition-[background-color,border-color,box-shadow] duration-500",
        transparente
          ? "border-b border-white/10 bg-transparent"
          : "border-b border-border-base bg-bg/85 shadow-[0_1px_0_rgb(16_23_35_/_0.04),0_8px_28px_-18px_rgb(16_23_35_/_0.35)] backdrop-blur-2xl backdrop-saturate-150",
      )}
    >
      {/* Véu escuro no topo: sobre foto clara, o menu branco sumia. */}
      {transparente ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-brand-950/75 to-transparent"
        />
      ) : null}

      <div
        className={cn(
          "container-site flex items-center justify-between gap-6 transition-[height] duration-500",
          rolou ? "h-[4.25rem] lg:h-20" : "h-[4.75rem] lg:h-24",
        )}
      >
        <Logo branca={transparente} />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const ativo = pathname.startsWith(item.href);

            return (
              <div
                key={item.href}
                onMouseEnter={() => {
                  cancelarFechamento();
                  setMega(Boolean(item.temMenu));
                }}
                onMouseLeave={item.temMenu ? agendarFechamento : undefined}
              >
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  aria-expanded={item.temMenu ? mega : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                    transparente
                      ? "text-white/90 hover:bg-white/10 hover:text-white"
                      : ativo
                        ? "bg-bg-subtle text-fg"
                        : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                  )}
                >
                  {item.label}
                  {item.temMenu ? (
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-300",
                        mega && "rotate-180",
                      )}
                      strokeWidth={2}
                    />
                  ) : null}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle claro={transparente} />

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "hidden rounded-full px-5 py-2.5 text-sm font-medium transition-colors sm:inline-block",
              transparente
                ? "bg-white text-brand-950 hover:bg-white/90"
                : "bg-accent text-accent-fg hover:bg-accent-hover",
            )}
          >
            Falar com Amauri
          </a>

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className={cn(
              "grid size-10 place-items-center rounded-full border transition-colors md:hidden",
              transparente
                ? "border-white/40 text-white"
                : "border-border-base text-fg",
            )}
            aria-expanded={aberto}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          >
            {aberto ? (
              <X className="size-5" strokeWidth={1.5} />
            ) : (
              <Menu className="size-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------- painel de categorias */}
      <div
        onMouseEnter={cancelarFechamento}
        onMouseLeave={agendarFechamento}
        className={cn(
          "absolute inset-x-0 top-full hidden origin-top border-b border-border-base bg-bg shadow-[0_24px_48px_-24px_rgb(16_23_35_/_0.35)] backdrop-blur-2xl transition-all duration-300 md:block",
          mega
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        {mega ? <MegaMenu facetas={facetas} aoNavegar={() => setMega(false)} /> : null}
      </div>

    </header>

      {/* --------------------------------------------------- menu do celular */}
    {aberto && (
      <div className="fixed inset-x-0 top-[4.25rem] bottom-0 z-50 overflow-y-auto border-t border-border-base bg-bg md:hidden">
        <nav className="container-site flex flex-col pb-10 pt-2">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAberto(false)}
              style={{ animationDelay: `${i * 55}ms` }}
              className="menu-item border-b border-border-base py-5 font-display text-2xl"
            >
              {item.label}
            </Link>
          ))}

          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-fg-subtle">
            Buscar por tipo
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {facetas.tipos.map((t) => (
              <li key={t.nome}>
                <Link
                  href={`/imoveis?tipo=${encodeURIComponent(t.nome)}`}
                  onClick={() => setAberto(false)}
                  className="flex items-baseline justify-between gap-2 rounded-lg border border-border-base px-3 py-2.5 text-sm text-fg-muted"
                >
                  <span className="truncate">{t.nome}</span>
                  <span className="numeros text-xs text-fg-subtle">{t.total}</span>
                </Link>
              </li>
            ))}
          </ul>

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
            className="mt-8 rounded-full bg-accent px-6 py-4 text-center text-accent-fg"
          >
            Falar com Amauri
          </a>
        </nav>
      </div>
    )}
    </>
  );
}
