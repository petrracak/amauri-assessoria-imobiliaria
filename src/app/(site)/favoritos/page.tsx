import type { Metadata } from "next";

import { Footer } from "@/components/site/footer";
import { ListaFavoritos } from "@/components/site/lista-favoritos";
import { SiteHeader } from "@/components/site/site-header";
import { lerRefsDaUrl } from "@/lib/refs";
import { getImoveis } from "@/lib/queries";
import { getConfig, linkWhatsApp } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Imóveis salvos",
  description: "Os imóveis que você separou para conversar com a Amauri.",
  // Lista pessoal, e o link compartilhado é de uso privado.
  robots: { index: false, follow: true },
};

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function Favoritos({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const refs = lerRefsDaUrl(
    Array.isArray(params.refs) ? params.refs[0] : params.refs,
  );

  // O catálogo inteiro vem do servidor e a filtragem acontece no navegador:
  // a lista mora no aparelho da pessoa e não precisa sair de lá.
  const [config, catalogo] = await Promise.all([getConfig(), getImoveis({}, 200)]);

  return (
    <>
      <SiteHeader />

      <main className="container-site py-12 lg:py-16">
        <h1 className="font-display text-display-sm lg:text-display-md">
          Imóveis salvos
        </h1>
        <p className="mt-3 max-w-[54ch] text-pretty leading-relaxed text-fg-muted">
          Junte os que te interessaram e mande tudo de uma vez — fica mais
          fácil para o Amauri entender o que você procura.
        </p>

        <div className="mt-10">
          <ListaFavoritos
            catalogo={catalogo}
            whatsappNumero={config.contato.whatsapp}
            siteUrl={siteUrl}
            refsCompartilhadas={refs}
          />
        </div>
      </main>

      <Footer
        whatsapp={linkWhatsApp(config.contato)}
        telefone={config.contato.telefone_exibicao}
        instagram={config.contato.instagram}
      />
    </>
  );
}
