import { Download, Users } from "lucide-react";

import { LeadCard, type Lead } from "@/components/admin/lead-card";
import { Cabecalho, Filtros, Pagina, Vazio, botao } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Leads" };

const FILTROS = [
  { chave: "", rotulo: "Todos", href: "/admin/leads" },
  { chave: "novo", rotulo: "Sem contato", href: "/admin/leads?status=novo" },
  { chave: "em_contato", rotulo: "Em contato", href: "/admin/leads?status=em_contato" },
  { chave: "convertido", rotulo: "Viraram cliente", href: "/admin/leads?status=convertido" },
  { chave: "descartado", rotulo: "Descartados", href: "/admin/leads?status=descartado" },
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
  let q = supabase.from("leads").select("id, nome, whatsapp, origem, status, created_at");
  if (status) q = q.eq("status", status);

  const { data: leads } = await q.order("created_at", { ascending: false }).limit(500);
  const total = leads?.length ?? 0;

  return (
    <Pagina largura="max-w-4xl">
      <Cabecalho
        titulo="Leads"
        descricao={`${total} ${total === 1 ? "cadastro" : "cadastros"}${status ? " neste filtro" : ""}`}
        acoes={
          total ? (
            <a href="/admin/leads/exportar" className={botao.secundario}>
              <Download className="size-5" strokeWidth={1.6} />
              Baixar CSV
            </a>
          ) : null
        }
      />

      <Filtros atual={status} itens={FILTROS} />

      {total ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {leads!.map((lead) => (
            <LeadCard key={lead.id} lead={lead as Lead} />
          ))}
        </ul>
      ) : (
        <Vazio
          icone={Users}
          titulo={status ? "Ninguém nesta situação" : "Nenhum cadastro ainda"}
          texto={
            status
              ? "Escolha outro filtro para ver os demais contatos."
              : "Quem preencher o formulário do site aparece aqui, com o WhatsApp pronto para você chamar."
          }
        />
      )}
    </Pagina>
  );
}
