"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CHAVE = "amauri:intro";

/**
 * Cortina de abertura com a marca.
 *
 * Aparece uma vez por sessão — repetir a cada página seria pedágio, não
 * identidade. Quem já viu não vê de novo, e quem pediu menos movimento no
 * sistema não vê nunca.
 *
 * O conteúdo do site renderiza atrás desde o primeiro instante: a cortina
 * é só visual, não atrasa leitura nem indexação.
 */
export function Intro() {
  const [saindo, setSaindo] = useState(false);
  const [fim, setFim] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE, "1");
    } catch {
      // Navegador com armazenamento bloqueado: a cortina só aparece sempre.
    }

    const sai = setTimeout(() => setSaindo(true), 900);
    const some = setTimeout(() => setFim(true), 1700);
    return () => {
      clearTimeout(sai);
      clearTimeout(some);
    };
  }, []);

  if (fim) return null;

  return (
    <div
      id="intro"
      aria-hidden
      data-saindo={saindo ? "" : undefined}
      className="fixed inset-0 z-[100] grid place-items-center bg-brand-950"
    >
      <div className="flex flex-col items-center">
        <Image
          src="/simbolo-branco.png"
          alt=""
          width={448}
          height={320}
          priority
          className="intro-marca h-16 w-auto lg:h-20"
        />
        <span className="intro-linha mt-6 block h-px bg-white/40" />
      </div>
    </div>
  );
}
