import Image from "next/image";

import { cn } from "@/lib/utils";

const TAMANHOS = {
  sm: { classe: "size-9", px: 36 },
  md: { classe: "size-12", px: 48 },
  lg: { classe: "size-28", px: 112 },
} as const;

/**
 * Silhueta de pessoa, no espírito do que as redes sociais mostram quando
 * ninguém escolheu foto. Desenhada à mão em vez de vir de biblioteca de
 * ícones: assim preenche o círculo inteiro, sem sobrar borda.
 */
function Silhueta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <circle cx="24" cy="24" r="24" className="fill-bg-subtle" />
      <circle cx="24" cy="19" r="7.5" className="fill-fg-subtle/55" />
      <path
        d="M9 42a15 15 0 0 1 30 0"
        className="fill-fg-subtle/55"
        transform="translate(0 1)"
      />
    </svg>
  );
}

export function Avatar({
  url,
  nome,
  tamanho = "md",
  className,
}: {
  url?: string | null;
  nome: string;
  tamanho?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const { classe, px } = TAMANHOS[tamanho];

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full",
        classe,
        className,
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={`Foto de ${nome}`}
          width={px * 2}
          height={px * 2}
          className="size-full object-cover"
        />
      ) : (
        <Silhueta className="size-full" />
      )}
    </span>
  );
}
