import type { MetadataRoute } from "next";

import { getPosts } from "@/lib/blog";
import { imagemAbsoluta } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

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
    const supabase = createPublicClient();
    const [{ data: imoveis, error }, posts] = await Promise.all([
      supabase
        .from("properties")
        .select("slug, updated_at, imagens:property_images (url, ordem)")
        .eq("status", "publicado")
        .order("updated_at", { ascending: false })
        .limit(500),
      getPosts(500),
    ]);
    if (error) throw error;

    return [
      ...fixas,
      ...(imoveis ?? []).map((imovel) => ({
        url: `${base}/imoveis/${imovel.slug}`,
        // A data real da última edição: é o que diz ao buscador e às IAs
        // quando vale voltar a ler a página.
        lastModified: new Date(imovel.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: [...(imovel.imagens ?? [])]
          .sort((a, b) => a.ordem - b.ordem)
          .slice(0, 5)
          .map((foto) => imagemAbsoluta(foto.url)),
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
