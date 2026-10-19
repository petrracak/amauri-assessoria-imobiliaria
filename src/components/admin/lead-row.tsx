"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { mudarStatusLead, type StatusLead } from "@/app/actions/leads-admin";
import { whatsappLink } from "@/lib/utils";

const OPCOES: { valor: StatusLead; rotulo: string }[] = [
  { valor: "novo", rotulo: "Sem contato" },
  { valor: "em_contato", rotulo: "Em contato" },
  { valor: "convertido", rotulo: "Virou cliente" },
  { valor: "descartado", rotulo: "Descartado" },
];

export type Lead = {
  id: string;
  nome: string;
  whatsapp: string;
  origem: string | null;
  status: StatusLead;
  created_at: string;
};

export function LeadRow({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();

  const quando = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lead.created_at));

  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem]">{lead.nome}</p>
        <p className="numeros truncate text-sm text-fg-muted">
          {lead.whatsapp}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-xs text-fg-subtle">{lead.origem ?? "—"}</p>
        <p className="numeros text-xs text-fg-subtle">{quando}</p>
      </div>

      <select
        value={lead.status}
        disabled={pendente}
        onChange={(e) =>
          startTransition(async () => {
            await mudarStatusLead(lead.id, e.target.value as StatusLead);
            router.refresh();
          })
        }
        aria-label={`Situação de ${lead.nome}`}
        className="rounded-full border border-border-base bg-transparent px-3 py-2 text-sm text-fg-muted focus:border-accent focus:outline-none"
      >
        {OPCOES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>

      <a
        href={whatsappLink(lead.whatsapp, `Olá, ${lead.nome.split(" ")[0]}! Aqui é da Amauri Assessoria Imobiliária.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
      >
        Chamar
      </a>
    </li>
  );
}
