import type { Metadata } from "next";

import type { Contato } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { urlDaMidia } from "@/lib/midia";
import { formatPreco } from "@/lib/utils";

/**
 * Tudo que descreve o site para quem não é gente: buscadores e assistentes de
 * IA. Os dados vêm das mesmas fontes que o visitante vê (configurações e
 * banco), então não há um texto "para o Google" que possa divergir do real.
 */

export const NOME = "Amauri Assessoria Imobiliária";

export const DESCRICAO_PADRAO =
  "Casas, apartamentos e terrenos de alto padrão em Santarém, no Pará. " +
  "Assessoria na compra e na venda do seu imóvel.";

/** URL absoluta: dado estruturado e Open Graph não aceitam caminho relativo. */
export function absoluta(caminho: string) {
  return /^https?:\/\//.test(caminho) ? caminho : `${siteUrl}${caminho}`;
}

/** Foto do Storage → URL absoluta pelo /midia, que tem cache longo. */
export function imagemAbsoluta(url: string) {
  return absoluta(urlDaMidia(url));
}

export const ID_ORGANIZACAO = `${siteUrl}/#organizacao`;
export const ID_SITE = `${siteUrl}/#site`;
export const ID_AMAURI = `${siteUrl}/#amauri`;

/** A empresa, o corretor responsável e o site, ligados por @id. */
export function grafoDoSite(contato: Contato) {
  const telefone = `+${contato.whatsapp.replace(/\D/g, "")}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        "@id": ID_ORGANIZACAO,
        name: NOME,
        url: siteUrl,
        logo: absoluta("/logo-amauri.png"),
        image: absoluta("/og.jpg"),
        description: DESCRICAO_PADRAO,
        telephone: telefone,
        email: contato.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Santarém",
          addressRegion: "PA",
          addressCountry: "BR",
        },
        areaServed: {
          "@type": "City",
          name: "Santarém",
          containedInPlace: { "@type": "AdministrativeArea", name: "Pará" },
        },
        identifier: { "@type": "PropertyValue", name: "CRECI", value: contato.creci },
        sameAs: [contato.instagram],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "atendimento",
          telephone: telefone,
          availableLanguage: "pt-BR",
        },
        employee: { "@id": ID_AMAURI },
      },
      {
        "@type": "Person",
        "@id": ID_AMAURI,
        name: "Amauri Nobre",
        jobTitle: "Corretor de imóveis",
        image: absoluta("/amauri-retrato.webp"),
        worksFor: { "@id": ID_ORGANIZACAO },
        url: absoluta("/sobre"),
      },
      {
        "@type": "WebSite",
        "@id": ID_SITE,
        url: siteUrl,
        name: NOME,
        inLanguage: "pt-BR",
        publisher: { "@id": ID_ORGANIZACAO },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/imoveis?busca={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function migalhas(itens: { nome: string; caminho: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      item: absoluta(item.caminho),
    })),
  };
}

/* ------------------------------------------------------------- imóveis */

export type ImovelSeo = {
  slug: string;
  ref: string;
  titulo: string;
  tipo: string;
  bairro: string | null;
  cidade: string;
  uf?: string | null;
  endereco?: string | null;
  descricao?: string | null;
  meta_description?: string | null;
  preco: number | null;
  listing?: string | null;
  dormitorios: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area_total: number | null;
  area_privativa: number | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  imagens?: { url: string }[] | null;
};

/** Frase curta e factual: o que é, quanto tem, onde fica e quanto custa. */
export function descricaoDoImovel(i: ImovelSeo) {
  if (i.meta_description) return i.meta_description;

  const partes = [
    i.dormitorios ? `${i.dormitorios} ${i.dormitorios === 1 ? "quarto" : "quartos"}` : null,
    i.suites ? `${i.suites} ${i.suites === 1 ? "suíte" : "suítes"}` : null,
    i.vagas ? `${i.vagas} ${i.vagas === 1 ? "vaga" : "vagas"}` : null,
  ].filter(Boolean);

  const onde = [i.bairro, i.cidade].filter(Boolean).join(", ");
  const base = `${i.tipo}${partes.length ? ` com ${partes.join(", ")}` : ""} em ${onde}.`;
  return `${base} ${formatPreco(i.preco)}. Referência ${i.ref}.`;
}

function tipoSchema(tipo: string) {
  const t = tipo.toLowerCase();
  if (t.includes("apartamento")) return "Apartment";
  if (t.includes("casa")) return "SingleFamilyResidence";
  if (t.includes("terreno")) return "Place";
  return "Accommodation";
}

export function anuncioDoImovel(
  i: ImovelSeo,
  caracteristicas: { nome: string }[] = [],
) {
  const url = absoluta(`/imoveis/${i.slug}`);
  const area = i.area_privativa ?? i.area_total;
  const terreno = tipoSchema(i.tipo) === "Place";

  const sobre: Record<string, unknown> = {
    "@type": tipoSchema(i.tipo),
    name: i.titulo,
    address: {
      "@type": "PostalAddress",
      streetAddress: i.endereco || undefined,
      addressLocality: i.cidade,
      addressRegion: i.uf || "PA",
      addressCountry: "BR",
    },
    geo:
      i.latitude && i.longitude
        ? { "@type": "GeoCoordinates", latitude: i.latitude, longitude: i.longitude }
        : undefined,
  };

  if (!terreno) {
    sobre.numberOfBedrooms = i.dormitorios ?? undefined;
    sobre.numberOfBathroomsTotal = i.banheiros ?? undefined;
    sobre.amenityFeature = caracteristicas.length
      ? caracteristicas.map((c) => ({
          "@type": "LocationFeatureSpecification",
          name: c.nome,
          value: true,
        }))
      : undefined;
  }
  if (area) {
    sobre.floorSize = { "@type": "QuantitativeValue", value: area, unitCode: "MTK" };
  }

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#anuncio`,
    url,
    name: i.titulo,
    description: i.descricao?.replace(/\s+/g, " ").trim().slice(0, 500) || descricaoDoImovel(i),
    identifier: { "@type": "PropertyValue", name: "Referência", value: i.ref },
    inLanguage: "pt-BR",
    datePosted: i.created_at ?? undefined,
    dateModified: i.updated_at ?? undefined,
    image: (i.imagens ?? []).slice(0, 8).map((f) => imagemAbsoluta(f.url)),
    about: sobre,
    // Sem preço, não há oferta: Offer sem price é inválido.
    offers: i.preco
      ? {
          "@type": "Offer",
          price: i.preco,
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          businessFunction:
            i.listing === "aluguel"
              ? "http://purl.org/goodrelations/v1#LeaseOut"
              : "http://purl.org/goodrelations/v1#Sell",
          url,
          seller: { "@id": ID_ORGANIZACAO },
        }
      : undefined,
    provider: { "@id": ID_ORGANIZACAO },
  };
}

