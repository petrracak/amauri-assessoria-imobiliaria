import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Peças compartilhadas do painel. Sem estado nem hooks: servem tanto às
 * páginas do servidor quanto aos formulários.
 *
 * Duas regras valem para tudo aqui:
 *  - campo de texto com 16px no celular. Abaixo disso o iOS dá zoom ao
 *    tocar e deixa a página deslocada para o lado depois;
 *  - alvo de toque com pelo menos 44px de altura.
 */

/* ------------------------------------------------------------ campos */

export const campo =
  "mt-1.5 block min-h-12 w-full min-w-0 rounded-xl border border-border-strong bg-bg-elevated px-4 py-3 text-base text-fg transition-colors placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60 lg:text-[0.9375rem]";

const botaoBase =
  "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[0.9375rem] font-medium transition-[background-color,border-color,color,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

export const botao = {
  primario: cn(botaoBase, "bg-accent text-accent-fg hover:bg-accent-hover"),
  secundario: cn(
    botaoBase,
    "border border-border-strong bg-bg-elevated text-fg hover:border-accent hover:text-accent",
  ),
  suave: cn(botaoBase, "bg-bg-subtle text-fg hover:bg-border-base"),
  perigo: cn(
    botaoBase,
    "border border-red-500/40 bg-transparent text-red-600 hover:bg-red-500/10 dark:text-red-400",
  ),
};

