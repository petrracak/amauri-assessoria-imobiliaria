import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Marca da Amauri. Enquanto o arquivo oficial não entra, o logotipo é
 * tipográfico — trocar aqui por <Image src="/logo.svg" /> não muda mais nada
 * no resto do site.
 */
export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const marca = (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="font-display text-[1.375rem] tracking-[-0.01em] sm:text-2xl">
        Amauri Nobre
      </span>
      <span className="mt-1 font-sans text-[0.625rem] tracking-[0.18em] text-fg-muted">
        ASSESSORIA IMOBILIÁRIA
      </span>
    </span>
  );

  if (!href) return marca;

  return (
    <Link href={href} className="shrink-0" aria-label="Amauri Assessoria Imobiliária — início">
      {marca}
    </Link>
  );
}
