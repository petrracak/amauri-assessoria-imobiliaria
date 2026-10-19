import { Plus } from "lucide-react";
import Link from "next/link";

import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Numero({
  rotulo,
  valor,
  href,
}: {
  rotulo: string;
  valor: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-border-base p-5 transition-colors hover:border-border-strong"
    >
      <p className="numeros font-display text-display-sm leading-none">{valor}</p>
      <p className="mt-2 text-sm text-fg-muted">{rotulo}</p>
    </Link>
  );
}

export default async function Painel() {
  const perfil = await exigirPerfil();
  const supabase = await createClient();

  const [publicados, rascunhos, leadsNovos, ultimosLeads] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "publicado"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "rascunho"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "novo"),
    supabase
      .from("leads")
      .select("id, nome, whatsapp, origem, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const primeiroNome = perfil.nome.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm">Olá, {primeiroNome}</h1>
          <p className="mt-2 text-fg-muted">
            Tudo que está no ar, e o que acabou de chegar.
          </p>
        </div>

        <Link
          href="/admin/imoveis/novo"
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" strokeWidth={2} />
          Cadastrar imóvel
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Numero
          rotulo="imóveis publicados"
          valor={publicados.count ?? 0}
          href="/admin/imoveis?status=publicado"
        />
        <Numero
          rotulo="em rascunho"
          valor={rascunhos.count ?? 0}
          href="/admin/imoveis?status=rascunho"
        />
        <Numero
          rotulo="leads sem contato"
          valor={leadsNovos.count ?? 0}
          href="/admin/leads?status=novo"
        />
      </div>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Últimos cadastros</h2>
          <Link
            href="/admin/leads"
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {ultimosLeads.data?.length ? (
          <ul className="mt-5 divide-y divide-border-base border-y border-border-base">
            {ultimosLeads.data.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
              >
                <div>
                  <p className="text-[0.9375rem]">{lead.nome}</p>
                  <p className="numeros text-sm text-fg-muted">{lead.whatsapp}</p>
                </div>
                <p className="text-xs text-fg-subtle">{lead.origem}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-fg-muted">
            Ninguém se cadastrou ainda. Os contatos do formulário aparecem aqui.
          </p>
        )}
      </section>
    </div>
  );
}
