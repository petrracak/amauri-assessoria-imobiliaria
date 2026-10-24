"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Abas para dividir uma tela longa em partes. Todos os painéis ficam
 * montados e só o inativo é escondido: o formulário não perde o que já foi
 * digitado quando a pessoa vai conferir as fotos e volta.
 */
export function Abas({
  abas,
  inicial,
}: {
  abas: { id: string; rotulo: string; contagem?: number; conteudo: React.ReactNode }[];
  inicial?: string;
}) {
  const [ativa, setAtiva] = useState(inicial ?? abas[0].id);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-bg-elevated p-1 shadow-[var(--shadow-card)] ring-1 ring-border-base"
      >
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={ativa === a.id}
            aria-controls={`painel-${a.id}`}
            onClick={() => setAtiva(a.id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[0.9375rem] transition-colors",
              ativa === a.id
                ? "bg-accent font-medium text-accent-fg"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {a.rotulo}
            {a.contagem !== undefined ? (
              <span className="numeros text-xs opacity-80">{a.contagem}</span>
            ) : null}
          </button>
        ))}
      </div>

      {abas.map((a) => (
        <div
          key={a.id}
          role="tabpanel"
          id={`painel-${a.id}`}
          aria-labelledby={`aba-${a.id}`}
          hidden={ativa !== a.id}
        >
          {a.conteudo}
        </div>
      ))}
    </div>
  );
}
