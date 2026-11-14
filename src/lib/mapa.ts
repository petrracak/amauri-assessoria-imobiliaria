/**
 * Transforma o que a equipe cola no campo de mapa em algo que dê para
 * embutir na página.
 *
 * Aceita três coisas:
 *   - o link do botão Compartilhar do Google Maps (maps.app.goo.gl/...);
 *   - o link longo da barra de endereço (google.com/maps/place/...);
 *   - o código inteiro de "Incorporar um mapa" (<iframe src="...">).
 *
 * Link curto não embute: o servidor segue o redirecionamento até o endereço
 * longo, de onde sai a coordenada. Só segue entre hosts do Google — o
 * endereço vem de um campo de texto, e sem essa trava a função seria um
 * jeito de fazer o servidor visitar qualquer lugar.
 */

const HOSTS_GOOGLE = [
  /^(www\.)?google\.com(\.br)?$/,
  /^maps\.google\.com(\.br)?$/,
  /^maps\.app\.goo\.gl$/,
  /^goo\.gl$/,
  /^g\.page$/,
];

const HOSTS_CURTOS = /^(maps\.app\.goo\.gl|goo\.gl|g\.page)$/;

function hostPermitido(u: URL) {
  return u.protocol === "https:" && HOSTS_GOOGLE.some((r) => r.test(u.hostname));
}

/** Se vier o código <iframe>, pega só o src. */
function extrairEndereco(entrada: string) {
  const iframe = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(entrada);
  return (iframe?.[1] ?? entrada).trim().replaceAll("&amp;", "&");
}

/** Coordenada do pino: !3d..!4d.. é o lugar marcado, @lat,lng é o centro da tela. */
function coordenadas(texto: string) {
  let t = texto;
  try {
    t = decodeURIComponent(texto);
  } catch {
    /* segue com o texto cru */
  }
  const pino = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(t);
  if (pino) return `${pino[1]},${pino[2]}`;
  const centro = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(t);
  if (centro) return `${centro[1]},${centro[2]}`;
  return null;
}

/** Texto de busca, quando o link não traz coordenada. */
function consultaDoLink(u: URL) {
  const q = u.searchParams.get("q") ?? u.searchParams.get("query");
  if (q) return q;
  const lugar = /\/maps\/place\/([^/@]+)/.exec(u.pathname);
  if (lugar) {
    try {
      return decodeURIComponent(lugar[1]).replace(/\+/g, " ");
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Endereço de incorporação do Google para uma busca ou coordenada.
 *
 * Este é o endereço final: o antigo "maps?q=...&output=embed" responde com um
 * redirecionamento para cá, e só a resposta final pode ser embutida. Guardar
 * direto poupa uma volta e evita depender do redirecionamento.
 * O "!" separa campos no parâmetro pb e por isso é escapado no texto.
 */
export function embedPorConsulta(consulta: string) {
  const texto = encodeURIComponent(consulta).replace(/!/g, "%21");
  return `https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${texto}!6i17`;
}

export type ResultadoMapa =
  | { ok: true; url: string | null; embed: string | null }
  | { ok: false; erro: string };

const MENSAGEM_INVALIDO =
  "Cole o link do Google Maps (o do botão Compartilhar) ou o código de Incorporar um mapa.";

export async function resolverMapa(entrada: string): Promise<ResultadoMapa> {
  const bruto = extrairEndereco(entrada);
  if (!bruto) return { ok: true, url: null, embed: null };

  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    return { ok: false, erro: MENSAGEM_INVALIDO };
  }
  if (!hostPermitido(url)) return { ok: false, erro: MENSAGEM_INVALIDO };

  // Já é o endereço de incorporação: vale como está.
  if (url.pathname.startsWith("/maps/embed")) {
    return { ok: true, url: url.toString(), embed: url.toString() };
  }

  // Segue o link curto, no máximo 5 saltos, sempre dentro do Google.
  let atual = url;
  for (let i = 0; i < 5 && HOSTS_CURTOS.test(atual.hostname); i++) {
    try {
      const resposta = await fetch(atual, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MapaDoImovel)" },
      });
      const destino = resposta.headers.get("location");
      if (!destino) break;
      const proximo = new URL(destino, atual);
      if (!hostPermitido(proximo)) break;
      atual = proximo;
    } catch {
      break;
    }
  }

  const coord = coordenadas(atual.toString());
  const consulta = coord ?? consultaDoLink(atual);

  return {
    ok: true,
    url: url.toString(),
    embed: consulta ? embedPorConsulta(consulta) : null,
  };
}

/** Só devolve o que for mesmo do Google Maps; usado na hora de desenhar a página. */
export function embedSeguro(embed: string | null | undefined) {
  if (!embed) return null;
  try {
    const u = new URL(embed);
    return u.protocol === "https:" && u.hostname === "www.google.com" && u.pathname.startsWith("/maps")
      ? u.toString()
      : null;
  } catch {
    return null;
  }
}

export function linkSeguro(link: string | null | undefined) {
  if (!link) return null;
  try {
    const u = new URL(link);
    return hostPermitido(u) ? u.toString() : null;
  } catch {
    return null;
  }
}
