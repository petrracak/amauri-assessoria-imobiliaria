import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { sair } from "@/app/actions/auth";
import { exigirPerfil } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Amauri" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await exigirPerfil();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border-base bg-bg/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-5">
            <Logo href="/admin" className="scale-90 origin-left" />
            <Link
              href="/"
              target="_blank"
              className="hidden text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline sm:inline"
            >
              Ver o site
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-fg-muted sm:inline">
              {perfil.nome}
            </span>
            <ThemeToggle />
            <form action={sair}>
              <button
                type="submit"
                className="rounded-full border border-border-base px-4 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        <AdminNav role={perfil.role} />
        <main className="min-w-0 flex-1 px-5 pb-24 pt-8 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
