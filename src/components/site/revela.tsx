"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Revela o bloco quando ele entra na tela, uma vez só.
 *
 * Usado no primeiro elemento de cada seção, não em tudo: entrada em cada
 * card é o efeito padrão de template e cansa na segunda rolagem.
 */
export function Revela({
  children,
  atraso = 0,
  className,
}: {
  children: React.ReactNode;
  /** Milissegundos, para escalonar dois ou três blocos irmãos. */
  atraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const no = ref.current;
    if (!no) return;

    // Sem IntersectionObserver, mostra em vez de esconder para sempre.
    // No quadro seguinte, não no corpo do efeito, para não encadear render.
    if (typeof IntersectionObserver === "undefined") {
      const quadro = requestAnimationFrame(() => setVisivel(true));
      return () => cancelAnimationFrame(quadro);
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observador.observe(no);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`revela ${className ?? ""}`}
      data-visivel={visivel ? "" : undefined}
      style={atraso ? { transitionDelay: `${atraso}ms` } : undefined}
    >
      {children}
    </div>
  );
}
