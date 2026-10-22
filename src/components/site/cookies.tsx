"use client";

import Link from "next/link";

import { responder, useConsentimento } from "@/lib/consentimento";

/**
 * Aviso de cookies, pela LGPD.
 *
 * O rastreio está de fato condicionado a esta escolha: os pixels leem o
 * mesmo estado e só carregam depois do aceite. Pedir permissão e disparar
 * de qualquer jeito não valeria de nada.
 *
 * Recusar é tão fácil quanto aceitar, e o aviso não bloqueia a leitura.
 */
export function AvisoCookies() {
  const consentimento = useConsentimento();

  if (consentimento !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-base bg-bg/95 backdrop-blur-md"
    >
      <div className="container-site flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:py-4">
        <p className="max-w-[70ch] text-pretty text-sm leading-relaxed text-fg-muted">
          Usamos cookies para entender como o site é usado e melhorar os
          anúncios. Você pode recusar e continuar navegando normalmente.{" "}
          <Link
            href="/privacidade"
            className="text-accent underline underline-offset-4"
          >
            Como tratamos seus dados
          </Link>
        </p>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => responder("recusado")}
            className="rounded-full border border-border-strong px-5 py-2.5 text-sm transition-colors hover:border-fg hover:text-fg"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => responder("aceito")}
            className="rounded-full bg-accent px-6 py-2.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
