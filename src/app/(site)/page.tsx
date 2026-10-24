import { ArrowDown, ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/site-header";
import { LeadForm } from "@/components/site/lead-form";
import { PropertyCard } from "@/components/site/property-card";
import { Revela } from "@/components/site/revela";
import { getDestaques, getFacetas } from "@/lib/queries";
import { getConfig, linkWhatsApp } from "@/lib/settings";
import { formatPreco } from "@/lib/utils";

export const revalidate = 300;

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

          {/* O banner já nasce escuro à esquerda; o véu só firma a leitura
              do texto sobre ele, sem apagar a foto. */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[#081828] via-[#081828]/60 to-[#081828]/15 xl:bg-gradient-to-r xl:from-[#081828] xl:via-[#081828]/70 xl:to-transparent"
            aria-hidden
          />

          <div className="container-site pb-16 pt-36 lg:pb-24 lg:pt-56">
            <p className="hero-item text-xs uppercase tracking-[0.22em] text-white/60">
              Santarém · Pará
            </p>

            <h1 className="hero-item mt-5 max-w-[16ch] text-balance font-display text-display-md text-white lg:text-display-xl">
              Imóveis de alto padrão em Santarém
            </h1>

            <p className="hero-item mt-6 max-w-[46ch] text-pretty leading-relaxed text-white/75 lg:text-lg">
              {config.hero.subtitulo}
            </p>

            {/* Um campo só. O catálogo é que tem filtro, não a capa. */}
            <form
              action="/imoveis"
              className="hero-item mt-10 flex max-w-xl items-center gap-3 border-b border-white/35 pb-3"
            >
              <label htmlFor="busca-hero" className="sr-only">
                Buscar imóvel por bairro, tipo ou referência
              </label>
              <input
                id="busca-hero"
                name="busca"
                placeholder="Bairro, tipo ou referência"
                className="w-full min-w-0 bg-transparent py-1.5 text-[0.9375rem] text-white placeholder:text-white/55 focus:outline-none"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-brand-950 transition-colors hover:bg-white/90 sm:px-5"
              >
                <Search className="size-4" strokeWidth={1.75} />
                <span className="sr-only sm:not-sr-only">Buscar</span>
              </button>
            </form>

            {/* Frase inteira em caixa alta com espaçamento largo fica difícil
                de ler; em caixa normal ela convida em vez de gritar. */}
            <div className="hero-item mt-14 hidden items-center gap-3 text-sm text-white/60 lg:flex">
              <ArrowDown className="size-4 animate-bounce" strokeWidth={1.5} />
              Role para baixo e encontre o seu novo imóvel
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- vitrine em bento */}
        <section className="container-site py-20 lg:py-28">
          <Revela>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-fg-subtle">
                  Acervo
                </p>
                <h2 className="mt-4 max-w-[18ch] text-balance font-display text-display-sm lg:text-display-md">
                  Selecionados para quem já sabe o que quer
                </h2>
              </div>
              <Link
                href="/imoveis"
                className="group flex items-center gap-2 text-sm text-accent"
              >
                Ver os {facetas.total} imóveis
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
          </Revela>

          {principal ? (
            <div className="mt-12 grid auto-rows-auto grid-cols-6 gap-4 lg:gap-5">
              <div className="col-span-6 lg:col-span-4">
                <PropertyCard imovel={principal} prioridade formato="largo" />
              </div>

              {/* Bloco de dados no meio da grade: quebra a repetição de cards
                  e responde a pergunta que todo visitante faz primeiro. */}
              <Link
                href="/imoveis"
                className="campo-tinta group col-span-6 flex flex-col justify-between p-7 transition-opacity hover:opacity-95 sm:col-span-3 lg:col-span-2"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-fg-subtle">
                    No catálogo hoje
                  </p>
                  <p className="numeros mt-6 font-display text-display-md leading-none">
                    {facetas.total}
                  </p>
                  <p className="mt-2 text-sm text-fg-muted">
                    imóveis em {facetas.bairros.length} bairros
                  </p>
                </div>

                <div className="mt-10">
                  <div className="linha-encontro pt-5">
                    <p className="text-sm text-fg-muted">
                      A partir de{" "}
                      <span className="numeros text-fg">
                        {formatPreco(menorPreco)}
                      </span>
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm text-accent">
                      Ver todos
                      <ArrowRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={1.5}
                      />
                    </span>
                  </div>
                </div>
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
              <p className="text-xs uppercase tracking-[0.22em] text-fg-subtle">
                A assessoria
              </p>
              <h2 className="mt-4 max-w-[20ch] text-balance font-display text-display-sm lg:text-display-md">
                Cada imóvel daqui foi visitado antes de entrar no site
              </h2>
              <div className="mt-6 max-w-[48ch] space-y-4 text-pretty leading-relaxed text-fg-muted">
                <p>
                  A ficha diz a metragem real, o que está incluso e o que falta
                  resolver na documentação. Quando um imóvel não serve para quem
                  procura, o certo é dizer.
                </p>
                <p>
                  O estoque de alto padrão em Santarém muda rápido, e boa parte
                  nem chega a ser anunciada.
                </p>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border-strong pt-8">
                <div>
                  <dt className="text-sm text-fg-muted">Imóveis</dt>
                  <dd className="numeros mt-1 font-display text-3xl">
                    {facetas.total}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-fg-muted">Bairros</dt>
                  <dd className="numeros mt-1 font-display text-3xl">
                    {facetas.bairros.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-fg-muted">CRECI</dt>
                  <dd className="numeros mt-1 font-display text-3xl">
                    {config.contato.creci.replace(/\D/g, "")}
                  </dd>
                </div>
              </dl>

              <Link
                href="/sobre"
                className="group mt-10 inline-flex items-center gap-2 text-sm text-accent"
              >
                Conhecer a assessoria
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </Link>
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
                <p className="text-xs uppercase tracking-[0.22em] text-fg-subtle">
                  Onde atuamos
                </p>
                <h2 className="mt-4 text-balance font-display text-display-sm lg:text-display-md">
                  Santarém, bairro por bairro
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
            <h2 className="text-balance font-display text-display-sm lg:text-display-md">
              Receba os imóveis novos antes de todo mundo
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
