"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// O blog entra aqui junto com o painel, na próxima etapa.
const NAV = [
  { href: "/imoveis", label: "Imóveis" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header({ whatsapp }: { whatsapp: string }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  // Trava o scroll do fundo enquanto o painel do celular está aberto.
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <header className="sticky top-0 z-50 border-b border-border-base bg-bg/85 backdrop-blur-md">
      <div className="container-site flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const ativo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "text-sm transition-colors",
                  ativo ? "text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-accent px-5 py-2.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover sm:inline-block"
          >
            Falar com Amauri
          </a>

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="grid size-10 place-items-center rounded-full border border-border-base text-fg md:hidden"
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
        <div className="fixed inset-x-0 top-[4.5rem] bottom-0 z-50 border-t border-border-base bg-bg md:hidden">
          <nav className="container-site flex flex-col pt-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                // Fecha ao navegar: o painel não pode sobrar sobre a página nova.
                onClick={() => setAberto(false)}
                className="border-b border-border-base py-5 font-display text-2xl"
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
