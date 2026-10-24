"use client";

import {
  Building2,
  LayoutDashboard,
  type LucideIcon,
  Newspaper,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icone: LucideIcon; somenteAdmin?: boolean };

const ITENS: Item[] = [
  { href: "/admin", label: "Painel", icone: LayoutDashboard },
  { href: "/admin/imoveis", label: "Imóveis", icone: Building2 },
  { href: "/admin/posts", label: "Blog", icone: Newspaper },
  { href: "/admin/leads", label: "Leads", icone: Users },
  { href: "/admin/configuracoes", label: "Configurações", icone: Settings, somenteAdmin: true },
  { href: "/admin/conta", label: "Conta", icone: UserCircle },
];

export function AdminNav({ role }: { role: "admin" | "corretor" }) {
  const pathname = usePathname();
  const itens = ITENS.filter((i) => !i.somenteAdmin || role === "admin");

  const ativo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop: coluna lateral */}
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border-base p-4 lg:flex">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo(item.href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              ativo(item.href)
                ? "bg-bg-subtle text-fg"
                : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
            )}
          >
            <item.icone className="size-[1.15rem]" strokeWidth={1.5} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Celular: barra fixa embaixo, no alcance do polegar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-flow-col border-t border-border-base bg-bg/95 backdrop-blur-md lg:hidden">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo(item.href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] transition-colors",
              ativo(item.href) ? "text-accent" : "text-fg-muted",
            )}
          >
            <item.icone className="size-5" strokeWidth={1.5} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
