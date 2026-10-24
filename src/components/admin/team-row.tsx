"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { alterarPapel, alterarSituacao, definirSenhaDe } from "@/app/actions/equipe";
import { cn } from "@/lib/utils";

export type Membro = {
  id: string;
  nome: string;
  email: string | null;
  usuario: string | null;
  role: "admin" | "corretor";
  ativo: boolean;
};

export function TeamRow({ membro, euSou }: { membro: Membro; euSou: string }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [trocando, setTrocando] = useState(false);
  const [senha, setSenha] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const souEu = membro.id === euSou;

  function executar(acao: () => Promise<{ ok: boolean; mensagem?: string }>) {
    startTransition(async () => {
      const r = await acao();
      setAviso(r.mensagem ?? null);
      router.refresh();
    });
  }

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem]">
            {membro.nome}
            {souEu ? <span className="text-fg-subtle"> · você</span> : null}
          </p>
          <p className="numeros truncate text-sm text-fg-muted">
            {membro.usuario ?? membro.email}
          </p>
        </div>

        {!membro.ativo ? (
          <span className="rounded-full border border-border-base px-3 py-1 text-xs text-fg-subtle">
            suspenso
          </span>
        ) : null}

        <select
          value={membro.role}
          disabled={pendente || souEu}
          onChange={(e) =>
            executar(() =>
              alterarPapel(membro.id, e.target.value as "admin" | "corretor"),
            )
          }
          aria-label={`Nível de acesso de ${membro.nome}`}
          className="rounded-full border border-border-base bg-transparent px-3 py-2 text-sm text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
        >
          <option value="corretor">Corretor</option>
          <option value="admin">Administrador</option>
        </select>

        <button
          type="button"
          onClick={() => setTrocando((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border-base px-4 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <KeyRound className="size-4" strokeWidth={1.5} />
          Senha
        </button>

        {!souEu ? (
          <button
            type="button"
            disabled={pendente}
            onClick={() => executar(() => alterarSituacao(membro.id, !membro.ativo))}
            className="rounded-full border border-border-base px-4 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-50"
          >
            {membro.ativo ? "Suspender" : "Reativar"}
          </button>
        ) : null}
      </div>

      {trocando ? (
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            executar(async () => {
              const r = await definirSenhaDe(membro.id, senha);
              if (r.ok) {
                setSenha("");
                setTrocando(false);
              }
              return r;
            });
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <label
              htmlFor={`senha-${membro.id}`}
              className="block text-xs text-fg-muted"
            >
              Nova senha para {membro.nome}
            </label>
            <input
              id={`senha-${membro.id}`}
              type="text"
              required
              minLength={8}
              autoComplete="off"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="pelo menos 8 caracteres"
              className="mt-2 w-full border-b border-border-strong bg-transparent py-2 text-sm placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-full bg-accent px-5 py-2.5 text-sm text-accent-fg disabled:opacity-60"
          >
            Salvar
          </button>
        </form>
      ) : null}

      {aviso ? <p className={cn("mt-3 text-sm text-fg-muted")}>{aviso}</p> : null}
    </li>
  );
}
