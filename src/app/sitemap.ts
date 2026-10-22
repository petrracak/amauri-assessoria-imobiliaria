import type { MetadataRoute } from "next";

import { getPosts } from "@/lib/blog";
import { getImoveis } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const base = siteUrl;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contato`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [imoveis, posts] = await Promise.all([getImoveis({}, 500), getPosts(500)]);
    return [
      ...fixas,
      ...imoveis.map((imovel) => ({
        url: `${base}/imoveis/${imovel.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...posts.map((post) => ({
        url: `${base}/blog/${post.slug}`,
        lastModified: post.publicado_em ? new Date(post.publicado_em) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Sem banco, o sitemap sai só com as páginas fixas em vez de quebrar.
    return fixas;
  }
}
