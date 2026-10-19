"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Foto = { url: string; alt: string | null };

export function Gallery({ fotos, titulo }: { fotos: Foto[]; titulo: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: fotos.length > 1 });
  const [atual, setAtual] = useState(0);

  const ir = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  useEffect(() => {
    if (!embla) return;
    // "reInit" cobre a primeira montagem; o índice inicial já é 0.
    const aoMudar = () => setAtual(embla.selectedScrollSnap());
    embla.on("select", aoMudar).on("reInit", aoMudar);
    return () => {
      embla.off("select", aoMudar).off("reInit", aoMudar);
    };
  }, [embla]);

  if (fotos.length === 0) {
    return (
      <div className="grid aspect-[16/10] place-items-center bg-bg-subtle text-sm text-fg-subtle">
        Este imóvel ainda não tem fotos.
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {fotos.map((foto, i) => (
              <div key={foto.url} className="relative aspect-[16/10] min-w-0 flex-[0_0_100%]">
                <Image
                  src={foto.url}
                  alt={foto.alt ?? `${titulo} — foto ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {fotos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => embla?.scrollPrev()}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg/90 text-fg transition-colors hover:bg-bg"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => embla?.scrollNext()}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg/90 text-fg transition-colors hover:bg-bg"
            >
              <ChevronRight className="size-5" strokeWidth={1.5} />
            </button>
            <span className="numeros absolute bottom-3 right-3 rounded-full bg-bg/90 px-3 py-1 text-xs text-fg-muted">
              {atual + 1} / {fotos.length}
            </span>
          </>
        ) : null}
      </div>

      {fotos.length > 1 ? (
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
          {fotos.map((foto, i) => (
            <button
              key={foto.url}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === atual}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden transition-opacity",
                i === atual ? "opacity-100" : "opacity-50 hover:opacity-80",
              )}
            >
              <Image
                src={foto.url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
