"use client";

import { useEffect } from "react";

/**
 * Registra o service worker depois que a página carrega, para não disputar
 * banda com as fotos do imóvel. Em desenvolvimento fica fora do caminho.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falhar aqui não pode derrubar a página: o site funciona sem cache.
      });
    };

    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar, { once: true });
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
