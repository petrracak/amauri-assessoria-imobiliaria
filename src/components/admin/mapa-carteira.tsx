"use client";

import "leaflet/dist/leaflet.css";

import type * as Leaflet from "leaflet";
import { Building2, Navigation, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Selo } from "@/components/admin/ui";
import { rotaGoogle, rotaWaze } from "@/lib/mapa";
import {
  CATEGORIAS,
  CATEGORIAS_INICIAIS,
  categoriaDoImovel,
  corDaCategoria,
  rotuloDaCategoria,
  type Categoria,
} from "@/lib/pinos";
import { cn, formatPreco } from "@/lib/utils";

export type PinoImovel = {
  id: string;
  ref: string;
  titulo: string;
  tipo: string;
  bairro: string | null;
  preco: number | null;
  lat: number;
  lng: number;
  situacao: string;
  placa: string;
  foto: string | null;
};

/** Centro de Santarém, para quando ainda não há nada para enquadrar. */
const SANTAREM: [number, number] = [-2.4431, -54.7083];

export function MapaCarteira({ imoveis }: { imoveis: PinoImovel[] }) {
  const [L, setL] = useState<typeof Leaflet | null>(null);
  const [ativas, setAtivas] = useState<Categoria[]>(CATEGORIAS_INICIAIS);
  const [bairro, setBairro] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const divRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<Leaflet.Map | null>(null);
  const camadaRef = useRef<Leaflet.LayerGroup | null>(null);
  const enquadrou = useRef(false);

  // O Leaflet mexe em document na hora de carregar, então entra só no
  // navegador. O CSS dele pode vir estático; é só folha de estilo.
  useEffect(() => {
    let vivo = true;
    void import("leaflet").then((mod) => {
      if (vivo) setL(mod.default ?? (mod as unknown as typeof Leaflet));
    });
    return () => {
      vivo = false;
    };
  }, []);

  const bairros = useMemo(
    () =>
      [...new Set(imoveis.map((i) => i.bairro).filter(Boolean) as string[])].sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [imoveis],
  );

  const visiveis = useMemo(
    () =>
      imoveis.filter(
        (i) =>
          ativas.includes(categoriaDoImovel(i)) && (!bairro || i.bairro === bairro),
      ),
    [imoveis, ativas, bairro],
  );

  // Derivado da lista visível, e não guardado à parte: se o imóvel escolhido
  // sair do filtro, o cartão some sozinho, sem efeito nenhum para isso.
  const selecionado = visiveis.find((i) => i.id === selecionadoId) ?? null;

  const contagem = useMemo(() => {
    const mapa = new Map<Categoria, number>();
    for (const i of imoveis) {
      const c = categoriaDoImovel(i);
      mapa.set(c, (mapa.get(c) ?? 0) + 1);
    }
    return mapa;
  }, [imoveis]);

  // Monta o mapa uma vez.
  useEffect(() => {
    if (!L || !divRef.current || mapaRef.current) return;

    const mapa = L.map(divRef.current, { attributionControl: true }).setView(
      SANTAREM,
      13,
    );

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);

    camadaRef.current = L.layerGroup().addTo(mapa);
    mapaRef.current = mapa;

    return () => {
      mapa.remove();
      mapaRef.current = null;
      camadaRef.current = null;
    };
  }, [L]);

  // Redesenha os pinos a cada mudança de filtro.
  useEffect(() => {
    const mapa = mapaRef.current;
    const camada = camadaRef.current;
    if (!L || !mapa || !camada) return;

    camada.clearLayers();
    const pontos: [number, number][] = [];

    for (const imovel of visiveis) {
      const categoria = categoriaDoImovel(imovel);
      const marcador = L.marker([imovel.lat, imovel.lng], {
        // A cor vem da nossa lista, nunca do cadastro: nada do que a equipe
        // digita entra neste HTML.
        icon: L.divIcon({
          className: "pino-mapa",
          html: `<span style="background:${corDaCategoria(categoria)}"></span>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        title: `${imovel.titulo} — ${rotuloDaCategoria(categoria)}`,
        alt: `${imovel.titulo} — ${rotuloDaCategoria(categoria)}`,
        keyboard: true,
      });

      marcador.on("click", () => setSelecionadoId(imovel.id));
      marcador.addTo(camada);
      pontos.push([imovel.lat, imovel.lng]);
    }

    // Enquadra só na primeira vez: depois disso a tela é de quem está
    // olhando, e mudar um filtro não pode arrancar o mapa do lugar.
    if (pontos.length && !enquadrou.current) {
      mapa.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 16 });
      enquadrou.current = true;
    }
  }, [L, visiveis]);

  function alternar(chave: Categoria) {
    setAtivas((atuais) =>
      atuais.includes(chave) ? atuais.filter((c) => c !== chave) : [...atuais, chave],
    );
  }

  return (
    <div className="space-y-3">
      {/* Faixa que rola sozinha no celular: empilhar cinco pílulas em três
          linhas empurrava o mapa para baixo da dobra, e o mapa é a tela. */}
      <div className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORIAS.map((c) => {
          const ligada = ativas.includes(c.chave);
          return (
            <button
              key={c.chave}
              type="button"
              aria-pressed={ligada}
              onClick={() => alternar(c.chave)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors",
                ligada
                  ? "border-border-strong bg-bg-elevated text-fg"
                  : "border-border-base bg-transparent text-fg-subtle",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-3 shrink-0 rounded-full ring-1 ring-black/10 transition-opacity",
                  ligada ? "opacity-100" : "opacity-30",
                )}
                style={{ background: c.cor }}
              />
              {c.rotulo}
              <span className="numeros text-xs text-fg-muted">
                {contagem.get(c.chave) ?? 0}
              </span>
            </button>
          );
        })}

        {bairros.length > 1 ? (
          <select
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            aria-label="Filtrar por bairro"
            className="min-h-11 shrink-0 rounded-full border border-border-base bg-bg-elevated px-4 text-sm text-fg"
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border-base shadow-[var(--shadow-card)]">
        <div
          ref={divRef}
          role="application"
          aria-label="Mapa dos imóveis da carteira"
          className="h-[62vh] min-h-[360px] w-full bg-bg-subtle lg:h-[calc(100vh-20rem)]"
        />

        {selecionado ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-3">
            <article className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl border border-border-base bg-bg-elevated shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]">
              <div className="flex min-w-0 gap-3 p-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-bg-subtle">
                  {selecionado.foto ? (
                    <Image
                      src={selecionado.foto}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <Building2
                      className="absolute inset-0 m-auto size-6 text-fg-subtle"
                      strokeWidth={1.4}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[0.9375rem] font-medium leading-snug">
                    {selecionado.titulo}
                  </p>
                  <p className="numeros mt-0.5 truncate text-sm text-fg-muted">
                    {selecionado.ref} · {selecionado.bairro ?? "sem bairro"}
                  </p>
                  <p className="numeros mt-1 text-[0.9375rem] font-semibold">
                    {formatPreco(selecionado.preco)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelecionadoId(null)}
                  aria-label="Fechar"
                  className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                >
                  <X className="size-5" strokeWidth={1.8} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border-base px-3 py-2.5">
                <Selo tom="cinza">{rotuloDaCategoria(categoriaDoImovel(selecionado))}</Selo>

                <Link
                  href={`/admin/imoveis/${selecionado.id}`}
                  className="ml-auto inline-flex min-h-11 items-center rounded-full border border-border-strong px-3.5 text-[0.8125rem] font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  Abrir cadastro
                </Link>

                <a
                  href={rotaGoogle(selecionado.lat, selecionado.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[0.8125rem] font-medium text-accent-fg transition-opacity hover:opacity-90"
                >
                  <Navigation className="size-4" strokeWidth={2} />
                  Rota
                </a>

                <a
                  href={rotaWaze(selecionado.lat, selecionado.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-3.5 text-[0.8125rem] font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  Waze
                </a>
              </div>
            </article>
          </div>
        ) : null}
      </div>

      <p role="status" className="text-sm text-fg-muted">
        {visiveis.length === imoveis.length
          ? `${imoveis.length} ${imoveis.length === 1 ? "imóvel no mapa" : "imóveis no mapa"}`
          : `${visiveis.length} de ${imoveis.length} no mapa`}
      </p>
    </div>
  );
}
