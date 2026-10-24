import { Building2, Plus, Search, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  Cabecalho,
  Filtros,
  Pagina,
  Selo,
  SeloSituacao,
  Vazio,
  botao,
  campo,
} from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, formatPreco } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Imóveis" };

const STATUS = [
  { chave: "", rotulo: "Todos" },
  { chave: "publicado", rotulo: "No ar" },
  { chave: "rascunho", rotulo: "Rascunhos" },
  { chave: "arquivado", rotulo: "Arquivados" },
];

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminImoveis({ searchParams }: { searchParams: Params }) {
  await exigirPerfil();
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca.trim() : "";

  // searchParams é string livre; o enum do banco só aceita estes valores.
  const VALIDOS = ["publicado", "rascunho", "arquivado"] as const;
  const bruto = typeof params.status === "string" ? params.status : "";
  const status = (VALIDOS as readonly string[]).includes(bruto)
    ? (bruto as (typeof VALIDOS)[number])
    : "";

  const supabase = await createClient();
  let q = supabase
    .from("properties")
    .select(
      "id, ref, slug, titulo, tipo, bairro, preco, status, destaque, updated_at, imagens:property_images (url, ordem)",
    );

  if (status) q = q.eq("status", status);
  if (busca) q = q.ilike("titulo", `%${busca}%`);

  const { data: imoveis } = await q.order("updated_at", { ascending: false }).limit(200);
  const total = imoveis?.length ?? 0;

  const hrefStatus = (chave: string) => {
    const qs = new URLSearchParams();
    if (chave) qs.set("status", chave);
    if (busca) qs.set("busca", busca);
    const s = qs.toString();
    return s ? `/admin/imoveis?${s}` : "/admin/imoveis";
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Imóveis"
        descricao={`${total} ${total === 1 ? "imóvel" : "imóveis"}${busca || status ? " neste filtro" : ""}`}
        acoes={
          <Link href="/admin/imoveis/novo" className={cn(botao.primario, "hidden sm:inline-flex")}>
            <Plus className="size-5" strokeWidth={2} />
            Cadastrar imóvel
          </Link>
        }
      />

      <form role="search" className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          strokeWidth={1.6}
        />
        <input
          name="busca"
          type="search"
          defaultValue={busca}
          placeholder="Buscar pelo título"
          aria-label="Buscar imóvel pelo título"
          className={cn(campo, "!mt-0 !rounded-full pl-12")}
        />
        {status ? <input type="hidden" name="status" value={status} /> : null}
      </form>

      <Filtros
        atual={status}
        itens={STATUS.map((s) => ({ ...s, href: hrefStatus(s.chave) }))}
      />

      {imoveis?.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {imoveis.map((imovel) => {
            const capa = [...(imovel.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0];
            return (
              <li key={imovel.id} className="min-w-0">
                <Link
                  href={`/admin/imoveis/${imovel.id}`}
                  className="flex h-full min-w-0 gap-3 rounded-2xl border border-border-base bg-bg-elevated p-3 shadow-[var(--shadow-card)] transition-colors hover:border-border-strong active:scale-[0.99]"
                >
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-bg-subtle">
                    {capa ? (
                      <Image src={capa.url} alt="" fill sizes="96px" className="object-cover" />
                    ) : (
                      <Building2
                        className="absolute inset-0 m-auto size-7 text-fg-subtle"
                        strokeWidth={1.4}
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[0.9375rem] font-medium leading-snug">
                        {imovel.titulo}
                      </p>
                      <p className="numeros mt-1 truncate text-sm text-fg-muted">
                        {imovel.ref} · {imovel.bairro ?? "sem bairro"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <p className="numeros text-[0.9375rem] font-semibold">
                        {formatPreco(imovel.preco)}
                      </p>
                      <SeloSituacao situacao={imovel.status} />
                      {imovel.destaque ? (
                        <Selo tom="azul">
                          <Star className="size-3" strokeWidth={2} />
                          Destaque
                        </Selo>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Vazio
          icone={Building2}
          titulo="Nenhum imóvel aqui"
          texto={
            busca || status
              ? "Nada com esse filtro. Limpe a busca ou escolha Todos."
              : "Cadastre o primeiro imóvel para ele aparecer no site."
          }
          acao={
            <Link href="/admin/imoveis/novo" className={botao.primario}>
              <Plus className="size-5" strokeWidth={2} />
              Cadastrar imóvel
            </Link>
          }
        />
      )}
    </Pagina>
  );
}
