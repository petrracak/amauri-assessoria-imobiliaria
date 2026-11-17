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

/**
 * A mesma coordenada, em número, para gravar no banco e desenhar o pino no
 * mapa interno. Fora da faixa possível é lixo — link estranho ou regex que
 * pegou outro número do endereço — e vale mais não ter pino do que ter um
 * pino no meio do oceano.
 */
function paraNumeros(coord: string | null) {
  if (!coord) return { lat: null, lng: null };
  const [lat, lng] = coord.split(",").map(Number);
  const valido =
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return valido ? { lat, lng } : { lat: null, lng: null };
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
  | {
      ok: true;
      url: string | null;
      embed: string | null;
      /** Coordenada do pino, quando o link traz uma. Alimenta o mapa do painel. */
      lat: number | null;
      lng: number | null;
    }
  | { ok: false; erro: string };

const MENSAGEM_INVALIDO =
  "Cole o link do Google Maps (o do botão Compartilhar) ou o código de Incorporar um mapa.";

export async function resolverMapa(entrada: string): Promise<ResultadoMapa> {
  const bruto = extrairEndereco(entrada);
  if (!bruto) return { ok: true, url: null, embed: null, lat: null, lng: null };

  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    return { ok: false, erro: MENSAGEM_INVALIDO };
  }
  if (!hostPermitido(url)) return { ok: false, erro: MENSAGEM_INVALIDO };

  // Já é o endereço de incorporação: vale como está.
  if (url.pathname.startsWith("/maps/embed")) {
    const { lat, lng } = paraNumeros(coordenadas(url.toString()));
    return { ok: true, url: url.toString(), embed: url.toString(), lat, lng };
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
  const { lat, lng } = paraNumeros(coord);

  return {
    ok: true,
    url: url.toString(),
    embed: consulta ? embedPorConsulta(consulta) : null,
    lat,
    lng,
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

/**
 * Rota até o imóvel, no aplicativo que a pessoa já tem.
 *
 * Nada de calcular trajeto aqui: estes endereços abrem o Google Maps ou o
 * Waze já navegando, e no celular caem direto no aplicativo instalado.
 * O Waze aceita um destino por vez — roteiro com várias paradas é no
 * Google Maps.
 */
export function rotaGoogle(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function rotaWaze(lat: number, lng: number) {
  return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

/**
 * Roteiro com várias paradas, numa abertura só do Google Maps.
 *
 * Sem "origin": o aplicativo começa de onde a pessoa está, que é o que
 * ela quer ao sair para a rua. O endereço do Google aceita nove paradas
 * mais o destino — daí o teto.
 */
export const MAX_PARADAS = 10;

export function rotaComParadas(paradas: { lat: number; lng: number }[]) {
  if (paradas.length === 0) return null;
  if (paradas.length === 1) return rotaGoogle(paradas[0].lat, paradas[0].lng);

  const lista = paradas.slice(0, MAX_PARADAS);
  const destino = lista[lista.length - 1];
  const meio = lista
    .slice(0, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");

  return (
    `https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}` +
    `&waypoints=${encodeURIComponent(meio)}&travelmode=driving`
  );
}

/** Distância aproximada em quilômetros entre dois pontos. */
function distancia(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Põe as paradas na ordem do vizinho mais próximo, partindo da primeira
 * que a pessoa escolheu.
 *
 * Não é a rota ótima — isso é problema do caixeiro viajante, e o Google
 * não aceita "otimizar" pelo endereço. Mas resolve o que importa num dia
 * de instalação de placas: não atravessar a cidade duas vezes.
 */
export function ordenarPorProximidade<T extends { lat: number; lng: number }>(
  pontos: T[],
): T[] {
  if (pontos.length <= 2) return [...pontos];

  const restantes = [...pontos];
  const ordem: T[] = [restantes.shift()!];

  while (restantes.length) {
    const ultimo = ordem[ordem.length - 1];
    let melhor = 0;
    for (let i = 1; i < restantes.length; i++) {
      if (distancia(ultimo, restantes[i]) < distancia(ultimo, restantes[melhor])) {
        melhor = i;
      }
    }
    ordem.push(restantes.splice(melhor, 1)[0]);
  }

  return ordem;
}

/**
 * Abre o Google Maps já procurando por este imóvel.
 *
 * É o primeiro passo de quem vai pegar o link: procura, acha o prédio,
 * toca em Compartilhar e cola de volta no cadastro. Poupa digitar o
 * endereço de novo no celular.
 */
export function buscaNoMaps(termos: (string | null | undefined)[]) {
  const consulta = termos.map((t) => t?.trim()).filter(Boolean).join(", ");
  return consulta
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`
    : null;
}

/** Rota a partir de um endereço escrito, para quem não tem coordenada. */
export function rotaGooglePorEndereco(endereco: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}&travelmode=driving`;
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
