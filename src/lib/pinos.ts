/**
 * As cores do mapa da carteira.
 *
 * Ficam aqui, fora do componente, porque a legenda, os filtros e os pinos
 * do Leaflet leem a mesma lista — e um mapa em que a legenda discorda do
 * pino é pior do que mapa nenhum.
 *
 * A ordem é a de quem olha o mapa para trabalhar: primeiro o que falta
 * fazer, por último o que já saiu da carteira.
 */
export const CATEGORIAS = [
  { chave: "sem-placa", rotulo: "Sem placa", cor: "#ef4444" },
  { chave: "pendente", rotulo: "Placa pendente", cor: "#f59e0b" },
  { chave: "com-placa", rotulo: "Com placa", cor: "#10b981" },
  { chave: "negociacao", rotulo: "Em negociação", cor: "#2b6fae" },
  { chave: "fora", rotulo: "Vendidos e alugados", cor: "#8c9cb4" },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["chave"];

/** Começa desligada: senão o mapa vai enchendo de imóvel que já foi embora. */
export const CATEGORIAS_INICIAIS: Categoria[] = [
  "sem-placa",
  "pendente",
  "com-placa",
  "negociacao",
];

export const corDaCategoria = (chave: Categoria) =>
  CATEGORIAS.find((c) => c.chave === chave)?.cor ?? "#8c9cb4";

export const rotuloDaCategoria = (chave: Categoria) =>
  CATEGORIAS.find((c) => c.chave === chave)?.rotulo ?? chave;

/**
 * A situação do negócio manda na cor; a placa só decide entre os que
 * ainda estão disponíveis. Um imóvel vendido com placa no portão é um
 * imóvel vendido — a placa ali é assunto de retirada, não de instalação.
 */
export function categoriaDoImovel(imovel: {
  situacao: string;
  placa: string;
}): Categoria {
  if (imovel.situacao === "vendido" || imovel.situacao === "alugado") return "fora";
  if (imovel.situacao === "negociacao") return "negociacao";
  if (imovel.placa === "com_placa") return "com-placa";
  if (imovel.placa === "pendente") return "pendente";
  return "sem-placa";
}
