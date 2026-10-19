import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  // As páginas públicas usam ISR por rota (revalidate), que é previsível com
  // dados vindos do Supabase. Sem cacheComponents, que exigiria Suspense em
  // cada leitura; partialPrefetching depende dele, então também fica fora.
  images: {
    // AVIF primeiro: as fotos de imóvel são o peso da página no celular.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
