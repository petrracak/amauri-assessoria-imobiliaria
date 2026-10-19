import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { PropertyCard } from "@/components/site/property-card";
import { getFacetas, getImoveis } from "@/lib/queries";
import { getConfig, linkWhatsApp } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Imóveis à venda em Santarém",
  description:
    "Casas, apartamentos e terrenos à venda em Santarém, no Pará, com assessoria completa da Amauri.",
};

type Params = Promise<Record<string, string | string[] | undefined>>;

function umValor(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Pílula de filtro: some do DOM quando já está aplicada em outra direção. */
function Pilula({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
        ativo
          ? "border-accent bg-accent text-accent-fg"
          : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

export default async function Imoveis({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const tipo = umValor(params.tipo);
  const bairro = umValor(params.bairro);
  const busca = umValor(params.busca);

  const [config, facetas, imoveis] = await Promise.all([
    getConfig(),
    getFacetas(),
    getImoveis({ tipo, bairro, busca }),
  ]);

  const whatsapp = linkWhatsApp(config.contato);

  const comFiltro = (chave: string, valor?: string) => {
    const p = new URLSearchParams();
    if (tipo && chave !== "tipo") p.set("tipo", tipo);
    if (bairro && chave !== "bairro") p.set("bairro", bairro);
    if (busca) p.set("busca", busca);
    if (valor) p.set(chave, valor);
    const q = p.toString();
    return q ? `/imoveis?${q}` : "/imoveis";
  };

  return (
    <>
      <Header whatsapp={whatsapp} />

      <main className="container-site py-12 lg:py-16">
        <h1 className="font-display text-display-sm lg:text-display-md">
          {busca
            ? `Resultados para “${busca}”`
            : bairro
              ? `Imóveis em ${bairro}`
              : tipo
                ? tipo
                : "Imóveis à venda em Santarém"}
        </h1>

        <p className="numeros mt-3 text-sm text-fg-muted">
          {imoveis.length} {imoveis.length === 1 ? "imóvel" : "imóveis"}
          {imoveis.length !== facetas.total && !busca ? ` de ${facetas.total}` : ""}
        </p>

        <div className="mt-8 space-y-3">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
            <Pilula href={comFiltro("tipo")} ativo={!tipo}>
              Todos os tipos
            </Pilula>
            {facetas.tipos.map(({ nome, total }) => (
              <Pilula key={nome} href={comFiltro("tipo", nome)} ativo={tipo === nome}>
                {nome} <span className="numeros opacity-60">{total}</span>
              </Pilula>
            ))}
          </div>

          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
            <Pilula href={comFiltro("bairro")} ativo={!bairro}>
              Todos os bairros
            </Pilula>
            {facetas.bairros.map(({ nome, total }) => (
              <Pilula
                key={nome}
                href={comFiltro("bairro", nome)}
                ativo={bairro === nome}
              >
                <span className="capitalize">{nome}</span>{" "}
                <span className="numeros opacity-60">{total}</span>
              </Pilula>
            ))}
          </div>
        </div>

        {imoveis.length > 0 ? (
          <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {imoveis.map((imovel, i) => (
              <PropertyCard key={imovel.id} imovel={imovel} prioridade={i < 3} />
            ))}
          </div>
        ) : (
          <div className="mt-16 border-t border-border-base pt-10">
            <p className="font-display text-2xl">Nada encontrado com esse filtro.</p>
            <p className="mt-3 max-w-[48ch] text-pretty leading-relaxed text-fg-muted">
              Tente outro bairro ou tipo de imóvel. Se procura algo específico,
              fale direto com o Amauri — boa parte do estoque de alto padrão não
              chega a ser anunciado.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/imoveis"
                className="rounded-full border border-border-strong px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent"
              >
                Limpar filtros
              </Link>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-accent px-5 py-2.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
              >
                Falar com Amauri
              </a>
            </div>
          </div>
        )}
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
