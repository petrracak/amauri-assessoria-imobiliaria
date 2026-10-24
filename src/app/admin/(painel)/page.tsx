import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  ExternalLink,
  PenLine,
  Plus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LeadCard, type Lead } from "@/components/admin/lead-card";
import { Cabecalho, Cartao, Pagina, SeloSituacao } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPreco } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Início" };

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
      className="group min-w-0 rounded-2xl border border-border-base bg-bg-elevated p-4 shadow-[var(--shadow-card)] transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="numeros font-display text-4xl leading-none">{valor}</p>
        <ArrowUpRight
          className="size-5 text-fg-subtle transition-colors group-hover:text-accent"
          strokeWidth={1.5}
        />
      </div>
      <p className="mt-3 text-sm text-fg-muted">{rotulo}</p>
    </Link>
  );
}

function Atalho({
  href,
  icone: Icone,
  rotulo,
  externo,
}: {
  href: string;
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  rotulo: string;
  externo?: boolean;
}) {
  return (
    <Link
      href={href}
      target={externo ? "_blank" : undefined}
      className="flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border border-border-base bg-bg-elevated px-4 transition-colors hover:border-accent active:scale-[0.98]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
        <Icone className="size-[1.15rem]" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 truncate text-sm font-medium">{rotulo}</span>
    </Link>
  );
}

function saudacao() {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Santarem",
    }).format(new Date()),
  );
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function Painel() {
  const perfil = await exigirPerfil();
  const supabase = await createClient();

  const [publicados, rascunhos, leadsNovos, paraChamar, recentes] = await Promise.all([
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
      .select("id, nome, whatsapp, origem, status, created_at")
      .eq("status", "novo")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("properties")
      .select("id, ref, titulo, bairro, preco, status, imagens:property_images (url, ordem)")
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const primeiroNome = perfil.nome.split(" ")[0];
  const semContato = leadsNovos.count ?? 0;

  return (
    <Pagina>
      <Cabecalho
        titulo={`${saudacao()}, ${primeiroNome}`}
        descricao="O que está no ar e quem está esperando resposta."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Link
          href="/admin/leads?status=novo"
          className="campo-tinta relative col-span-2 flex min-w-0 items-center justify-between gap-4 overflow-hidden rounded-2xl p-5 shadow-[var(--shadow-card)] transition-transform active:scale-[0.99] lg:col-span-1 lg:row-span-1"
        >
          <div className="min-w-0">
            <p className="numeros font-display text-5xl leading-none">{semContato}</p>
            <p className="mt-2 text-sm text-white/75">
              {semContato === 1 ? "pessoa esperando contato" : "pessoas esperando contato"}
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-brand-950">
            <ChevronRight className="size-6" strokeWidth={2} />
          </span>
        </Link>

        <Numero
          rotulo="imóveis no ar"
          valor={publicados.count ?? 0}
          href="/admin/imoveis?status=publicado"
        />
        <Numero
          rotulo="em rascunho"
          valor={rascunhos.count ?? 0}
          href="/admin/imoveis?status=rascunho"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Atalho href="/admin/imoveis/novo" icone={Plus} rotulo="Novo imóvel" />
        <Atalho href="/admin/posts/novo" icone={PenLine} rotulo="Novo texto" />
        <Atalho href="/admin/leads" icone={Users} rotulo="Todos os leads" />
        <Atalho href="/" icone={ExternalLink} rotulo="Abrir o site" externo />
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl">Para chamar agora</h2>
          <Link
            href="/admin/leads"
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent"
          >
            Ver todos
          </Link>
        </div>

        {paraChamar.data?.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {paraChamar.data.map((lead) => (
              <LeadCard key={lead.id} lead={lead as Lead} />
            ))}
          </ul>
        ) : (
          <Cartao>
            <p className="text-sm text-fg-muted">
              Ninguém esperando resposta. Quando alguém preencher o formulário do
              site, aparece aqui com o WhatsApp pronto.
            </p>
          </Cartao>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl">Mexidos por último</h2>
          <Link
            href="/admin/imoveis"
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent"
          >
            Ver imóveis
          </Link>
        </div>

        <Cartao className="!p-2 sm:!p-3">
          <ul className="divide-y divide-border-base">
            {(recentes.data ?? []).map((imovel) => {
              const capa = [...(imovel.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0];
              return (
                <li key={imovel.id}>
                  <Link
                    href={`/admin/imoveis/${imovel.id}`}
                    className="flex min-h-[4.5rem] items-center gap-3 rounded-xl p-2 transition-colors hover:bg-bg-subtle"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-bg-subtle">
                      {capa ? (
                        <Image src={capa.url} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <Building2
                          className="absolute inset-0 m-auto size-5 text-fg-subtle"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium">{imovel.titulo}</p>
                      <p className="numeros truncate text-sm text-fg-muted">
                        {imovel.ref} · {formatPreco(imovel.preco)}
                      </p>
                    </div>
                    <SeloSituacao situacao={imovel.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Cartao>
      </section>
    </Pagina>
  );
}
