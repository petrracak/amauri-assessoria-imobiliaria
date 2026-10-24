"use client";

import { useSyncExternalStore } from "react";

import { LIMITE_FAVORITOS } from "@/lib/refs";

const CHAVE = "amauri:favoritos";
const EVENTO = "amauri:favoritos";
const LIMITE = LIMITE_FAVORITOS;

/**
 * Lista de imóveis favoritados, guardada no próprio navegador.
 *
 * Sem cadastro de propósito: exigir login para favoritar afasta justamente
 * quem ainda está só olhando. O preço disso é a lista não acompanhar a
 * pessoa entre aparelhos — resolvido pelo link compartilhável, que leva as
 * referências no endereço.
 *
 * Guarda a referência (026), não o id: ela é curta, estável e é o que o
 * corretor usa para falar do imóvel.
 */
function ler(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista)
      ? lista.filter((r): r is string => typeof r === "string").slice(0, LIMITE)
      : [];
  } catch {
    // Armazenamento bloqueado ou conteúdo estragado: começa vazio.
    return [];
  }
}

/**
 * useSyncExternalStore compara por identidade, e `ler()` devolve um array
 * novo a cada chamada — sem este cache, o React entraria em laço.
 */
let cache: string[] = [];
let cacheBruto: string | null = null;

function snapshot(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto !== cacheBruto) {
      cacheBruto = bruto;
      cache = ler();
    }
  } catch {
    cache = [];
  }
  return cache;
}

const VAZIO: string[] = [];
function snapshotServidor(): string[] {
  return VAZIO;
}

function assinar(aoMudar: () => void) {
  window.addEventListener(EVENTO, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function gravar(lista: string[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, LIMITE)));
  } catch {
    /* segue sem lembrar */
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

export function useFavoritos() {
  return useSyncExternalStore(assinar, snapshot, snapshotServidor);
}

export function alternarFavorito(ref: string) {
  const atual = snapshot();
  gravar(atual.includes(ref) ? atual.filter((r) => r !== ref) : [ref, ...atual]);
}

export function removerFavorito(ref: string) {
  gravar(snapshot().filter((r) => r !== ref));
}

export function limparFavoritos() {
  gravar([]);
}
