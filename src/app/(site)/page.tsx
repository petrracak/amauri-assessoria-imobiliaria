import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { LeadForm } from "@/components/site/lead-form";
import { PropertyCard } from "@/components/site/property-card";
import { getDestaques, getFacetas } from "@/lib/queries";
import { getConfig, linkWhatsApp } from "@/lib/settings";

export const revalidate = 300;

export default async function Home() {
  const [config, destaques, facetas] = await Promise.all([
    getConfig(),
    getDestaques(7),
    getFacetas(),
  ]);

  const whatsapp = linkWhatsApp(config.contato);
  const [principal, ...demais] = destaques;

  // Até a imagem oficial do banner chegar, a capa do imóvel mais caro segura
  // a primeira dobra. Trocar por config.hero.imagem quando ela existir.
  const imagemHero = config.hero.imagem ?? principal?.imagens?.[0]?.url ?? null;

  return (
    <>
      <Header whatsapp={whatsapp} />

      <main>
        {/* ---------------------------------------------------- primeira dobra */}
        <section className="relative isolate flex min-h-[32rem] items-end overflow-hidden lg:min-h-[44rem]">
          {imagemHero ? (
            <Image
              src={imagemHero}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover"
            />
          ) : (
            <div className="absolute inset-0 -z-10 bg-brand-950" />
          )}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950/95 via-brand-950/45 to-brand-950/15"
            aria-hidden
          />

          <div className="container-site pb-14 pt-32 lg:pb-20 lg:pt-56">
            <h1 className="max-w-[18ch] text-balance font-display text-display-sm text-white lg:text-display-xl">
              {config.hero.titulo}
            </h1>

            <p className="mt-5 max-w-[46ch] text-pretty text-[0.9375rem] leading-relaxed text-white/80 lg:text-lg">
              {config.hero.subtitulo}
            </p>

            {/* Um campo só. O catálogo é que tem filtro, não a capa. */}
            <form
              action="/imoveis"
              className="mt-9 flex max-w-xl items-center gap-3 border-b border-white/35 pb-3"
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
          </div>
        </section>

        {/* ------------------------------------------------------------ vitrine */}
        <section className="container-site py-16 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-display-sm lg:text-display-md">
              Imóveis em destaque
            </h2>
            <Link
              href="/imoveis"
              className="text-sm text-accent underline-offset-4 hover:underline"
            >
              Ver os {facetas.total} imóveis
            </Link>
          </div>

          {principal ? (
            <div className="mt-10 grid gap-x-8 gap-y-12 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PropertyCard imovel={principal} prioridade largo />
              </div>
              {demais.map((imovel) => (
                <PropertyCard key={imovel.id} imovel={imovel} />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-fg-muted">
              Nenhum imóvel publicado ainda. Cadastre o primeiro pelo painel.
            </p>
          )}
        </section>

        {/* ------------------------------------------------- índice de bairros */}
        <section className="campo-tinta linha-encontro">
          <div className="container-site py-16 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-20">
              <div>
                <h2 className="text-balance font-display text-display-sm lg:text-display-md">
                  Onde a Amauri atua
                </h2>
                <p className="mt-5 max-w-[40ch] text-pretty leading-relaxed text-fg-muted">
                  Santarém inteira, com atenção aos bairros onde o alto padrão se
                  concentra. Escolha por região e veja o que está disponível agora.
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
                {facetas.bairros.map(({ nome, total }) => (
                  <li key={nome} className="border-b border-border-base">
                    <Link
                      href={`/imoveis?bairro=${encodeURIComponent(nome)}`}
                      className="flex items-baseline justify-between gap-3 py-3.5 transition-colors hover:text-accent"
                    >
                      <span className="text-[0.9375rem] capitalize">{nome}</span>
                      <span className="numeros text-xs text-fg-subtle">{total}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- captura */}
        <section className="container-site py-16 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-balance font-display text-display-sm lg:text-display-md">
              Receba os imóveis novos antes de todo mundo
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
              Deixe seu WhatsApp e avisamos quando entrar um imóvel com o perfil
              que você procura. Sem disparo em massa.
            </p>
            <div className="mt-8">
              <LeadForm origem="home" />
            </div>
          </div>
        </section>
      </main>

      <Footer
        whatsapp={whatsapp}
        telefone={config.contato.telefone_exibicao}
        instagram={config.contato.instagram}
        creci={config.contato.creci}
      />
    </>
  );
}
