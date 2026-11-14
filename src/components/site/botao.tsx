import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Botão da casa: pílula com brilho metálico e um selo circular com a seta.
 *
 * Na variante "gelo" o metal é branco — a cor principal da marca — sobre o
 * campo escuro; na "tinta", azul-marinho sobre fundo claro. As duas têm a
 * luz vindo de cima, então nunca aparecem lado a lado invertidas.
 *
 * A seta é dupla e o selo tem overflow oculto: no toque a primeira sai pela
 * direita enquanto a segunda entra pela esquerda. É o movimento que diz
 * "isto leva a algum lugar" sem precisar de texto.
 */

const base =
  "group/btn relative inline-flex shrink-0 items-center rounded-full font-medium uppercase transition-[transform,box-shadow,background-position] duration-500 ease-[var(--ease-out-soft)] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-60";

const TAMANHOS = {
  normal: "min-h-[3.25rem] gap-4 pl-7 pr-2 text-[0.8125rem] tracking-[0.12em]",
  compacto: "min-h-10 gap-2.5 pl-5 pr-1.5 text-[0.6875rem] tracking-[0.1em]",
} as const;

const VARIANTES = {
  /** Metal branco sobre campo escuro. */
  gelo: cn(
    "bg-[linear-gradient(135deg,#ffffff_0%,#eef3f9_42%,#b9c6d8_100%)] bg-[length:200%_100%] bg-[position:0%_0%] text-brand-950",
    "shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_30px_-10px_rgba(255,255,255,0.45)]",
    "hover:bg-[position:100%_0%] hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_38px_-10px_rgba(255,255,255,0.6)]",
  ),
  /** Metal azul sobre fundo claro. */
  tinta: cn(
    "bg-[linear-gradient(135deg,#2b6fae_0%,#1d538d_42%,#15314f_100%)] bg-[length:200%_100%] bg-[position:0%_0%] text-white",
    "shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_10px_30px_-12px_rgba(16,72,120,0.7)]",
    "hover:bg-[position:100%_0%] hover:shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_16px_40px_-12px_rgba(16,72,120,0.85)]",
  ),
  /** Contorno fino, para a ação secundária ao lado da principal. */
  contorno: cn(
    "border border-white/25 !pr-7 text-white/90",
    "hover:border-white/55 hover:bg-white/[0.06]",
  ),
} as const;

const SELO = {
  gelo: "bg-brand-950 text-white",
  tinta: "bg-white text-brand-800",
  contorno: "",
} as const;

type Props = {
  children: React.ReactNode;
  href?: string;
  variante?: keyof typeof VARIANTES;
  className?: string;
  externo?: boolean;
  tamanho?: keyof typeof TAMANHOS;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Botao({
  children,
  href,
  variante = "gelo",
  className,
  externo = false,
  tamanho = "normal",
  ...resto
}: Props) {
  const temSelo = variante !== "contorno";

  const conteudo = (
    <>
      <span className="min-w-0">{children}</span>

      {temSelo ? (
        <span
          aria-hidden
          className={cn(
            "relative grid shrink-0 place-items-center overflow-hidden rounded-full",
            tamanho === "normal" ? "size-10" : "size-7",
            SELO[variante],
          )}
        >
          <ArrowRight
            className="size-[0.95rem] transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover/btn:translate-x-7 motion-reduce:transition-none motion-reduce:group-hover/btn:translate-x-0"
            strokeWidth={2}
          />
          <ArrowRight
            className="absolute size-[0.95rem] -translate-x-7 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover/btn:translate-x-0 motion-reduce:hidden"
            strokeWidth={2}
          />
        </span>
      ) : null}
    </>
  );

  const classe = cn(base, TAMANHOS[tamanho], VARIANTES[variante], className);

  if (href) {
    return externo ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classe}>
        {conteudo}
      </a>
    ) : (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button className={classe} {...resto}>
      {conteudo}
    </button>
  );
}

/**
 * Link de texto com a seta que corre. Para "ver todos" e afins, onde um
 * botão cheio pesaria demais.
 */
export function LinkSeta({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/seta inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent",
        className,
      )}
    >
      {children}
      <span aria-hidden className="relative grid size-4 place-items-center overflow-hidden">
        <ArrowRight
          className="size-4 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover/seta:translate-x-5 motion-reduce:transition-none motion-reduce:group-hover/seta:translate-x-0"
          strokeWidth={1.75}
        />
        <ArrowRight
          className="absolute size-4 -translate-x-5 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover/seta:translate-x-0 motion-reduce:hidden"
          strokeWidth={1.75}
        />
      </span>
    </Link>
  );
}
