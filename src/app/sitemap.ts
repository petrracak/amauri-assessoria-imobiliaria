import type { MetadataRoute } from "next";

import { getImoveis } from "@/lib/queries";

export const revalidate = 3600;

const base = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.amaurinobre.com.br"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contato`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const imoveis = await getImoveis({}, 500);
    return [
      ...fixas,
      ...imoveis.map((imovel) => ({
        url: `${base}/imoveis/${imovel.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Sem banco, o sitemap sai só com as páginas fixas em vez de quebrar.
    return fixas;
  }
}
