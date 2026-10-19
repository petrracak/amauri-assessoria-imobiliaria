import type { MetadataRoute } from "next";

const base = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.amaurinobre.com.br"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // O painel e o retorno do login não têm nada a indexar.
      disallow: ["/admin", "/admin/", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
