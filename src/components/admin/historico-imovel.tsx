import { History } from "lucide-react";

import { Cartao, Vazio, dataHora, rotuloPlaca, rotuloSituacao } from "@/components/admin/ui";

export type EventoImovel = {
  id: string;
  campo: string;
  de: string | null;
  para: string | null;
  nota: string | null;
  created_at: string;
  autor: { nome: string } | null;
};

const TITULO: Record<string, string> = {
  situacao: "Situação do negócio",
  placa: "Placa",
};

function rotulo(campo: string, valor: string | null) {
  if (!valor) return "—";
  return campo === "placa" ? rotuloPlaca(valor) : rotuloSituacao(valor);
}

/**
 * Quem mexeu no quê. As linhas vêm do gatilho no banco, não do painel:
 * ninguém escreve nem apaga nada aqui, então serve para resolver dúvida de
 * verdade ("essa placa foi instalada quando, e por quem?").
 */
export function HistoricoImovel({ eventos }: { eventos: EventoImovel[] }) {
  if (!eventos.length) {
    return (
      <Vazio
        icone={History}
        titulo="Nada registrado ainda"
        texto="Toda mudança de situação ou de placa entra aqui automaticamente, com data e autor."
      />
    );
  }

  return (
    <Cartao className="!p-2 sm:!p-3">
      <ol className="divide-y divide-border-base">
        {eventos.map((evento) => (
          <li key={evento.id} className="min-w-0 px-2 py-3">
            <p className="text-[0.9375rem] leading-snug">
              <span className="font-medium">{TITULO[evento.campo] ?? evento.campo}</span>
              {": "}
              <span className="text-fg-muted">{rotulo(evento.campo, evento.de)}</span>
              {" → "}
              <span className="font-medium">{rotulo(evento.campo, evento.para)}</span>
            </p>

            <p className="numeros mt-1 text-xs text-fg-muted">
              {dataHora(evento.created_at)}
              {evento.autor?.nome ? ` · ${evento.autor.nome}` : " · autor não registrado"}
            </p>

            {evento.nota ? (
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-fg-muted">
                {evento.nota}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </Cartao>
  );
}
