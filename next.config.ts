import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  // As páginas públicas usam ISR por rota (revalidate), que é previsível com
  // dados vindos do Supabase. Sem cacheComponents, que exigiria Suspense em
  // cada leitura; partialPrefetching depende dele, então também fica fora.
  images: {
    // O otimizador da Vercel tem cota no plano free e estourou com as fotos
    // da importação, devolvendo 402. As fotos já são guardadas em WebP e em
    // dois tamanhos no Storage, então o carregador só escolhe qual servir.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Cache de navegação no aparelho. Páginas do painel prefetchadas
    // (prefetch={true}) valem por static; as visitadas valem por dynamic.
    // Toda alteração feita pelo painel limpa isso (revalidatePath no layout
    // /admin), então o cache nunca mostra o que a própria pessoa acabou de
    // mudar; só um lead novo vindo do site pode demorar até 1 minuto.
    staleTimes: { dynamic: 30, static: 60 },
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
