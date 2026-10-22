import { Bath, BedDouble, Car, Maximize, Sofa } from "lucide-react";

import { formatArea } from "@/lib/utils";

type Fonte = {
  dormitorios?: number | null;
  suites?: number | null;
  banheiros?: number | null;
  vagas?: number | null;
  area_total?: number | null;
  area_privativa?: number | null;
};

export type Spec = {
  chave: string;
  valor: string;
  rotulo: string;
  Icone: typeof BedDouble;
};

/**
 * Ficha resumida do imóvel, com ícone por item.
 *
 * Ícone aqui não é enfeite: o olho encontra "3 quartos" num cartão muito
 * mais rápido pelo desenho da cama do que lendo quatro linhas de texto.
 * Terreno não tem quarto nem banheiro — por isso cada item só entra se
 * existir, em vez de mostrar zero.
 */
export function specsDe(imovel: Fonte): Spec[] {
  const area = imovel.area_privativa ?? imovel.area_total;

  return [
    imovel.dormitorios
      ? {
          chave: "dorm",
          valor: String(imovel.dormitorios),
          rotulo: imovel.dormitorios === 1 ? "quarto" : "quartos",
          Icone: BedDouble,
        }
      : null,
    imovel.suites
      ? {
          chave: "suite",
          valor: String(imovel.suites),
          rotulo: imovel.suites === 1 ? "suíte" : "suítes",
          Icone: Sofa,
        }
      : null,
    imovel.banheiros
      ? {
          chave: "banho",
          valor: String(imovel.banheiros),
          rotulo: imovel.banheiros === 1 ? "banheiro" : "banheiros",
          Icone: Bath,
        }
      : null,
    imovel.vagas
      ? {
          chave: "vaga",
          valor: String(imovel.vagas),
          rotulo: imovel.vagas === 1 ? "vaga" : "vagas",
          Icone: Car,
        }
      : null,
    area
      ? {
          chave: "area",
          valor: formatArea(area)!.replace(" m²", ""),
          rotulo: imovel.area_privativa ? "m² privativos" : "m² de terreno",
          Icone: Maximize,
        }
      : null,
  ].filter(Boolean) as Spec[];
}

export function SpecsLinha({
  specs,
  limite = 4,
  className,
}: {
  specs: Spec[];
  limite?: number;
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 ${className ?? ""}`}>
      {specs.slice(0, limite).map(({ chave, valor, rotulo, Icone }) => (
        <li key={chave} className="flex items-center gap-1.5 text-fg-muted">
          <Icone className="size-[1.05rem] shrink-0" strokeWidth={1.5} />
          <span className="numeros text-sm text-fg">{valor}</span>
          <span className="text-sm">{rotulo}</span>
        </li>
      ))}
    </ul>
  );
}
