import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/site/footer";
import { Gallery } from "@/components/site/gallery";
import { Header } from "@/components/site/header";
import { PropertyCard } from "@/components/site/property-card";
import { getImoveis, getImovel } from "@/lib/queries";
import { getConfig, linkWhatsApp } from "@/lib/settings";
import { formatArea, formatPreco } from "@/lib/utils";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

/** Gera as páginas dos imóveis publicados no build; novos entram por ISR. */
export async function generateStaticParams() {
  const imoveis = await getImoveis({}, 200);
  return imoveis.map((imovel) => ({ slug: imovel.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const imovel = await getImovel(slug);
  if (!imovel) return { title: "Imóvel não encontrado" };

  const capa = imovel.imagens?.[0]?.url;
  return {
    title: imovel.meta_title ?? imovel.titulo,
    description:
      imovel.meta_description ??
      `${imovel.titulo} em ${imovel.bairro ?? imovel.cidade}. ${formatPreco(imovel.preco)}.`,
    alternates: { canonical: `/imoveis/${imovel.slug}` },
    openGraph: capa ? { images: [{ url: capa }] } : undefined,
  };
}

function Ficha({ itens }: { itens: { rotulo: string; valor: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 border-y border-border-base sm:grid-cols-3">
      {itens.map((item) => (
        <div key={item.rotulo} className="border-b border-border-base py-4 last:border-b-0 sm:border-b">
          <dt className="text-xs text-fg-subtle">{item.rotulo}</dt>
          <dd className="numeros mt-1 text-lg">{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ImovelPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [config, imovel] = await Promise.all([getConfig(), getImovel(slug)]);

  if (!imovel) notFound();

  const whatsappGeral = linkWhatsApp(config.contato);
  const whatsappImovel = linkWhatsApp(
    config.contato,
    `${imovel.titulo} (ref. ${imovel.ref})`,
  );

  const caracteristicas = (imovel.caracteristicas ?? [])
    .map((c: { features: { nome: string; grupo: string } | null }) => c.features)
    .filter(Boolean) as { nome: string; grupo: string }[];

  const doImovel = caracteristicas.filter((c) => c.grupo === "imovel");
  const doEmpreendimento = caracteristicas.filter((c) => c.grupo === "empreendimento");

  const ficha = [
    imovel.dormitorios && { rotulo: "Dormitórios", valor: String(imovel.dormitorios) },
    imovel.suites && { rotulo: "Suítes", valor: String(imovel.suites) },
    imovel.banheiros && { rotulo: "Banheiros", valor: String(imovel.banheiros) },
    imovel.vagas && { rotulo: "Vagas", valor: String(imovel.vagas) },
    imovel.area_privativa && {
      rotulo: "Área privativa",
      valor: formatArea(imovel.area_privativa)!,
    },
    imovel.area_total && { rotulo: "Área total", valor: formatArea(imovel.area_total)! },
  ].filter(Boolean) as { rotulo: string; valor: string }[];

  const semelhantes = (
    await getImoveis({ tipo: imovel.tipo, bairro: imovel.bairro ?? undefined }, 4)
  ).filter((i) => i.id !== imovel.id).slice(0, 3);

  return (
    <>
      <Header whatsapp={whatsappGeral} />

      <main className="container-site pb-10 pt-8 lg:py-12">
        <nav className="mb-6 text-sm text-fg-muted">
          <Link href="/imoveis" className="transition-colors hover:text-fg">
            Imóveis
          </Link>
          <span className="px-2 text-fg-subtle">/</span>
          <span className="text-fg">{imovel.titulo}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          {/* min-w-0: sem isso o carrossel estoura a largura da coluna. */}
          <div className="min-w-0">
            <Gallery fotos={imovel.imagens ?? []} titulo={imovel.titulo} />
          </div>

          {/* Preço e contato acompanham a rolagem no desktop. */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="numeros text-xs text-fg-subtle">
              Referência {imovel.ref}
            </p>
            <h1 className="mt-2 text-balance font-display text-display-sm leading-tight">
              {imovel.titulo}
            </h1>
            <p className="mt-2 text-fg-muted">
              {imovel.bairro ? `${imovel.bairro}, ` : ""}
              {imovel.cidade} — {imovel.uf}
            </p>

            <p className="numeros mt-6 font-display text-display-sm">
              {formatPreco(imovel.preco)}
            </p>
            {imovel.preco_anterior ? (
              <p className="numeros mt-1 text-sm text-fg-subtle line-through">
                {formatPreco(imovel.preco_anterior)}
              </p>
            ) : null}

            <a
              href={whatsappImovel}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 block rounded-full bg-accent px-7 py-4 text-center text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Perguntar sobre este imóvel
            </a>

            {imovel.endereco ? (
              <p className="mt-6 text-pretty text-sm leading-relaxed text-fg-muted">
                {imovel.endereco}
              </p>
            ) : null}

            <p className="mt-6 text-xs leading-relaxed text-fg-subtle">
              Preços, disponibilidade e condições podem mudar sem aviso.
            </p>
          </aside>
        </div>

        {ficha.length > 0 ? (
          <section className="mt-14">
            <h2 className="sr-only">Ficha técnica</h2>
            <Ficha itens={ficha} />
          </section>
        ) : null}

        {imovel.descricao ? (
          <section className="mt-14 max-w-[65ch]">
            <h2 className="font-display text-display-sm">Sobre o imóvel</h2>
            <div className="mt-5 space-y-4 text-pretty leading-relaxed text-fg-muted">
              {imovel.descricao
                .split(/\n{2,}/)
                .filter((p: string) => p.trim())
                .map((paragrafo: string, i: number) => (
                  <p key={i} className="whitespace-pre-line">
                    {paragrafo}
                  </p>
                ))}
            </div>
          </section>
        ) : null}

        {doImovel.length > 0 || doEmpreendimento.length > 0 ? (
          <section className="mt-14 grid gap-10 sm:grid-cols-2">
            {doImovel.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl">O que tem no imóvel</h2>
                <ul className="mt-5 grid gap-y-2.5">
                  {doImovel.map((c) => (
                    <li key={c.nome} className="text-[0.9375rem] text-fg-muted">
                      {c.nome}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {doEmpreendimento.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl">O que tem no condomínio</h2>
                <ul className="mt-5 grid gap-y-2.5">
                  {doEmpreendimento.map((c) => (
                    <li key={c.nome} className="text-[0.9375rem] text-fg-muted">
                      {c.nome}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {semelhantes.length > 0 ? (
          <section className="mt-20 border-t border-border-base pt-12">
            <h2 className="font-display text-display-sm">Imóveis parecidos</h2>
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {semelhantes.map((i) => (
                <PropertyCard key={i.id} imovel={i} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {/* Barra fixa de contato no celular — o botão principal nunca some. */}
      <div className="sticky bottom-0 z-40 border-t border-border-base bg-bg/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4">
          <p className="numeros flex-1 font-display text-xl">
            {formatPreco(imovel.preco)}
          </p>
          <a
            href={whatsappImovel}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-6 py-3 text-sm text-accent-fg"
          >
            Perguntar
          </a>
        </div>
      </div>

      <Footer
        whatsapp={whatsappGeral}
        telefone={config.contato.telefone_exibicao}
        instagram={config.contato.instagram}
      />
    </>
  );
}
