import type { Metadata } from "next";

import { Footer } from "@/components/site/footer";
import { Revela } from "@/components/site/revela";
import { SiteHeader } from "@/components/site/site-header";
import { LeadForm } from "@/components/site/lead-form";
import { getFacetas } from "@/lib/queries";
import { metaPagina } from "@/lib/seo";
import { getConfig, linkWhatsApp } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = metaPagina({
  titulo: "Sobre a assessoria",
  descricao:
    "Amauri Assessoria Imobiliária: 14 anos em Santarém, no Pará, e mais de 3.500 imóveis vendidos. Compra e venda com atendimento direto do corretor Amauri Nobre.",
  caminho: "/sobre",
});

export default async function Sobre() {
  const [config, facetas] = await Promise.all([getConfig(), getFacetas()]);
  const whatsapp = linkWhatsApp(config.contato);

  return (
    <>
      <SiteHeader />

      <main>
        <section className="container-site py-16 lg:py-24">
          <Revela>
            <h1 className="texto-grad max-w-[20ch] text-balance font-titulo text-display-sm lg:text-display-lg">
              Uma imobiliária que Santarém confia há{" "}
              <span className="destaque">{config.sobre.anos_atuacao} anos</span>
            </h1>
          </Revela>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="space-y-5 text-pretty leading-relaxed text-fg-muted">
              <p>{config.sobre.apresentacao}</p>
              <p>{config.sobre.compromisso}</p>
              <p>
                A assessoria atua em Santarém, no Pará, na compra e na venda de
                casas, apartamentos, terrenos e lotes em condomínio. O
                atendimento é direto com o corretor Amauri Nobre, pelo WhatsApp,
                do primeiro contato à entrega das chaves.
              </p>
            </div>

            <dl className="divide-y divide-border-base border-y border-border-base">
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Anos de atuação</dt>
                <dd className="numeros font-titulo text-2xl">
                  {config.sobre.anos_atuacao}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Imóveis vendidos</dt>
                <dd className="numeros font-titulo text-2xl">
                  {config.sobre.imoveis_vendidos}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Imóveis no site agora</dt>
                <dd className="numeros font-titulo text-2xl">{facetas.total}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Registro profissional</dt>
                <dd className="numeros text-base">CRECI {config.contato.creci}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Atendimento</dt>
                <dd className="numeros text-base">
                  {config.contato.telefone_exibicao}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="campo-tinta linha-encontro">
          <div className="container-site max-w-2xl py-16 lg:py-24">
            <h2 className="texto-gelo text-balance font-titulo text-display-sm">
              Procura algo que <span className="destaque">não está no site?</span>
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
              Deixe seu WhatsApp. Quando entrar um imóvel com o perfil que você
              procura, você é avisado primeiro.
            </p>
            <div className="mt-8">
              <LeadForm origem="sobre" />
            </div>
          </div>
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
