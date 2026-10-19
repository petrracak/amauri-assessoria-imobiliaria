"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { salvarImovel, type EstadoImovel } from "@/app/actions/imoveis";
import { cn } from "@/lib/utils";

const TIPOS = [
  "Apartamento",
  "Apartamento Duplex",
  "Casa",
  "Casa em Condomínio",
  "Terreno",
  "Terreno em Condomínio",
  "Sala Comercial",
];

export type ImovelForm = {
  id?: string;
  titulo?: string;
  tipo?: string;
  status?: string;
  bairro?: string | null;
  cidade?: string;
  endereco?: string | null;
  descricao?: string | null;
  badge?: string | null;
  preco?: number | null;
  preco_anterior?: number | null;
  dormitorios?: number | null;
  suites?: number | null;
  banheiros?: number | null;
  vagas?: number | null;
  area_total?: number | null;
  area_privativa?: number | null;
  destaque?: boolean;
  alto_padrao?: boolean;
};

function Campo({
  nome,
  rotulo,
  erro,
  dica,
  children,
  className,
}: {
  nome: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={nome} className="block text-sm text-fg-muted">
        {rotulo}
      </label>
      {children}
      {dica && !erro ? (
        <p className="mt-1.5 text-xs text-fg-subtle">{dica}</p>
      ) : null}
      {erro ? <p className="mt-1.5 text-xs text-fg">{erro}</p> : null}
    </div>
  );
}

const entrada =
  "mt-2 w-full border-b border-border-strong bg-transparent py-2.5 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none";

function Salvar({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-7 py-3.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Salvando…" : novo ? "Cadastrar imóvel" : "Salvar alterações"}
    </button>
  );
}

export function PropertyForm({ imovel }: { imovel?: ImovelForm }) {
  const novo = !imovel?.id;
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoImovel, FormData>(salvarImovel, {
    ok: false,
  });

  // Depois de cadastrar, segue para a edição — é lá que entram as fotos.
  useEffect(() => {
    if (estado.ok && novo && estado.id) {
      router.replace(`/admin/imoveis/${estado.id}`);
    }
  }, [estado, novo, router]);

  const erro = (campo: string) => estado.erros?.[campo];

  return (
    <form action={acao} className="max-w-3xl">
      {imovel?.id ? <input type="hidden" name="id" value={imovel.id} /> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Campo nome="titulo" rotulo="Título do anúncio" erro={erro("titulo")} className="sm:col-span-2">
          <input
            id="titulo"
            name="titulo"
            required
            defaultValue={imovel?.titulo}
            placeholder="Apartamento no Edifício Orion Palace"
            className={entrada}
          />
        </Campo>

        <Campo nome="tipo" rotulo="Tipo" erro={erro("tipo")}>
          <select id="tipo" name="tipo" defaultValue={imovel?.tipo ?? "Apartamento"} className={entrada}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>

        <Campo nome="status" rotulo="Situação" dica="Rascunho não aparece no site.">
          <select id="status" name="status" defaultValue={imovel?.status ?? "rascunho"} className={entrada}>
            <option value="rascunho">Rascunho</option>
            <option value="publicado">Publicado</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </Campo>

        <Campo nome="bairro" rotulo="Bairro">
          <input id="bairro" name="bairro" defaultValue={imovel?.bairro ?? ""} className={entrada} />
        </Campo>

        <Campo nome="cidade" rotulo="Cidade">
          <input id="cidade" name="cidade" defaultValue={imovel?.cidade ?? "Santarém"} className={entrada} />
        </Campo>

        <Campo
          nome="endereco"
          rotulo="Endereço"
          dica="Deixe vazio para não exibir o endereço no site."
          className="sm:col-span-2"
        >
          <input id="endereco" name="endereco" defaultValue={imovel?.endereco ?? ""} className={entrada} />
        </Campo>

        <Campo nome="preco" rotulo="Preço (R$)" erro={erro("preco")}>
          <input
            id="preco"
            name="preco"
            inputMode="decimal"
            defaultValue={imovel?.preco ?? ""}
            placeholder="750000"
            className={cn(entrada, "numeros")}
          />
        </Campo>

        <Campo nome="preco_anterior" rotulo="Preço anterior (R$)" dica="Aparece riscado, para mostrar desconto.">
          <input
            id="preco_anterior"
            name="preco_anterior"
            inputMode="decimal"
            defaultValue={imovel?.preco_anterior ?? ""}
            className={cn(entrada, "numeros")}
          />
        </Campo>
      </div>

      <fieldset className="mt-10">
        <legend className="font-display text-xl">Números do imóvel</legend>
        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {[
            { nome: "dormitorios", rotulo: "Dormitórios" },
            { nome: "suites", rotulo: "Suítes" },
            { nome: "banheiros", rotulo: "Banheiros" },
            { nome: "vagas", rotulo: "Vagas" },
            { nome: "area_privativa", rotulo: "Área privativa (m²)" },
            { nome: "area_total", rotulo: "Área total (m²)" },
          ].map((campo) => (
            <Campo key={campo.nome} nome={campo.nome} rotulo={campo.rotulo}>
              <input
                id={campo.nome}
                name={campo.nome}
                inputMode="decimal"
                defaultValue={
                  (imovel?.[campo.nome as keyof ImovelForm] as number | null) ?? ""
                }
                className={cn(entrada, "numeros")}
              />
            </Campo>
          ))}
        </div>
      </fieldset>

      <Campo
        nome="descricao"
        rotulo="Descrição"
        dica="Uma linha em branco separa parágrafos no site."
        className="mt-10"
      >
        <textarea
          id="descricao"
          name="descricao"
          rows={10}
          defaultValue={imovel?.descricao ?? ""}
          className={cn(entrada, "resize-y leading-relaxed")}
        />
      </Campo>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Campo nome="badge" rotulo="Selo" dica="Ex.: ÚLTIMAS UNIDADES. Vazio não mostra nada.">
          <input id="badge" name="badge" defaultValue={imovel?.badge ?? ""} className={entrada} />
        </Campo>

        <div className="flex flex-col justify-end gap-4 pb-1">
          <label className="flex items-center gap-3 text-[0.9375rem]">
            <input
              type="checkbox"
              name="destaque"
              defaultChecked={imovel?.destaque}
              className="size-4 accent-[var(--accent)]"
            />
            Mostrar em destaque na home
          </label>
          <label className="flex items-center gap-3 text-[0.9375rem]">
            <input
              type="checkbox"
              name="alto_padrao"
              defaultChecked={imovel?.alto_padrao}
              className="size-4 accent-[var(--accent)]"
            />
            Alto padrão
          </label>
        </div>
      </div>

      {estado.mensagem ? (
        <p className="mt-8 text-sm text-fg-muted">{estado.mensagem}</p>
      ) : null}

      <div className="mt-10 flex items-center gap-4">
        <Salvar novo={novo} />
      </div>
    </form>
  );
}
