import type { Metadata } from "next";

import { Footer } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/site-header";
import { getConfig, linkWhatsApp } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "Como a Amauri Assessoria Imobiliária trata os dados de quem visita o site.",
  robots: { index: false, follow: true },
};

export default async function Privacidade() {
  const config = await getConfig();
  const whatsapp = linkWhatsApp(config.contato);

  return (
    <>
      <SiteHeader />

      <main className="container-site py-16 lg:py-24">
        <h1 className="max-w-[20ch] text-balance font-display text-display-sm lg:text-display-lg">
          Como tratamos seus dados
        </h1>

        <div className="mt-12 max-w-[68ch] space-y-10 text-pretty leading-relaxed text-fg-muted">
          <section>
            <h2 className="font-display text-2xl text-fg">O que guardamos</h2>
            <p className="mt-4">
              Se você preencher o formulário do site, guardamos apenas o que
              você escreveu: nome e WhatsApp, mais o imóvel que estava vendo, se
              houver. Esses dados servem para a equipe entrar em contato sobre
              imóveis — nada além disso.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-fg">Cookies</h2>
            <p className="mt-4">
              O site só carrega ferramentas de medição e de anúncio depois que
              você aceita. Se recusar, nada de rastreio é carregado e a
              navegação continua igual. A sua escolha fica guardada no próprio
              navegador e pode ser trocada limpando os dados do site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-fg">
              Com quem compartilhamos
            </h2>
            <p className="mt-4">
              Com ninguém, para fins comerciais. Os dados ficam em serviços que
              hospedam o site e o banco de dados, usados apenas para ele
              funcionar.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-fg">Seus direitos</h2>
            <p className="mt-4">
              Pela Lei Geral de Proteção de Dados, você pode pedir para ver,
              corrigir ou apagar seus dados a qualquer momento. Basta escrever
              para{" "}
              <a
                href={`mailto:${config.contato.email}`}
                className="text-accent underline underline-offset-4"
              >
                {config.contato.email}
              </a>{" "}
              ou chamar no WhatsApp{" "}
              <span className="numeros">{config.contato.telefone_exibicao}</span>.
              A remoção é feita e confirmada para você.
            </p>
          </section>
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
