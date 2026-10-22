import type { MetadataRoute } from "next";

import { ehEnderecoTemporario, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (ehEnderecoTemporario) {
    // Link de demonstração: fora dos buscadores até o domínio apontar.
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // O painel e o retorno do login não têm nada a indexar.
      disallow: ["/admin", "/admin/", "/auth/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
