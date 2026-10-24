/** Limite de imóveis numa lista salva ou compartilhada. */
export const LIMITE_FAVORITOS = 40;

/**
 * Referências vindas do endereço, para o link compartilhado.
 *
 * Fica fora do módulo de favoritos, que é só do cliente: a página lê isto
 * no servidor e passa como prop. Função pura, sem navegador.
 */
export function lerRefsDaUrl(valor: string | null | undefined) {
  if (!valor) return [];
  return valor
    .split(",")
    .map((r) => r.trim())
    .filter((r) => /^\d{1,4}$/.test(r))
    .slice(0, LIMITE_FAVORITOS);
}
