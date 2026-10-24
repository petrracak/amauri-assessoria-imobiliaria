import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const ALT = "Amauri Assessoria Imobiliária";
const LARGURA = 720;
const ALTURA = 323;

/**
 * Marca oficial. A versão colorida tem a assinatura em preto, que some em
 * fundo escuro — por isso as duas entram e o tema escolhe, por CSS, qual
 * aparece. Sem estado, sem piscar na troca de tema.
 *
 * `branca` força a versão clara, para quem já está sobre fundo escuro
 * (rodapé e seções em campo-tinta).
 */
export function Logo({
  className,
  href = "/",
  branca = false,
  tamanho = "md",
}: {
  className?: string;
  href?: string | null;
  branca?: boolean;
  tamanho?: "sm" | "md" | "lg";
}) {
  const altura =
    tamanho === "sm"
      ? "h-9 w-auto"
      : tamanho === "lg"
        ? "h-[4.25rem] w-auto lg:h-[4.75rem]"
        : "h-[2.875rem] w-auto lg:h-[3.5rem]";

  const marca = branca ? (
    <Image
      src="/logo-amauri-branca.png"
      alt={ALT}
      width={LARGURA}
      height={ALTURA}
      priority
      className={cn(altura, className)}
    />
  ) : (
    <>
      <Image
        src="/logo-amauri.png"
        alt={ALT}
        width={LARGURA}
        height={ALTURA}
        priority
        className={cn(altura, "dark:hidden", className)}
      />
      <Image
        src="/logo-amauri-branca.png"
        alt={ALT}
        width={LARGURA}
        height={ALTURA}
        priority
        className={cn(altura, "hidden dark:block", className)}
      />
    </>
  );

  if (!href) return <span className="inline-flex shrink-0">{marca}</span>;

  return (
    <Link href={href} className="inline-flex shrink-0" aria-label={`${ALT} — início`}>
      {marca}
    </Link>
  );
}
