import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** R$ 3.000.000 — sem centavos, que só poluem o card. */
export function formatPreco(valor: number | null | undefined) {
  if (valor == null) return "Sob consulta";
  return BRL.format(valor);
}

/** 264 m² — corta o ",00" quando o número é redondo. */
export function formatArea(valor: number | null | undefined) {
  if (valor == null) return null;
  const n = Number(valor);
  const texto = Number.isInteger(n)
    ? String(n)
    : n.toFixed(2).replace(".", ",").replace(/,?0+$/, "");
  return `${texto} m²`;
}

/** "3 quartos" / "1 quarto" — plural correto sem gambiarra no JSX. */
export function plural(n: number, singular: string, plural_: string) {
  return `${n} ${n === 1 ? singular : plural_}`;
}

export function whatsappLink(numero: string, mensagem: string) {
  const limpo = numero.replace(/\D/g, "");
  return `https://wa.me/${limpo}?text=${encodeURIComponent(mensagem)}`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
