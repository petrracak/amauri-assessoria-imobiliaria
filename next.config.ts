import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

/**
 * Cabeçalhos de segurança de toda resposta.
 *
 * A CSP leva só as diretivas que não dependem de saber de onde vêm os
 * scripts. Os pixels (Meta, Google, GTM) são configurados no painel, e o GTM
 * pode puxar outros domínios; uma script-src fechada quebraria o rastreio
 * sem aviso. Estas diretivas já impedem o que importa aqui: o site ser
 * embutido em página de terceiros (clique enganoso), <base> forjado e
 * formulário enviado para fora.
 */
const SEGURANCA = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'; upgrade-insecure-requests",
  },
];

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
  async headers() {
    return [
      { source: "/:path*", headers: SEGURANCA },
      // Arquivos de public/ não têm hash no nome. Um dia fresco e uma semana
      // servindo o antigo enquanto confere: trocar o banner aparece no dia
      // seguinte, e quem volta ao site não rebaixa o logo toda vez.
      {
        source: "/:arquivo((?!_next|midia).*\\.(?:webp|png|jpg|jpeg|svg|ico|avif))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
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
