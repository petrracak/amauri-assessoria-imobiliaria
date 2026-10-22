"use client";

import { useSyncExternalStore } from "react";

const CHAVE = "amauri:cookies";
const EVENTO = "amauri:cookies";

export type Consentimento = "aceito" | "recusado" | null;

/**
 * Estado do aceite de cookies, lido direto do navegador.
 *
 * `useSyncExternalStore` em vez de ler no efeito: é o jeito que o React
 * trata estado que mora fora dele. Assim o aviso e os pixels enxergam o
 * mesmo valor, sem um precisar avisar o outro por conta própria.
 */
function assinar(aoMudar: () => void) {
  window.addEventListener(EVENTO, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function ler(): Consentimento {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    // Armazenamento bloqueado: trata como quem ainda não respondeu.
    return null;
  }
}

/** No servidor ninguém respondeu ainda — e nada de rastreio é renderizado. */
function lerNoServidor(): Consentimento {
  return null;
}

export function useConsentimento() {
  return useSyncExternalStore(assinar, ler, lerNoServidor);
}

export function responder(resposta: Exclude<Consentimento, null>) {
  try {
    localStorage.setItem(CHAVE, resposta);
  } catch {
    /* segue sem lembrar da escolha */
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}
