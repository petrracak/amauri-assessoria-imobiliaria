import { FAIXAS_PRECO } from "@/lib/queries";

/**
 * Interpreta a frase da busca em filtros.
 *
 * Em vez de mandar a frase para uma IA — com custo por consulta, espera e
 * chance de errar — ela é lida contra o vocabulário do próprio site: os
 * tipos e bairros vêm do banco, então bairro novo passa a ser entendido
 * sozinho.
 *
 * "3 quartos na aparecida até 1 milhão" vira
 * { dormitorios: 3, bairro: "Aparecida", precoMax: 1000000 }
 *
 * O que não for reconhecido continua como texto livre e cai na busca por
 * palavra que já existia.
 */
export type BuscaInterpretada = {
  tipo?: string;
  bairro?: string;
  dormitorios?: number;
  suites?: number;
  vagas?: number;
  precoMin?: number;
  precoMax?: number;
  ref?: string;
  texto?: string;
  /** Para mostrar à pessoa o que foi entendido. */
  entendido: { chave: string; rotulo: string }[];
};

function normalizar(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** "1,5 milhão" | "800 mil" | "750000" -> número */
function valorEmReais(quantia: string, unidade?: string): number | null {
  const n = Number(quantia.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;

  const u = normalizar(unidade ?? "");
  if (u.startsWith("milha") || u.startsWith("mi")) return Math.round(n * 1_000_000);
  if (u.startsWith("mil")) return Math.round(n * 1_000);
  return Math.round(n);
}

export function interpretarBusca(
  frase: string,
  vocabulario: { tipos: string[]; bairros: string[] },
): BuscaInterpretada {
  const resultado: BuscaInterpretada = { entendido: [] };
  let resto = ` ${normalizar(frase)} `;

  const consumir = (trecho: string) => {
    resto = resto.replace(trecho, " ");
  };

  // ---------------------------------------------------------- referência
  const ref = resto.match(/[#\s](?:ref\.?\s*)?(\d{1,3})\s*(?=$|\s)/);
  if (/#\s*\d/.test(resto) || /\bref\b/.test(resto)) {
    if (ref) {
      resultado.ref = String(Number(ref[1]));
      resultado.entendido.push({ chave: "ref", rotulo: `ref. ${resultado.ref}` });
      consumir(ref[0]);
    }
  }

  // -------------------------------------------------------------- preço
  const ate = resto.match(
    /(?:ate|abaixo de|no maximo|max)\s+(?:r\$\s*)?([\d.,]+)\s*(milhao|milhoes|mi|mil)?/,
  );
  if (ate) {
    const v = valorEmReais(ate[1], ate[2]);
    if (v) {
      resultado.precoMax = v;
      resultado.entendido.push({ chave: "precoMax", rotulo: `até ${reais(v)}` });
      consumir(ate[0]);
    }
  }

  const acima = resto.match(
    /(?:acima de|a partir de|mais de|minimo)\s+(?:r\$\s*)?([\d.,]+)\s*(milhao|milhoes|mi|mil)?/,
  );
  if (acima) {
    const v = valorEmReais(acima[1], acima[2]);
    if (v) {
      resultado.precoMin = v;
      resultado.entendido.push({ chave: "precoMin", rotulo: `acima de ${reais(v)}` });
      consumir(acima[0]);
    }
  }

  // ------------------------------------------------------------ números
  const quantidades: [RegExp, keyof BuscaInterpretada, (n: number) => string][] = [
    [/(\d+)\s*(?:quartos?|dormitorios?|dorms?)/, "dormitorios", (n) =>
      `${n} ${n === 1 ? "quarto" : "quartos"}`],
    [/(\d+)\s*suites?/, "suites", (n) => `${n} ${n === 1 ? "suíte" : "suítes"}`],
    [/(\d+)\s*(?:vagas?|garagens?)/, "vagas", (n) =>
      `${n} ${n === 1 ? "vaga" : "vagas"}`],
  ];

  for (const [padrao, chave, rotular] of quantidades) {
    const m = resto.match(padrao);
    if (m) {
      const n = Number(m[1]);
      if (n > 0 && n < 20) {
        (resultado[chave] as number) = n;
        resultado.entendido.push({ chave, rotulo: rotular(n) });
        consumir(m[0]);
      }
    }
  }

  // --------------------------------------------------------------- tipo
  // Do mais específico ao mais genérico: "casa em condomínio" antes de
  // "casa", senão a primeira palavra venceria sempre.
  const tiposOrdenados = [...vocabulario.tipos].sort(
    (a, b) => b.length - a.length,
  );
  for (const tipo of tiposOrdenados) {
    const alvo = normalizar(tipo);
    if (resto.includes(alvo)) {
      resultado.tipo = tipo;
      resultado.entendido.push({ chave: "tipo", rotulo: tipo });
      consumir(alvo);
      break;
    }
    // Plural comum: "casas", "apartamentos"
    if (resto.includes(`${alvo}s`)) {
      resultado.tipo = tipo;
      resultado.entendido.push({ chave: "tipo", rotulo: tipo });
      consumir(`${alvo}s`);
      break;
    }
  }

  // ------------------------------------------------------------- bairro
  const bairrosOrdenados = [...vocabulario.bairros].sort(
    (a, b) => b.length - a.length,
  );
  for (const bairro of bairrosOrdenados) {
    const alvo = normalizar(bairro);
    if (alvo.length >= 4 && resto.includes(alvo)) {
      resultado.bairro = bairro;
      resultado.entendido.push({ chave: "bairro", rotulo: bairro });
      consumir(alvo);
      break;
    }
  }

  // ---------------------------------------------------------- sobra
  const palavrasVazias = new Set([
    "de", "do", "da", "em", "no", "na", "com", "para", "pra", "e", "a", "o",
    "os", "as", "um", "uma", "imovel", "imoveis", "quero", "procuro", "r$",
  ]);

  const sobra = resto
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2 && !palavrasVazias.has(p))
    .join(" ");

  if (sobra) resultado.texto = sobra;

  return resultado;
}

function reais(valor: number) {
  if (valor >= 1_000_000) {
    const mi = valor / 1_000_000;
    return `R$ ${mi % 1 === 0 ? mi : mi.toFixed(1).replace(".", ",")} ${
      mi === 1 ? "milhão" : "milhões"
    }`;
  }
  return `R$ ${Math.round(valor / 1000)} mil`;
}

/** Faixa pronta que mais se aproxima do intervalo interpretado. */
export function faixaEquivalente(min?: number, max?: number) {
  if (min === undefined && max === undefined) return undefined;
  return FAIXAS_PRECO.find(
    (f) => f.min === (min ?? 0) && (f.max ?? null) === (max ?? null),
  )?.chave;
}
