import Link from "next/link";

import {
  Cabecalho,
  Cartao,
  Pagina,
  botao,
  rotuloPlaca,
  rotuloSituacao,
} from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { CATEGORIAS, categoriaDoImovel } from "@/lib/pinos";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Indicadores" };

/**
 * Número grande com rótulo. Vira link quando há uma lista para onde ir:
 * indicador que não leva a lugar nenhum é enfeite.
 */
function Numero({
  valor,
  rotulo,
  href,
  alerta,
}: {
  valor: number;
  rotulo: string;
  href?: string;
  alerta?: boolean;
}) {
  const corpo = (
    <>
      <p
        className={cn(
          "numeros font-display text-4xl leading-none",
          alerta && valor > 0 && "text-red-600 dark:text-red-400",
        )}
      >
        {valor}
      </p>
      <p className="mt-2 text-sm text-fg-muted">{rotulo}</p>
    </>
  );

  const classe =
    "min-w-0 rounded-2xl border border-border-base bg-bg-elevated p-4 shadow-[var(--shadow-card)]";

  return href ? (
    <Link href={href} className={cn(classe, "transition-colors hover:border-border-strong")}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}

/** Barras proporcionais ao maior valor — sem biblioteca, sem eixo, sem grade. */
function Distribuicao({
  titulo,
  descricao,
  linhas,
}: {
  titulo: string;
  descricao?: string;
  linhas: { nome: string; total: number }[];
}) {
  const maior = Math.max(1, ...linhas.map((l) => l.total));

  return (
    <Cartao titulo={titulo} descricao={descricao}>
      {linhas.length ? (
        <ul className="space-y-2.5">
          {linhas.map((linha) => (
            <li key={linha.nome} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[0.9375rem]">{linha.nome}</span>
                <span className="numeros shrink-0 text-sm font-medium">{linha.total}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(linha.total / maior) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-muted">Nada para mostrar ainda.</p>
      )}
    </Cartao>
  );
}

export default async function Indicadores() {
  await exigirPerfil();
  const supabase = await createClient();

  // Uma consulta só, e a conta é feita aqui. São algumas centenas de linhas
  // de colunas curtas: sai mais barato que dez contagens separadas indo e
  // voltando ao banco, e ainda rende as distribuições de graça.
  const { data } = await supabase
    .from("properties")
    .select("status, situacao, placa, bairro, tipo, latitude")
    .limit(2000);

  const todos = data ?? [];
  const ativos = todos.filter((i) => i.status !== "arquivado");

  const conta = (filtro: (i: (typeof ativos)[number]) => boolean) =>
    ativos.filter(filtro).length;

  const disponiveis = ativos.filter((i) => i.situacao === "disponivel");

  const agrupar = (campo: "bairro" | "tipo") => {
    const mapa = new Map<string, number>();
    for (const i of ativos) {
      const chave = (i[campo] ?? "").trim() || "Sem informação";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    }
    return [...mapa.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  };

  const porCategoria = CATEGORIAS.map((c) => ({
    nome: c.rotulo,
    total: ativos.filter((i) => categoriaDoImovel(i) === c.chave).length,
  }));

  const semLocalizacao = conta((i) => i.latitude === null);

  return (
    <Pagina largura="max-w-5xl">
      <Cabecalho
        titulo="Indicadores"
        descricao="A carteira em números, fora o que está arquivado."
        acoes={
          <Link href="/admin/mapa" className={botao.secundario}>
            Ver no mapa
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero valor={todos.length} rotulo="imóveis cadastrados" href="/admin/imoveis" />
        <Numero
          valor={conta((i) => i.status === "publicado")}
          rotulo="no ar no site"
          href="/admin/imoveis?status=publicado"
        />
        <Numero valor={disponiveis.length} rotulo="disponíveis" />
        <Numero
          valor={conta((i) => i.situacao === "negociacao")}
          rotulo="em negociação"
          href="/admin/imoveis?visao=negociacao"
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Placas</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero
            valor={disponiveis.filter((i) => i.placa === "sem_placa").length}
            rotulo={`${rotuloPlaca("sem_placa").toLowerCase()}, entre os disponíveis`}
            href="/admin/imoveis?visao=sem-placa"
            alerta
          />
          <Numero
            valor={conta((i) => i.placa === "pendente")}
            rotulo="com instalação pendente"
            href="/admin/imoveis?visao=placa-pendente"
          />
          <Numero
            valor={conta((i) => i.placa === "com_placa")}
            rotulo="com placa instalada"
            href="/admin/imoveis?visao=com-placa"
          />
          <Numero
            valor={semLocalizacao}
            rotulo="sem localização no mapa"
            href="/admin/imoveis?visao=sem-mapa"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Distribuicao
          titulo="Como está a carteira"
          descricao="As mesmas cores do mapa."
          linhas={porCategoria}
        />
        <Distribuicao
          titulo="Situação do negócio"
          linhas={["disponivel", "negociacao", "vendido", "alugado"].map((s) => ({
            nome: rotuloSituacao(s),
            total: conta((i) => i.situacao === s),
          }))}
        />
        <Distribuicao titulo="Por bairro" linhas={agrupar("bairro")} />
        <Distribuicao titulo="Por tipo" linhas={agrupar("tipo")} />
      </div>
    </Pagina>
  );
}
