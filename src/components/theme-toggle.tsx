"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Os dois ícones são renderizados e a variante `dark:` escolhe qual aparece.
 * Sem estado de montagem: não há descompasso entre servidor e cliente.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`grid size-10 place-items-center rounded-full border border-border-base text-fg-muted transition-colors hover:border-border-strong hover:text-fg ${className ?? ""}`}
      aria-label="Alternar entre tema claro e escuro"
    >
      <Moon className="size-[1.1rem] dark:hidden" strokeWidth={1.5} />
      <Sun className="hidden size-[1.1rem] dark:block" strokeWidth={1.5} />
    </button>
  );
}
