"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Os dois ícones são renderizados e a variante `dark:` escolhe qual aparece.
 * Sem estado de montagem: não há descompasso entre servidor e cliente.
 */
export function ThemeToggle({
  className,
  claro = false,
}: {
  className?: string;
  /** Sobre a foto do banner, onde tudo precisa ser branco. */
  claro?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`grid size-10 place-items-center rounded-full border transition-colors ${
        claro
          ? "border-white/40 text-white hover:bg-white/10"
          : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg"
      } ${className ?? ""}`}
      aria-label="Alternar entre tema claro e escuro"
    >
      <Moon className="size-[1.1rem] dark:hidden" strokeWidth={1.5} />
      <Sun className="hidden size-[1.1rem] dark:block" strokeWidth={1.5} />
    </button>
  );
}
