/**
 * Acesso por nome.
 *
 * O Supabase Auth exige um e-mail. Para quem entra por nome, derivamos um
 * endereço a partir do apelido — ele nunca recebe mensagem, serve só de
 * identificador. A conversão é a mesma na criação e no login, então não há
 * consulta ao banco para descobrir quem é quem.
 *
 * Como esse endereço não recebe e-mail, recuperar a senha dessas contas é
 * trabalho do administrador, pelo painel.
 */
export const DOMINIO_EQUIPE = "equipe.amaurinobre.com.br";

/** "Maria Souza" -> "maria.souza" */
export function apelidoDe(nome: string) {
  return nome
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

export function apelidoParaEmail(apelido: string) {
  return `${apelido}@${DOMINIO_EQUIPE}`;
}

/** Aceita "Maria Souza", "maria.souza" ou um e-mail de verdade. */
export function loginParaEmail(entrada: string) {
  const limpo = entrada.trim();
  if (limpo.includes("@")) return limpo.toLowerCase();
  return apelidoParaEmail(apelidoDe(limpo));
}

/** Endereço derivado não serve para falar com a pessoa. */
export function ehEmailDerivado(email: string | null | undefined) {
  return Boolean(email?.toLowerCase().endsWith(`@${DOMINIO_EQUIPE}`));
}
