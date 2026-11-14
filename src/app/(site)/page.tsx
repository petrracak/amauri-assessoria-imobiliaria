
import Image from "next/image";
import Link from "next/link";

import { Botao, LinkSeta } from "@/components/site/botao";
import { Footer } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/site-header";
import { LeadForm } from "@/components/site/lead-form";
import { PropertyCard } from "@/components/site/property-card";
import { Revela } from "@/components/site/revela";
import type { Metadata } from "next";

import { getDestaques, getFacetas } from "@/lib/queries";
import { DESCRICAO_PADRAO, metaPagina } from "@/lib/seo";
import { getConfig, linkWhatsApp } from "@/lib/settings";
import { formatPreco } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  ...metaPagina({
    titulo: "Imóveis de alto padrão em Santarém | Amauri Assessoria Imobiliária",
    descricao: DESCRICAO_PADRAO,
    caminho: "/",
  }),
  // Título absoluto: sem o sufixo do template, que repetiria o nome da empresa.
  title: { absolute: "Imóveis de alto padrão em Santarém | Amauri Assessoria Imobiliária" },
};

export default async function Home() {
  const [config, destaques, facetas] = await Promise.all([
    getConfig(),
    getDestaques(6),
    getFacetas(),
  ]);

  const whatsapp = linkWhatsApp(config.contato);
  const [principal, ...demais] = destaques;

  const menorPreco = destaques
    .map((i) => i.preco)
    .filter((p): p is number => typeof p === "number")
    .sort((a, b) => a - b)[0];

  return (
    <>
      <SiteHeader sobreposto />

      <main>
        {/* ---------------------------------------------------- primeira dobra */}
        <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-[#081828]">
          {config.hero.imagem ? (
            <Image
              src={config.hero.imagem}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover"
            />
          ) : (
            /* Duas composições, escolhidas pela largura da tela: na larga o
               Amauri fica à direita e o título ocupa o escuro da esquerda;
               na estreita ele fica no topo e o texto desce. <picture> baixa
               só a que vai aparecer — duas <Image> baixariam as duas. */
            <picture>
              {/* A troca só em 1280px: abaixo disso a arte larga (2.08) seria
                  recortada demais e cortaria o Amauri. A estreita aguenta
                  telas médias porque ele está no centro dela. */}
              <source
                media="(min-width: 1280px)"
                srcSet="/banner-largo.webp"
                width={1920}
                height={924}
              />
              <img
                src="/banner-estreito.webp"
                alt=""
                width={1080}
                height={892}
                fetchPriority="high"
                decoding="async"
                // Ancorado entre o topo e o centro: o corte vertical tira um
                // pouco de céu em cima e menos do corpo embaixo.
                //
                // Acima de 2:1 a tela fica mais larga que a arte e o corte
                // comeria o Amauri. Aí ela passa a caber inteira, encostada
                // à direita — a sobra à esquerda é o mesmo azul do fundo da
                // seção, então não aparece emenda.
                className="absolute inset-0 -z-10 size-full object-cover object-[center_28%] [@media(min-aspect-ratio:2/1)]:object-contain [@media(min-aspect-ratio:2/1)]:object-right"
              />
            </picture>
          )}

          {/* Brilho frio atrás do texto, vindo de baixo à esquerda. Faz o
              papel do halo quente da referência, na cor da marca: separa o
              bloco de texto da foto sem precisar de caixa nem de borda. */}
          <div
            className="pointer-events-none absolute -bottom-40 -left-40 -z-10 size-[42rem] rounded-full bg-[radial-gradient(circle,rgba(45,127,201,0.3)_0%,rgba(45,127,201,0.08)_45%,transparent_70%)] blur-2xl"
            aria-hidden
          />

          {/* O banner já nasce escuro à esquerda; o véu só firma a leitura
              do texto sobre ele, sem apagar a foto. */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[#081828] via-[#081828]/60 to-[#081828]/15 xl:bg-gradient-to-r xl:from-[#081828] xl:via-[#081828]/70 xl:to-transparent"
            aria-hidden
          />

          <div className="container-site pb-16 pt-36 lg:pb-24 lg:pt-56">
            {/* O rótulo acima do título: caixa alta espaçada, mas com o
                gradiente correndo na horizontal — é o que o tira de
                "etiqueta padrão" e o liga ao título. */}
            <p className="hero-item bg-[linear-gradient(90deg,#ffffff_0%,#cddcef_55%,var(--color-brand-400)_100%)] bg-clip-text text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-transparent">
              Santarém · Pará · CRECI {config.contato.creci}
            </p>

            <h1 className="hero-item texto-gelo mt-6 max-w-[17ch] text-balance font-titulo text-display-md lg:text-display-lg 2xl:text-display-xl">
              Imóveis de <span className="destaque">alto padrão</span> em Santarém
            </h1>

            <p className="hero-item mt-6 max-w-[44ch] text-pretty leading-relaxed text-white/70 lg:text-lg">
              {config.hero.subtitulo}
            </p>

            {/* Um campo só. O catálogo é que tem filtro, não a capa. */}
            <form
              action="/imoveis"
              className="hero-item mt-10 flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] p-2 pl-6 backdrop-blur-xl transition-colors focus-within:border-white/35"
            >
              <label htmlFor="busca-hero" className="sr-only">
                Buscar imóvel por bairro, tipo ou referência
              </label>
              <input
                id="busca-hero"
                name="busca"
                placeholder="Bairro, tipo ou referência"
                className="w-full min-w-0 bg-transparent text-[0.9375rem] text-white placeholder:text-white/50 focus:outline-none"
              />
              <Botao type="submit" className="max-sm:!gap-0 max-sm:!pl-1.5">
                <span className="max-sm:sr-only">Buscar</span>
              </Botao>
            </form>

            <div className="hero-item mt-14 hidden items-center gap-3 text-sm text-white/55 lg:flex">
              <span aria-hidden className="relative h-px w-10 overflow-hidden bg-white/15">
                <span className="linha-corre absolute inset-y-0 left-0 w-1/2 bg-white/80" />
              </span>
              Role para baixo e encontre o seu novo imóvel
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- vitrine em bento */}
        <section className="container-site py-20 lg:py-28">
          <Revela>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <h2 className="texto-tinta max-w-[18ch] text-balance font-titulo text-display-sm lg:text-display-md">
                Imóveis <span className="destaque">disponíveis</span> agora
              </h2>
              <LinkSeta href="/imoveis">Ver os {facetas.total} imóveis</LinkSeta>
            </div>
          </Revela>

          {principal ? (
            <div className="mt-12 grid auto-rows-auto grid-cols-6 gap-4 lg:gap-5">
              <div className="col-span-6 lg:col-span-4">
                <PropertyCard imovel={principal} prioridade formato="largo" />
              </div>

              {/* No meio da grade, em vez de mais um card: o tamanho do acervo
                  dito em uma frase, com o caminho para o catálogo inteiro. */}
              <Link
                href="/imoveis"
                className="campo-tinta group col-span-6 flex flex-col justify-between p-7 transition-opacity hover:opacity-95 sm:col-span-3 lg:col-span-2"
              >
                <p className="texto-gelo text-balance font-titulo text-[1.75rem] leading-[1.2]">
                  {facetas.total} imóveis em {facetas.bairros.length} bairros de
                  Santarém, <span className="destaque">a partir de</span>{" "}
                  <span className="numeros">{formatPreco(menorPreco)}</span>.
                </p>

                <span className="mt-10 border-t border-border-strong pt-5 text-sm underline-offset-4 group-hover:underline">
                  Abrir o catálogo completo
                </span>
              </Link>

              {demais.map((imovel, i) => (
                <div
                  key={imovel.id}
                  className="col-span-6 sm:col-span-3 lg:col-span-2"
                >
                  <PropertyCard imovel={imovel} prioridade={i < 2} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-10 text-fg-muted">
              Nenhum imóvel publicado ainda. Cadastre o primeiro pelo painel.
            </p>
          )}
        </section>

        {/* ------------------------------------------------ bloco institucional */}
        <section className="border-y border-border-base bg-bg-subtle">
          <div className="container-site grid gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
            <Revela>
              <h2 className="texto-tinta max-w-[19ch] text-balance font-titulo text-display-sm lg:text-display-md">
                Uma imobiliária que Santarém confia há{" "}
                <span className="destaque">{config.sobre.anos_atuacao} anos</span>
              </h2>

              <div className="mt-6 max-w-[48ch] space-y-4 text-pretty leading-relaxed text-fg-muted">
                <p>{config.sobre.apresentacao}</p>
                <p>{config.sobre.compromisso}</p>
              </div>

              {/* Os números que sustentam a frase acima: tempo de casa e
                  vendas. Contagem de catálogo não prova nada — muda a cada
                  cadastro e não diz nada de quem está do outro lado. */}
              <dl className="mt-10 flex flex-wrap items-end gap-x-12 gap-y-6 border-t border-border-strong pt-8">
                <div>
                  <dd className="numeros font-titulo text-[2.75rem] leading-none">
                    {config.sobre.anos_atuacao}
                  </dd>
                  <dt className="mt-2 text-sm text-fg-muted">anos de atuação</dt>
                </div>
                <div>
                  <dd className="numeros font-titulo text-[2.75rem] leading-none">
                    {config.sobre.imoveis_vendidos}
                  </dd>
                  <dt className="mt-2 text-sm text-fg-muted">imóveis vendidos</dt>
                </div>
              </dl>

              {/* O CRECI é um registro, não uma quantidade: ao lado dos
                  números grandes ele disputava a atenção sem dizer mais. */}
              <p className="numeros mt-5 text-sm text-fg-muted">
                CRECI {config.contato.creci}
              </p>

              <LinkSeta href="/sobre" className="mt-8">
                Conhecer a assessoria
              </LinkSeta>
            </Revela>

            <Revela atraso={120} className="relative flex items-end justify-center lg:justify-end">
              <Image
                src="/amauri-retrato.webp"
                alt="Amauri Nobre, corretor responsável pela assessoria"
                width={754}
                height={889}
                sizes="(max-width: 1024px) 70vw, 36vw"
                className="h-auto w-full max-w-sm lg:max-w-none"
              />
            </Revela>
          </div>
        </section>

        {/* ------------------------------------------------- índice de bairros */}
        <section className="campo-tinta">
          <div className="container-site py-20 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-20">
              <Revela>
                <h2 className="texto-gelo text-balance font-titulo text-display-sm lg:text-display-md">
                  Santarém, <span className="destaque">bairro por bairro</span>
                </h2>
                <p className="mt-5 max-w-[40ch] text-pretty leading-relaxed text-fg-muted">
                  Escolha a região e veja o que está disponível agora.
                </p>
              </Revela>

              <ul className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
                {facetas.bairros.map(({ nome, total }) => (
                  <li key={nome} className="border-b border-border-base">
                    <Link
                      href={`/imoveis?bairro=${encodeURIComponent(nome)}`}
                      className="group flex items-baseline justify-between gap-3 py-3.5 transition-colors hover:text-accent"
                    >
                      <span className="text-[0.9375rem] capitalize">{nome}</span>
                      <span className="numeros text-xs text-fg-subtle transition-transform duration-300 group-hover:-translate-x-1">
                        {total}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- captura */}
        <section className="container-site py-20 lg:py-28">
          <Revela className="max-w-2xl">
            <h2 className="texto-tinta max-w-[20ch] text-balance font-titulo text-display-sm lg:text-display-md">
              Receba os imóveis novos <span className="destaque">antes de todo mundo</span>
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-fg-muted">
              Deixe seu WhatsApp e avisamos quando entrar um imóvel com o perfil
              que você procura. Sem disparo em massa.
            </p>
            <div className="mt-9">
              <LeadForm origem="home" />
            </div>
          </Revela>
        </section>
      </main>

      <Footer
        whatsapp={whatsapp}
        telefone={config.contato.telefone_exibicao}
        instagram={config.contato.instagram}
      />
    </>
  );
}
