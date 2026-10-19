import type { Metadata } from "next";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { LeadForm } from "@/components/site/lead-form";
import { getConfig, linkWhatsApp } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Amauri Assessoria Imobiliária em Santarém, no Pará, pelo WhatsApp ou e-mail.",
};

export default async function Contato() {
  const config = await getConfig();
  const whatsapp = linkWhatsApp(config.contato);

  return (
    <>
      <Header whatsapp={whatsapp} />

      <main className="container-site py-16 lg:py-24">
        <h1 className="max-w-[18ch] text-balance font-display text-display-sm lg:text-display-lg">
          Fale com a assessoria
        </h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="max-w-[46ch] text-pretty leading-relaxed text-fg-muted">
              O caminho mais rápido é o WhatsApp — é por lá que o atendimento
              acontece, inclusive para enviar fotos e vídeos de imóveis que
              ainda não entraram no site.
            </p>

            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-full bg-accent px-7 py-3.5 text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Abrir conversa no WhatsApp
            </a>

            <dl className="mt-12 divide-y divide-border-base border-y border-border-base">
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Telefone</dt>
                <dd className="numeros">{config.contato.telefone_exibicao}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">E-mail</dt>
                <dd className="break-all text-right">{config.contato.email}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">Instagram</dt>
                <dd>
                  <a
                    href={config.contato.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    @amaurinobrecv
                  </a>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-sm text-fg-muted">CRECI</dt>
                <dd className="numeros">{config.contato.creci}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-border-base pt-10 lg:border-l lg:border-t-0 lg:pl-20 lg:pt-0">
            <h2 className="font-display text-2xl">Prefere ser chamado?</h2>
            <p className="mt-3 text-pretty leading-relaxed text-fg-muted">
              Deixe seu nome e WhatsApp que a equipe entra em contato.
            </p>
            <div className="mt-8">
              <LeadForm origem="contato" />
            </div>
          </div>
        </div>
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
