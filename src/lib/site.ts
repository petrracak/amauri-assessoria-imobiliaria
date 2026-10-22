/** Endereço público do site, sem barra no fim. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.amaurinobre.com.br"
).replace(/\/$/, "");

/**
 * Endereço de teste da Vercel, enquanto o domínio próprio não aponta.
 *
 * Enquanto for temporário, o site fica fora dos buscadores: se o Google
 * indexar este endereço, depois da troca o conteúdo concorre com ele mesmo
 * e o link antigo continua aparecendo na busca.
 *
 * Isto se resolve sozinho — ao apontar o domínio e trocar
 * NEXT_PUBLIC_SITE_URL, a indexação volta a ser liberada.
 */
export const ehEnderecoTemporario = /\.vercel\.app$/i.test(
  new URL(siteUrl).hostname,
);
