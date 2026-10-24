"use client";

import { ChevronDown, MessageCircle, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { mudarStatusLead, type StatusLead } from "@/app/actions/leads-admin";
import { Selo, dataHora } from "@/components/admin/ui";
import { cn, whatsappLink } from "@/lib/utils";

const OPCOES: { valor: StatusLead; rotulo: string; tom: "ambar" | "azul" | "verde" | "cinza" }[] = [
  { valor: "novo", rotulo: "Sem contato", tom: "ambar" },
  { valor: "em_contato", rotulo: "Em contato", tom: "azul" },
  { valor: "convertido", rotulo: "Virou cliente", tom: "verde" },
  { valor: "descartado", rotulo: "Descartado", tom: "cinza" },
];

export type Lead = {
  id: string;
  nome: string;
  whatsapp: string;
  origem: string | null;
  status: StatusLead;
  created_at: string;
};

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? (partes.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

/** 11987654321 → (11) 98765-4321 */
function formatarTelefone(bruto: string) {
  const d = bruto.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return bruto;
}

export function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const atual = OPCOES.find((o) => o.valor === lead.status) ?? OPCOES[0];

  const digitos = lead.whatsapp.replace(/\D/g, "");
  const ligar = `tel:${digitos.length <= 11 ? "+55" : "+"}${digitos}`;

  return (
    <li
      className={cn(
        "min-w-0 rounded-2xl border border-border-base bg-bg-elevated p-4 shadow-[var(--shadow-card)] transition-opacity",
        pendente && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/12 text-sm font-semibold text-accent"
        >
          {iniciais(lead.nome)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">{lead.nome}</p>
          <p className="numeros truncate text-sm text-fg-muted">
            {formatarTelefone(lead.whatsapp)}
          </p>
          <p className="mt-0.5 truncate text-xs text-fg-subtle">
            {lead.origem ?? "Site"} · <span className="numeros">{dataHora(lead.created_at)}</span>
          </p>
        </div>

        {/* O pill é só desenho; o <select> transparente por cima recebe o
            toque e abre o seletor nativo do aparelho, em 16px. */}
        <label className="relative shrink-0">
          <Selo tom={atual.tom} className="min-h-8 pl-3 pr-2">
            {atual.rotulo}
            <ChevronDown className="size-3.5" strokeWidth={2} />
          </Selo>
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
            className="absolute inset-0 size-full cursor-pointer opacity-0 text-base"
          >
            {OPCOES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={whatsappLink(
            lead.whatsapp,
            `Olá, ${lead.nome.split(" ")[0]}! Aqui é da Amauri Assessoria Imobiliária.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#1a9f52] px-5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-[#158a46] active:scale-[0.98]"
        >
          <MessageCircle className="size-5" strokeWidth={1.8} />
          Chamar no WhatsApp
        </a>
        <a
          href={ligar}
          aria-label={`Ligar para ${lead.nome}`}
          className="grid size-12 shrink-0 place-items-center rounded-full border border-border-strong text-fg transition-colors hover:border-accent hover:text-accent active:scale-95"
        >
          <Phone className="size-5" strokeWidth={1.7} />
        </a>
      </div>
    </li>
  );
}
