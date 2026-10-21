import type { MetadataRoute } from "next";

/**
 * Manifesto do site público. O painel tem o seu em /painel.webmanifest,
 * declarado no layout de /admin — assim, quem instala estando no painel
 * ganha um app que abre direto nele.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amauri Assessoria Imobiliária",
    short_name: "Amauri",
    description:
      "Imóveis de alto padrão em Santarém, no Pará, com assessoria na compra e na venda.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["business", "lifestyle"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Ver imóveis",
        short_name: "Imóveis",
        url: "/imoveis",
        icons: [{ src: "/icone-192.png", sizes: "192x192" }],
      },
    ],
  };
}
