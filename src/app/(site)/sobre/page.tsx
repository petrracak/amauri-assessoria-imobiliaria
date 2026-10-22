import type { Metadata } from "next";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { LeadForm } from "@/components/site/lead-form";
import { getFacetas } from "@/lib/queries";
import { getConfig, linkWhatsApp } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sobre a assessoria",
  description:
    "Amauri Nobre, corretor em Santarém, no Pará. Assessoria na compra e na venda de imóveis de alto padrão.",
};

export default async function Sobre() {
  const [config, facetas] = await Promise.all([getConfig(), getFacetas()]);
  const whatsapp = linkWhatsApp(config.contato);

  return (
    <>
      <Header whatsapp={whatsapp} />

      <main>
        <section className="container-site py-16 lg:py-24">
          <h1 className="max-w-[20ch] text-balance font-display text-display-sm lg:text-display-lg">
            Comprar imóvel não é escolher foto bonita
          </h1>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <div className="space-y-5 text-pretty leading-relaxed text-fg-muted">
              <p>
                A Amauri Assessoria Imobiliária trabalha em Santarém com um
                recorte claro: imóveis de alto padrão, acompanhados de perto do
                primeiro contato até a escritura.
              </p>
              <p>
                Cada imóvel do catálogo foi visitado. A ficha diz a metragem
                real, o que está incluso e o que não está, e o que falta
                resolver na documentação antes de fechar. Quando algo não serve
                para quem procura, o certo é dizer — vale mais que vender
                depressa.
              </p>
              <p>
                O estoque muda rápido e nem tudo chega a ser anunciado. Se você
                procura algo específico, é mais rápido falar direto.
              </p>
            </div>

            <dl className="divide-y divide-border-base border-y border-border-base">
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Imóveis no catálogo</dt>
                <dd className="numeros font-display text-2xl">{facetas.total}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Bairros atendidos</dt>
                <dd className="numeros font-display text-2xl">
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
            <h2 className="text-balance font-display text-display-sm">
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