/* ------------------------------------------------------------- metadados */

/**
 * Open Graph e Twitter de uma página. Next substitui o bloco openGraph
 * inteiro quando a página define o seu, então cada página precisa refazer
 * o básico (site, idioma) em vez de herdar.
 */
export function metaPagina({
  titulo,
  descricao,
  caminho,
  imagem,
  tipo = "website",
  publicadoEm,
}: {
  titulo: string;
  descricao: string;
  caminho: string;
  imagem?: string | null;
  tipo?: "website" | "article";
  publicadoEm?: string | null;
}): Metadata {
  // 1200×630 é o tamanho da imagem padrão. Foto de imóvel ou capa de texto tem
  // outra proporção, e declarar medida errada faz alguns apps cortarem ou
  // recusarem a prévia: nesses casos a medida fica de fora.
  const imagens = imagem
    ? [{ url: imagem, alt: titulo }]
    : [{ url: absoluta("/og.jpg"), width: 1200, height: 630, alt: titulo }];

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: tipo,
      locale: "pt_BR",
      siteName: NOME,
      title: titulo,
      description: descricao,
      url: absoluta(caminho),
      images: imagens,
      ...(tipo === "article" && publicadoEm ? { publishedTime: publicadoEm } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descricao,
      images: imagens.map((i) => i.url),
    },
  };
}
