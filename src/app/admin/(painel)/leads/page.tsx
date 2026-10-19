import { Download } from "lucide-react";
import Link from "next/link";

import { LeadRow, type Lead } from "@/components/admin/lead-row";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Leads" };

const FILTROS = [
  { chave: "", rotulo: "Todos" },
  { chave: "novo", rotulo: "Sem contato" },
  { chave: "em_contato", rotulo: "Em contato" },
  { chave: "convertido", rotulo: "Viraram cliente" },
];

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function Leads({ searchParams }: { searchParams: Params }) {
  await exigirPerfil();
  const params = await searchParams;

  // searchParams é string livre; o enum do banco só aceita estes valores.
  const VALIDOS = ["novo", "em_contato", "convertido", "descartado"] as const;
  const bruto = typeof params.status === "string" ? params.status : "";
  const status = (VALIDOS as readonly string[]).includes(bruto)
    ? (bruto as (typeof VALIDOS)[number])
    : "";

  const supabase = await createClient();
  let q = supabase
    .from("leads")
    .select("id, nome, whatsapp, origem, status, created_at");

  if (status) q = q.eq("status", status);

  const { data: leads } = await q.order("created_at", { ascending: false }).limit(500);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm">Leads</h1>
          <p className="numeros mt-2 text-fg-muted">
            {leads?.length ?? 0} {leads?.length === 1 ? "cadastro" : "cadastros"}
          </p>
        </div>

        {leads?.length ? (
          <a
            href="/admin/leads/exportar"
            className="flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            <Download className="size-4" strokeWidth={1.5} />
            Baixar CSV
          </a>
        ) : null}
      </div>

      <div className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {FILTROS.map((f) => (
          <Link
            key={f.chave}
            href={f.chave ? `/admin/leads?status=${f.chave}` : "/admin/leads"}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
              status === f.chave
                ? "border-accent bg-accent text-accent-fg"
                : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {f.rotulo}
          </Link>
        ))}
      </div>

      {leads?.length ? (
        <ul className="mt-8 divide-y divide-border-base border-y border-border-base">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead as Lead} />
          ))}
        </ul>
      ) : (
        <div className="mt-12 border-t border-border-base pt-10">
          <p className="font-display text-2xl">Nenhum cadastro ainda.</p>
          <p className="mt-3 max-w-[50ch] text-pretty leading-relaxed text-fg-muted">
            Quem preencher o formulário de novidades no site aparece aqui, com o
            WhatsApp pronto para você chamar.
          </p>
        </div>
      )}
    </div>
  );
}
