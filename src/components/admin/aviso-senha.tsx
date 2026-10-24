"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Faixa fixa no topo do painel para quem ainda não definiu senha. Some na
 * própria tela de conta, onde o formulário já está na frente da pessoa.
 */
export function AvisoSenha() {
  const caminho = usePathname();
  if (caminho === "/admin/conta") return null;

  return (
    <div className="border-b border-border-base bg-accent/10">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
        <KeyRound className="size-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
        <span>Crie a sua própria senha de acesso e entre direto, sem depender de link.</span>
        <Link
          href="/admin/conta"
          className="font-medium text-accent underline underline-offset-4"
        >
          Criar senha
        </Link>
      </p>
    </div>
  );
}
