import type { MetadataRoute } from "next";

import { ehEnderecoTemporario, siteUrl } from "@/lib/site";

/**
 * Robôs de assistentes de IA e de busca com IA. Citados um a um, de
 * propósito: quem decide se o site pode ser lido e recomendado por eles é
 * este arquivo, e a regra geral "*" não deixa essa intenção explícita.
 */
const ROBOS_DE_IA = [
  "GPTBot", // OpenAI: treino
  "OAI-SearchBot", // OpenAI: busca do ChatGPT
  "ChatGPT-User", // OpenAI: quando alguém pede para o ChatGPT abrir a página
  "ClaudeBot", // Anthropic
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended", // Gemini
  "Applebot-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  if (ehEnderecoTemporario) {
    // Link de demonstração: fora dos buscadores até o domínio apontar.
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  // O painel e o retorno do login não têm nada a indexar. As listas de
  // favoritos são pessoais.
  const disallow = ["/admin", "/admin/", "/auth/", "/favoritos"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: ROBOS_DE_IA, allow: "/", disallow },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
