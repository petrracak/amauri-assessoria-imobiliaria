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
    "Amauri Nobre, corretor em Santarém, no Pará. Assessoria na compra e na venda de imóveis de alto padrão.",
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
              <span className="destaque">Assessoria</span> imobiliária em Santarém
            </h1>
          </Revela>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="space-y-5 text-pretty leading-relaxed text-fg-muted">
              <p>
                A Amauri Assessoria Imobiliária atua em Santarém, no Pará, na
                compra e na venda de casas, apartamentos e terrenos, com foco
                em imóveis de alto padrão. O responsável é o corretor Amauri
                Nobre.
              </p>
              <p>
                O catálogo traz a ficha de cada imóvel com dormitórios, suítes,
                vagas, metragem e fotos. Para marcar uma visita ou tirar uma
                dúvida, o contato é direto, pelo WhatsApp.
              </p>
            </div>

            <dl className="divide-y divide-border-base border-y border-border-base">
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Imóveis no catálogo</dt>
                <dd className="numeros font-titulo text-2xl">{facetas.total}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Bairros atendidos</dt>
                <dd className="numeros font-titulo text-2xl">
                  {facetas.bairros.length}
                </dd>
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
            <h2 className="text-balance font-titulo text-display-sm">
              Procura algo que não está no site?
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