export function Campo({
  nome,
  rotulo,
  dica,
  erro,
  children,
  className,
}: {
  nome: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={nome} className="block text-sm font-medium text-fg">
        {rotulo}
      </label>
      {children}
      {dica && !erro ? <p className="mt-1.5 text-xs text-fg-muted">{dica}</p> : null}
      {erro ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Liga/desliga com explicação ao lado. O texto inteiro é a área de toque.
 * O input é nativo (entra no FormData sem JavaScript) e o desenho vem do
 * estado `peer-checked`.
 */
export function Interruptor({
  nome,
  titulo,
  descricao,
  marcado,
}: {
  nome: string;
  titulo: string;
  descricao?: string;
  marcado?: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium">{titulo}</span>
        {descricao ? <span className="mt-0.5 block text-xs text-fg-muted">{descricao}</span> : null}
      </span>
      <input type="checkbox" name={nome} defaultChecked={marcado} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-border-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40"
      />
    </label>
  );
}

/**
 * Escolha única entre poucas opções, em botões grandes. Melhor que um
 * <select> no celular: tudo à vista, um toque só.
 */
export function Segmentos({
  nome,
  opcoes,
  valor,
}: {
  nome: string;
  opcoes: { valor: string; rotulo: string }[];
  valor: string;
}) {
  return (
    <div className="mt-1.5 grid auto-cols-fr grid-flow-col gap-1.5 rounded-xl bg-bg-subtle p-1">
      {opcoes.map((o) => (
        <label key={o.valor} className="min-w-0 cursor-pointer">
          <input
            type="radio"
            name={nome}
            value={o.valor}
            defaultChecked={o.valor === valor}
            className="peer sr-only"
          />
          <span className="flex min-h-10 items-center justify-center rounded-lg px-2 text-sm text-fg-muted transition-colors peer-checked:bg-bg-elevated peer-checked:font-medium peer-checked:text-fg peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
            {o.rotulo}
          </span>
        </label>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- estrutura */

export function Pagina({
  children,
  largura = "max-w-5xl",
}: {
  children: React.ReactNode;
  largura?: string;
}) {
  return <div className={cn("mx-auto w-full min-w-0 space-y-6", largura)}>{children}</div>;
}

export function Cabecalho({
  titulo,
  descricao,
  acoes,
  voltar,
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acoes?: React.ReactNode;
  voltar?: { href: string; rotulo: string };
}) {
  return (
    <header className="min-w-0">
      {voltar ? (
        <Link
          href={voltar.href}
          className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-5" strokeWidth={1.75} />
          {voltar.rotulo}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-60">
          <h1 className="text-balance font-display text-[1.625rem] leading-tight lg:text-[1.875rem]">
            {titulo}
          </h1>
          {descricao ? (
            <p className="mt-1.5 text-pretty text-[0.9375rem] leading-relaxed text-fg-muted">
              {descricao}
            </p>
          ) : null}
        </div>
        {acoes ? <div className="flex flex-wrap gap-2">{acoes}</div> : null}
      </div>
    </header>
  );
}

export function Cartao({
  titulo,
  descricao,
  acao,
  children,
  className,
  tom = "normal",
}: {
  titulo?: React.ReactNode;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tom?: "normal" | "perigo";
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border bg-bg-elevated p-4 shadow-[var(--shadow-card)] sm:p-6",
        tom === "perigo" ? "border-red-500/30" : "border-border-base",
        className,
      )}
    >
      {titulo || acao ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo ? <h2 className="font-display text-lg leading-snug">{titulo}</h2> : null}
            {descricao ? (
              <p className="mt-1 text-pretty text-sm leading-relaxed text-fg-muted">{descricao}</p>
            ) : null}
          </div>
          {acao}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const TONS = {
  verde: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  ambar: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  cinza: "bg-fg-subtle/15 text-fg-muted",
  azul: "bg-accent/12 text-accent",
} as const;

export function Selo({
  tom = "cinza",
  children,
  className,
}: {
  tom?: keyof typeof TONS;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Situação de imóvel ou texto, com a mesma cor em todo o painel. */
export function SeloSituacao({ situacao }: { situacao: string }) {
  const tom = situacao === "publicado" ? "verde" : situacao === "rascunho" ? "ambar" : "cinza";
  const rotulo =
    situacao === "publicado" ? "No ar" : situacao === "rascunho" ? "Rascunho" : "Arquivado";
  return <Selo tom={tom}>{rotulo}</Selo>;
}

/**
 * Filtros em pílulas. A rolagem fica contida na própria faixa: o contêiner
 * tem largura da tela, então nunca empurra a página para o lado.
 */
export function Filtros({
  itens,
  atual,
}: {
  itens: { chave: string; rotulo: string; href: string; contagem?: number }[];
  atual: string;
}) {
  return (
    <nav
      aria-label="Filtrar"
      className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {itens.map((i) => (
          <li key={i.chave}>
            <Link
              href={i.href}
              aria-current={atual === i.chave ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                atual === i.chave
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border-base bg-bg-elevated text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {i.rotulo}
              {i.contagem !== undefined ? (
                <span className="numeros text-xs opacity-75">{i.contagem}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Vazio({
  icone: Icone,
  titulo,
  texto,
  acao,
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titulo: string;
  texto: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-bg-subtle text-fg-muted">
        <Icone className="size-6" strokeWidth={1.5} />
      </span>
      <p className="mt-5 font-display text-lg">{titulo}</p>
      <p className="mt-2 max-w-[42ch] text-pretty text-sm leading-relaxed text-fg-muted">{texto}</p>
      {acao ? <div className="mt-6">{acao}</div> : null}
    </div>
  );
}

/**
 * Barra de salvar que acompanha a rolagem. No celular fica colada acima da
 * barra de abas; num formulário longo, o botão nunca sai do alcance do dedo.
 */
export function BarraSalvar({
  children,
  mensagem,
  tom = "neutro",
}: {
  children: React.ReactNode;
  mensagem?: string;
  tom?: "neutro" | "sucesso" | "erro";
}) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-border-base bg-bg/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border lg:bottom-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {children}
        {mensagem ? (
          <p
            role="status"
            className={cn(
              "min-w-0 flex-1 basis-40 text-sm",
              tom === "sucesso" && "text-emerald-700 dark:text-emerald-300",
              tom === "erro" && "text-red-600 dark:text-red-400",
              tom === "neutro" && "text-fg-muted",
            )}
          >
            {mensagem}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Data e hora no fuso de Santarém — o servidor roda em UTC. */
export function dataHora(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santarem",
  }).format(new Date(iso));
}
