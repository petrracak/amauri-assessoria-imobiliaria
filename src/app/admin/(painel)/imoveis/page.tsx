import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, formatPreco } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: { chave: string; rotulo: string }[] = [
  { chave: "", rotulo: "Todos" },
  { chave: "publicado", rotulo: "Publicados" },
  { chave: "rascunho", rotulo: "Rascunhos" },
  { chave: "arquivado", rotulo: "Arquivados" },
];

const COR_STATUS: Record<string, string> = {
  publicado: "text-accent",
  rascunho: "text-fg-muted",
  arquivado: "text-fg-subtle",
};

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminImoveis({ searchParams }: { searchParams: Params }) {
  await exigirPerfil();
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : "";

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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm">Imóveis</h1>
          <p className="numeros mt-2 text-fg-muted">
            {imoveis?.length ?? 0} no total
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

      <form className="mt-8 flex gap-3">
        <input
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por título"
          className="w-full max-w-sm border-b border-border-strong bg-transparent py-2.5 text-sm placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        {status ? <input type="hidden" name="status" value={status} /> : null}
      </form>

      <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {STATUS.map((s) => (
          <Link
            key={s.chave}
            href={s.chave ? `/admin/imoveis?status=${s.chave}` : "/admin/imoveis"}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
              status === s.chave
                ? "border-accent bg-accent text-accent-fg"
                : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {s.rotulo}
          </Link>
        ))}
      </div>

      {imoveis?.length ? (
        <ul className="mt-8 divide-y divide-border-base border-y border-border-base">
          {imoveis.map((imovel) => {
            const capa = [...(imovel.imagens ?? [])].sort(
              (a, b) => a.ordem - b.ordem,
            )[0];
            return (
              <li key={imovel.id}>
                <Link
                  href={`/admin/imoveis/${imovel.id}`}
                  className="flex items-center gap-4 py-3 transition-colors hover:bg-bg-subtle"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden bg-bg-subtle">
                    {capa ? (
                      <Image
                        src={capa.url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem]">{imovel.titulo}</p>
                    <p className="numeros truncate text-sm text-fg-muted">
                      {imovel.ref} · {imovel.bairro ?? "sem bairro"}
                    </p>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="numeros text-[0.9375rem]">
                      {formatPreco(imovel.preco)}
                    </p>
                    <p className={cn("text-xs capitalize", COR_STATUS[imovel.status])}>
                      {imovel.status}
                      {imovel.destaque ? " · destaque" : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-12 border-t border-border-base pt-10">
          <p className="font-display text-2xl">Nenhum imóvel aqui.</p>
          <p className="mt-3 max-w-[48ch] text-pretty leading-relaxed text-fg-muted">
            {busca || status
              ? "Nada com esse filtro. Limpe a busca para ver todos."
              : "Cadastre o primeiro imóvel para ele aparecer no site."}
          </p>
          <Link
            href="/admin/imoveis/novo"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm text-accent-fg"
          >
            Cadastrar imóvel
          </Link>
        </div>
      )}
    </div>
  );
}
