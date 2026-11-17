import { Building2, Map as MapIcon, Plus, Search, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BotaoPlaca } from "@/components/admin/botao-placa";
import {
  Cabecalho,
  Filtros,
  Pagina,
  Selo,
  SeloNegocio,
  SeloPlaca,
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

/**
 * Cada visão responde a uma pergunta que a equipe faz de verdade — e a
 * primeira delas é a que motivou tudo isto: onde ainda falta placa.
 */
const VISOES = [
  { chave: "", rotulo: "Tudo" },
  { chave: "sem-placa", rotulo: "Precisam de placa" },
  { chave: "placa-pendente", rotulo: "Placa pendente" },
  { chave: "com-placa", rotulo: "Com placa" },
  { chave: "negociacao", rotulo: "Em negociação" },
  { chave: "fora", rotulo: "Vendidos e alugados" },
  { chave: "sem-mapa", rotulo: "Sem localização" },
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

  const pedida = typeof params.visao === "string" ? params.visao : "";
  const visao = VISOES.some((v) => v.chave === pedida && v.chave) ? pedida : "";

  const supabase = await createClient();

  let q = supabase
    .from("properties")
    .select(
      `id, ref, slug, titulo, tipo, bairro, preco, status, destaque, updated_at,
       situacao, placa, placa_instalada_em, responsavel_id, latitude,
       imagens:property_images (url, ordem)`,
    );

  if (status) q = q.eq("status", status);
  if (busca) q = q.ilike("titulo", `%${busca}%`);

  switch (visao) {
    case "sem-placa":
      q = q.eq("situacao", "disponivel").eq("placa", "sem_placa").neq("status", "arquivado");
      break;
    case "placa-pendente":
      q = q.eq("placa", "pendente");
      break;
    case "com-placa":
      q = q.eq("placa", "com_placa");
      break;
    case "negociacao":
      q = q.eq("situacao", "negociacao");
      break;
    case "fora":
      q = q.in("situacao", ["vendido", "alugado"]);
      break;
    case "sem-mapa":
      q = q.is("latitude", null).neq("status", "arquivado");
      break;
  }

  // Arquivado fica fora das duas contagens: imóvel que saiu da carteira não
  // precisa de placa nem de pino no mapa.
  const [{ data: imoveis }, semPlaca, semMapa, { data: equipe }] = await Promise.all([
    q.order("updated_at", { ascending: false }).limit(200),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("situacao", "disponivel")
      .eq("placa", "sem_placa")
      .neq("status", "arquivado"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .is("latitude", null)
      .neq("status", "arquivado"),
    supabase.rpc("equipe_nomes"),
  ]);

  const total = imoveis?.length ?? 0;
  const nomePor = new Map((equipe ?? []).map((p) => [p.id, p.nome]));

  const href = (mudanca: { status?: string; visao?: string }) => {
    const qs = new URLSearchParams();
    const s = mudanca.status ?? status;
    const v = mudanca.visao ?? visao;
    if (s) qs.set("status", s);
    if (v) qs.set("visao", v);
    if (busca) qs.set("busca", busca);
    const texto = qs.toString();
    return texto ? `/admin/imoveis?${texto}` : "/admin/imoveis";
  };

  return (
    <Pagina>
      <Cabecalho
        titulo="Imóveis"
        descricao={`${total} ${total === 1 ? "imóvel" : "imóveis"}${busca || status || visao ? " neste filtro" : ""}`}
        acoes={
          <>
            <Link href="/admin/mapa" className={botao.secundario}>
              <MapIcon className="size-5" strokeWidth={1.7} />
              No mapa
            </Link>
            <Link
              href="/admin/imoveis/novo"
              className={cn(botao.primario, "hidden sm:inline-flex")}
            >
              <Plus className="size-5" strokeWidth={2} />
              Cadastrar imóvel
            </Link>
          </>
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
        {visao ? <input type="hidden" name="visao" value={visao} /> : null}
      </form>

      <div className="space-y-2">
        <Filtros
          atual={status}
          itens={STATUS.map((s) => ({ ...s, href: href({ status: s.chave }) }))}
        />
        <Filtros
          atual={visao}
          itens={VISOES.map((v) => ({
            ...v,
            href: href({ visao: v.chave }),
            contagem:
              v.chave === "sem-placa"
                ? (semPlaca.count ?? 0)
                : v.chave === "sem-mapa"
                  ? (semMapa.count ?? 0)
                  : undefined,
          }))}
        />
      </div>

      {imoveis?.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {imoveis.map((imovel) => {
            const capa = [...(imovel.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0];
            const responsavel = imovel.responsavel_id
              ? nomePor.get(imovel.responsavel_id)
              : null;
            const podeMarcar =
              imovel.situacao === "disponivel" &&
              imovel.placa !== "com_placa" &&
              imovel.status !== "arquivado";

            return (
              <li
                key={imovel.id}
                className="min-w-0 overflow-hidden rounded-2xl border border-border-base bg-bg-elevated shadow-[var(--shadow-card)] transition-colors focus-within:border-border-strong hover:border-border-strong"
              >
                <Link href={`/admin/imoveis/${imovel.id}`} className="flex min-w-0 gap-3 p-3">
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

                {/* Faixa de gestão: fora do link, para o botão poder ser botão. */}
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-base px-3 py-2.5">
                  <SeloPlaca placa={imovel.placa} />
                  <SeloNegocio situacao={imovel.situacao} />

                  {/* A falta de coordenada não vira aviso em cada cartão: com
                      a carteira toda sem pino, seriam 34 avisos iguais. Quem
                      quer resolver isso usa a visão "Sem localização". */}
                  {responsavel ? (
                    <span className="truncate text-xs text-fg-muted">{responsavel}</span>
                  ) : null}

                  {podeMarcar ? (
                    <div className="ml-auto">
                      <BotaoPlaca id={imovel.id} />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Vazio
          icone={Building2}
          titulo="Nenhum imóvel aqui"
          texto={
            busca || status || visao
              ? "Nada com esse filtro. Limpe a busca ou escolha Tudo."
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
