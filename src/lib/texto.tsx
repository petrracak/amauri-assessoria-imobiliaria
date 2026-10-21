import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renderiza o texto dos posts num subconjunto previsível de Markdown.
 *
 * Monta elementos React em vez de injetar HTML: o que a equipe escrever no
 * painel nunca vira script na página, mesmo que alguém cole código.
 *
 * Suporta: ## e ### para títulos, - para lista, > para citação,
 * **negrito**, *itálico* e [texto](link).
 */

const SEGURO = /^(https?:\/\/|mailto:|tel:|\/)/i;

function inline(texto: string, chaveBase: string): ReactNode[] {
  const partes: ReactNode[] = [];
  // Uma varredura só, na ordem: link, negrito, itálico.
  const padrao = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = padrao.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));

    const chave = `${chaveBase}-${i++}`;

    if (m[1] && m[2]) {
      const href = m[2];
      if (!SEGURO.test(href)) {
        // Link com esquema estranho (javascript:, data:) vira texto simples.
        partes.push(m[1]);
      } else if (href.startsWith("/")) {
        partes.push(
          <Link key={chave} href={href} className="text-accent underline underline-offset-4">
            {m[1]}
          </Link>,
        );
      } else {
        partes.push(
          <a
            key={chave}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-4"
          >
            {m[1]}
          </a>,
        );
      }
    } else if (m[3]) {
      partes.push(<strong key={chave}>{m[3]}</strong>);
    } else if (m[4]) {
      partes.push(<em key={chave}>{m[4]}</em>);
    }

    ultimo = m.index + m[0].length;
  }

  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

export function RichText({ texto }: { texto: string }) {
  const linhas = texto.replace(/\r\n/g, "\n").split("\n");
  const blocos: ReactNode[] = [];

  let paragrafo: string[] = [];
  let lista: string[] = [];
  let citacao: string[] = [];
  let n = 0;

  const fecharParagrafo = () => {
    if (!paragrafo.length) return;
    const chave = `p-${n++}`;
    blocos.push(
      <p key={chave} className="text-pretty leading-[1.75]">
        {inline(paragrafo.join(" "), chave)}
      </p>,
    );
    paragrafo = [];
  };

  const fecharLista = () => {
    if (!lista.length) return;
    const chave = `ul-${n++}`;
    blocos.push(
      <ul key={chave} className="ml-5 list-disc space-y-2 marker:text-fg-subtle">
        {lista.map((item, i) => (
          <li key={`${chave}-${i}`} className="text-pretty leading-[1.75] pl-1">
            {inline(item, `${chave}-${i}`)}
          </li>
        ))}
      </ul>,
    );
    lista = [];
  };

  const fecharCitacao = () => {
    if (!citacao.length) return;
    const chave = `bq-${n++}`;
    blocos.push(
      <blockquote
        key={chave}
        className="border-l-2 border-accent pl-5 font-display text-xl italic leading-relaxed"
      >
        {inline(citacao.join(" "), chave)}
      </blockquote>,
    );
    citacao = [];
  };

  const fecharTudo = () => {
    fecharParagrafo();
    fecharLista();
    fecharCitacao();
  };

  for (const linha of linhas) {
    const l = linha.trim();

    if (!l) {
      fecharTudo();
      continue;
    }

    if (l.startsWith("### ")) {
      fecharTudo();
      blocos.push(
        <h3 key={`h3-${n++}`} className="pt-4 font-display text-2xl">
          {l.slice(4)}
        </h3>,
      );
    } else if (l.startsWith("## ")) {
      fecharTudo();
      blocos.push(
        <h2 key={`h2-${n++}`} className="pt-6 font-display text-display-sm">
          {l.slice(3)}
        </h2>,
      );
    } else if (l.startsWith("- ") || l.startsWith("* ")) {
      fecharParagrafo();
      fecharCitacao();
      lista.push(l.slice(2));
    } else if (l.startsWith("> ")) {
      fecharParagrafo();
      fecharLista();
      citacao.push(l.slice(2));
    } else {
      fecharLista();
      fecharCitacao();
      paragrafo.push(l);
    }
  }

  fecharTudo();

  return <div className="space-y-5">{blocos}</div>;
}

/** Resumo automático quando o post não traz um escrito à mão. */
export function resumoDe(texto: string, limite = 160) {
  const limpo = texto
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*>_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (limpo.length <= limite) return limpo;
  return limpo.slice(0, limpo.lastIndexOf(" ", limite)) + "…";
}
