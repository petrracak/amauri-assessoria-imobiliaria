"use client";

import { Heart } from "lucide-react";

import { alternarFavorito, useFavoritos } from "@/lib/favoritos";
import { cn } from "@/lib/utils";

export function BotaoFavorito({
  refImovel,
  titulo,
  variante = "sobreposto",
  className,
}: {
  refImovel: string;
  titulo: string;
  /** "sobreposto" fica sobre a foto; "linha" acompanha texto. */
  variante?: "sobreposto" | "linha";
  className?: string;
}) {
  const favoritos = useFavoritos();
  const marcado = favoritos.includes(refImovel);

  function aoClicar(e: React.MouseEvent) {
    // O card inteiro é um link: sem isto, favoritar navegaria para o imóvel.
    e.preventDefault();
    e.stopPropagation();
    alternarFavorito(refImovel);
  }

  if (variante === "linha") {
    return (
      <button
        type="button"
        onClick={aoClicar}
        aria-pressed={marcado}
        className={cn(
          "flex items-center gap-2 rounded-full border px-5 py-3 text-sm transition-colors",
          marcado
            ? "border-accent text-accent"
            : "border-border-strong text-fg-muted hover:border-fg hover:text-fg",
          className,
        )}
      >
        <Heart
          className={cn("size-4", marcado && "fill-current")}
          strokeWidth={1.5}
        />
        {marcado ? "Salvo" : "Salvar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={marcado}
      aria-label={marcado ? `Remover ${titulo} dos salvos` : `Salvar ${titulo}`}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-bg/90 backdrop-blur-sm transition-colors hover:bg-bg",
        marcado ? "text-accent" : "text-fg-muted",
        className,
      )}
    >
      <Heart
        className={cn("size-[1.05rem]", marcado && "fill-current")}
        strokeWidth={1.6}
      />
    </button>
  );
}
