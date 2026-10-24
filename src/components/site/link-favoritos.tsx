"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { useFavoritos } from "@/lib/favoritos";
import { cn } from "@/lib/utils";

/**
 * Atalho para a lista salva. Só aparece depois do primeiro imóvel: um
 * contador zerado no menu não ajuda ninguém e ocupa espaço.
 */
export function LinkFavoritos({ claro = false }: { claro?: boolean }) {
  const favoritos = useFavoritos();
  if (favoritos.length === 0) return null;

  return (
    <Link
      href="/favoritos"
      aria-label={`${favoritos.length} imóveis salvos`}
      className={cn(
        "relative grid size-10 place-items-center rounded-full border transition-colors",
        claro
          ? "border-white/40 text-white hover:bg-white/10"
          : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg",
      )}
    >
      <Heart className="size-[1.05rem] fill-current" strokeWidth={1.5} />
      <span
        className={cn(
          "numeros absolute -right-1 -top-1 grid size-[1.1rem] place-items-center rounded-full text-[0.625rem]",
          claro ? "bg-white text-brand-950" : "bg-accent text-accent-fg",
        )}
      >
        {favoritos.length}
      </span>
    </Link>
  );
}
