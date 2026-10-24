/**
 * Esqueleto mostrado no mesmo instante do toque, enquanto a página chega.
 * O resto do painel (barras, menu) já está na tela; só este miolo troca.
 */
function Bloco({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-border-base/70 ${className}`} />;
}

export default function Carregando() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="space-y-2">
        <Bloco className="h-8 w-48 !rounded-lg" />
        <Bloco className="h-4 w-64 !rounded-md" />
      </div>
      <Bloco className="h-12 !rounded-full" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Bloco className="h-28" />
        <Bloco className="h-28" />
        <Bloco className="h-28" />
        <Bloco className="h-28" />
      </div>
    </div>
  );
}
