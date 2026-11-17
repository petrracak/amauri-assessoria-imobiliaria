"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";

import { marcarPlacaInstalada } from "@/app/actions/imoveis";

/**
 * Um toque: placa instalada hoje, por quem está logado.
 *
 * Existe para o trabalho em lote. Quem volta da rua com dez placas no
 * portão não devia abrir dez cadastros, descer até o campo e salvar dez
 * vezes — a data e o responsável o servidor preenche sozinho.
 */
export function BotaoPlaca({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="min-w-0">
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            setErro(null);
            const resposta = await marcarPlacaInstalada(id);
            if (!resposta.ok) setErro("Não deu para marcar. Tente de novo.");
          })
        }
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border-strong bg-bg-elevated px-3.5 text-[0.8125rem] font-medium text-fg transition-colors hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-60"
      >
        <Check className="size-4 shrink-0" strokeWidth={2} />
        {pendente ? "Marcando…" : "Placa instalada"}
      </button>

      {erro ? (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
