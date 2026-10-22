"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/imoveis", label: "Imóveis" },
  { href: "/blog", label: "Blog" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header({
  whatsapp,
  sobreposto = false,
}: {
  whatsapp: string;
  /** Em páginas com banner de tela cheia, o menu flutua por cima dele. */
  sobreposto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Trava o scroll do fundo enquanto o painel do celular está aberto.
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  // Sobre a foto, antes de rolar: sem fundo, tudo em branco.
  const transparente = sobreposto && !rolou && !aberto;

  return (
    <header
      className={cn(
        // Fixo só onde flutua sobre a foto; nas outras páginas fica sticky,
        // que mantém o fluxo e dispensa espaçador.
        sobreposto ? "fixed inset-x-0 top-0" : "sticky top-0",
        "z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
        transparente
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border-base bg-bg/70 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60",
      )}
    >
      <div
        className={cn(
          "container-site flex items-center justify-between gap-6 transition-[height] duration-500",
          rolou ? "h-[4.25rem] lg:h-20" : "h-[4.75rem] lg:h-24",
        )}
      >
        <Logo branca={transparente} />

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => {
            const ativo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "relative py-1 text-sm transition-colors",
                  transparente
                    ? "text-white/80 hover:text-white"
                    : ativo
                      ? "text-fg"
                      : "text-fg-muted hover:text-fg",
                  // Sublinhado que cresce do centro, só no item sob o cursor.
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100",
                  ativo && !transparente && "after:scale-x-100",
                )}
              >
                {item.label}
              </Link>
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
              "hidden rounded-full px-5 py-2.5 text-sm transition-colors sm:inline-block",
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

      {aberto && (
        <div className="fixed inset-x-0 top-[4.25rem] bottom-0 z-50 border-t border-border-base bg-bg md:hidden">
          <nav className="container-site flex flex-col pt-2">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="menu-item border-b border-border-base py-5 font-display text-2xl"
              >
                {item.label}
              </Link>
            ))}
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
    </header>
  );
}
