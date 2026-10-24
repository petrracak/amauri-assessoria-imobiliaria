import type { Metadata } from "next";
import Link from "next/link";

import { Filtros, FiltrosAplicados, type FiltrosAtivos } from "@/components/site/filtros";
import { interpretarBusca } from "@/lib/busca-inteligente";
import { Footer } from "@/components/site/footer";
import { PropertyCard } from "@/components/site/property-card";
import { SiteHeader } from "@/components/site/site-header";
import { FAIXAS_PRECO, getFacetas, getImoveis, type Ordenacao } from "@/lib/queries";
import { redirect } from "next/navigation";
import { getConfig, linkWhatsApp } from "@/lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Imóveis à venda em Santarém",
  description:
    "Casas, apartamentos e terrenos à venda em Santarém, no Pará, com assessoria completa da Amauri.",
};

type Params = Promise<Record<string, string | string[] | undefined>>;

const ORDENACOES: { valor: Ordenacao; rotulo: string }[] = [
  { valor: "destaque", rotulo: "Destaques" },
  { valor: "menor-preco", rotulo: "Menor preço" },
  { valor: "maior-preco", rotulo: "Maior preço" },
  { valor: "recentes", rotulo: "Mais recentes" },
];

function umValor(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Imoveis({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;

  const atuais: FiltrosAtivos = {
    tipo: umValor(params.tipo),
    bairro: umValor(params.bairro),
    dormitorios: umValor(params.dormitorios),
    faixa: umValor(params.faixa),
    busca: umValor(params.busca),
    ordenacao: umValor(params.ordenacao),
  };

  const facetasParaBusca = await getFacetas();

  // A frase vira filtro; o que a pessoa escolheu na lateral tem prioridade,
  // para um clique nunca ser desfeito pelo texto digitado antes.
  const lida = atuais.busca
    ? interpretarBusca(atuais.busca, {
        tipos: facetasParaBusca.tipos.map((x) => x.nome),
        bairros: facetasParaBusca.bairros.map((x) => x.nome),
      })
    : null;

  // Buscou pela referência: leva direto ao imóvel, sem passar pela lista.
  if (lida?.ref) {
    const [achado] = await getImoveis({ busca: lida.ref }, 1);
    if (achado) redirect(`/imoveis/${achado.slug}`);
  }

  const faixa = FAIXAS_PRECO.find((f) => f.chave === atuais.faixa);
  const ordenacao = (ORDENACOES.find((o) => o.valor === atuais.ordenacao)?.valor ??
    "destaque") as Ordenacao;

  const facetas = facetasParaBusca;
  const [config, imoveis] = await Promise.all([
    getConfig(),
    getImoveis({
      tipo: atuais.tipo ?? lida?.tipo,
      bairro: atuais.bairro ?? lida?.bairro,
      busca: lida?.texto ?? (lida ? undefined : atuais.busca),
      dormitorios: atuais.dormitorios
        ? Number(atuais.dormitorios)
        : lida?.dormitorios,
      suites: lida?.suites,
      vagas: lida?.vagas,
      precoMin: faixa?.min ?? lida?.precoMin,
      precoMax: (faixa?.max ?? undefined) ?? lida?.precoMax,
      ordenacao,
    }),
  ]);

  const whatsapp = linkWhatsApp(config.contato);

  const titulo = atuais.busca
    ? `Resultados para “${atuais.busca}”`
    : atuais.bairro
      ? `Imóveis em ${atuais.bairro}`
      : atuais.tipo
        ? atuais.tipo
        : "Imóveis à venda em Santarém";

  const rotulos: Partial<Record<keyof FiltrosAtivos, string>> = {
    tipo: atuais.tipo,
    bairro: atuais.bairro,
    dormitorios: atuais.dormitorios
      ? `${atuais.dormitorios}${Number(atuais.dormitorios) >= 4 ? "+" : ""} ${
          atuais.dormitorios === "1" ? "quarto" : "quartos"
        }`
      : undefined,
    faixa: faixa?.rotulo,
    busca: atuais.busca ? `“${atuais.busca}”` : undefined,
  };

  /** Mantém os filtros ao trocar a ordem. */
  const urlOrdenacao = (valor: Ordenacao) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(atuais)) {
      if (v && k !== "ordenacao") p.set(k, v);
    }
    if (valor !== "destaque") p.set("ordenacao", valor);
    const q = p.toString();
    return q ? `/imoveis?${q}` : "/imoveis";
  };

  return (
    <>
      <SiteHeader />

      <main className="container-site py-12 lg:py-16">
        <h1 className="text-balance font-display text-display-sm lg:text-display-md">
          {titulo}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-12">
          <Filtros facetas={facetas} atuais={atuais} resultados={imoveis.length} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-base pb-5">
              <p className="numeros text-sm text-fg-muted">
                {imoveis.length} {imoveis.length === 1 ? "imóvel" : "imóveis"}
                {imoveis.length !== facetas.total ? ` de ${facetas.total}` : ""}
              </p>

              <div className="flex flex-wrap gap-1">
                {ORDENACOES.map((o) => (
                  <Link
                    key={o.valor}
                    href={urlOrdenacao(o.valor)}
                    scroll={false}
                    className={
                      ordenacao === o.valor
                        ? "rounded-full bg-bg-subtle px-3.5 py-1.5 text-sm text-fg"
                        : "rounded-full px-3.5 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
                    }
                  >
                    {o.rotulo}
                  </Link>
                ))}
              </div>
            </div>

            {lida && lida.entendido.length > 0 ? (
              // Mostrar o que foi lido evita o susto de ver a lista encolher
              // sem explicação — e ensina o que a busca entende.
              <p className="mt-5 text-sm text-fg-muted">
                Entendi da sua busca:{" "}
                {lida.entendido.map((e, i) => (
                  <span key={e.chave}>
                    {i > 0 ? " · " : ""}
                    <span className="text-fg">{e.rotulo}</span>
                  </span>
                ))}
                {lida.texto ? (
                  <>
                    {" · "}
                    <span className="text-fg">“{lida.texto}”</span>
                  </>
                ) : null}
              </p>
            ) : null}

            <div className="mt-5">
              <FiltrosAplicados atuais={atuais} rotulos={rotulos} />
            </div>

            {imoveis.length > 0 ? (
              // A chave muda junto com o filtro: o React remonta a lista e
              // a entrada escalonada roda de novo, sinalizando a troca.
              <div
                key={[
                  atuais.tipo,
                  atuais.bairro,
                  atuais.dormitorios,
                  atuais.faixa,
                  atuais.busca,
                  ordenacao,
                ].join("|")}
                className="entra-lista mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3"
              >
                {imoveis.map((imovel, i) => (
                  <PropertyCard key={imovel.id} imovel={imovel} prioridade={i < 3} />
                ))}
              </div>
            ) : (
              <div className="mt-12 border-t border-border-base pt-10">
                <p className="font-display text-2xl">Nada com esse filtro.</p>
                <p className="mt-3 max-w-[48ch] text-pretty leading-relaxed text-fg-muted">
                  Tente outro bairro ou faixa de valor. Se procura algo
                  específico, fale direto com o Amauri — boa parte do estoque de
                  alto padrão não chega a ser anunciada.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/imoveis"
                    className="rounded-full border border-border-strong px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent"
                  >
                    Limpar filtros
                  </Link>
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-accent px-5 py-2.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
                  >
                    Falar com Amauri
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer
        whatsapp={whatsapp}
        telefone={config.contato.telefone_exibicao}
        instagram={config.contato.instagram}
      />
    </>
  );
}
