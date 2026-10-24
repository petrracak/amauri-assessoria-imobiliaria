"use client";

import { KeyRound, UserRoundX, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { alterarPapel, alterarSituacao, definirSenhaDe } from "@/app/actions/equipe";
import { Avatar } from "@/components/admin/avatar";
import { Selo, botao, campo } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export type Membro = {
  id: string;
  nome: string;
  email: string | null;
  usuario: string | null;
  role: "admin" | "corretor";
  ativo: boolean;
  avatar_url: string | null;
};

export function TeamRow({ membro, euSou }: { membro: Membro; euSou: string }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [trocando, setTrocando] = useState(false);
  const [senha, setSenha] = useState("");
  const [aviso, setAviso] = useState<{ texto: string; ok: boolean } | null>(null);

  const souEu = membro.id === euSou;

  function executar(acao: () => Promise<{ ok: boolean; mensagem?: string }>) {
    startTransition(async () => {
      const r = await acao();
      setAviso(r.mensagem ? { texto: r.mensagem, ok: r.ok } : null);
      router.refresh();
    });
  }

  return (
    <li
      className={cn(
        "min-w-0 rounded-2xl border border-border-base bg-bg-elevated p-4 shadow-[var(--shadow-card)]",
        !membro.ativo && "opacity-75",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar url={membro.avatar_url} nome={membro.nome} tamanho="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">
            {membro.nome}
            {souEu ? <span className="font-normal text-fg-subtle"> · você</span> : null}
          </p>
          <p className="numeros truncate text-sm text-fg-muted">{membro.usuario ?? membro.email}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Selo tom={membro.role === "admin" ? "azul" : "cinza"}>
            {membro.role === "admin" ? "Admin" : "Corretor"}
          </Selo>
          {!membro.ativo ? <Selo tom="ambar">Suspenso</Selo> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="block">
          <span className="sr-only">Nível de acesso de {membro.nome}</span>
          <select
            value={membro.role}
            disabled={pendente || souEu}
            onChange={(e) =>
              executar(() => alterarPapel(membro.id, e.target.value as "admin" | "corretor"))
            }
            className={cn(campo, "!mt-0 !min-h-11")}
          >
            <option value="corretor">Corretor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => setTrocando((v) => !v)}
          aria-expanded={trocando}
          className={cn(botao.secundario, "!min-h-11")}
        >
          <KeyRound className="size-[1.1rem]" strokeWidth={1.6} />
          Definir senha
        </button>

        {!souEu ? (
          <button
            type="button"
            disabled={pendente}
            onClick={() => executar(() => alterarSituacao(membro.id, !membro.ativo))}
            className={cn(botao.suave, "!min-h-11")}
          >
            {membro.ativo ? (
              <>
                <UserRoundX className="size-[1.1rem]" strokeWidth={1.6} />
                Suspender
              </>
            ) : (
              <>
                <UserRoundCheck className="size-[1.1rem]" strokeWidth={1.6} />
                Reativar
              </>
            )}
          </button>
        ) : null}
      </div>

      {trocando ? (
        <form
          className="mt-3 rounded-xl bg-bg-subtle p-3"
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
          <label htmlFor={`senha-${membro.id}`} className="block text-sm font-medium">
            Nova senha para {membro.nome.split(" ")[0]}
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={`senha-${membro.id}`}
              type="text"
              required
              minLength={8}
              autoComplete="off"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="pelo menos 8 caracteres"
              className={cn(campo, "!mt-0 min-w-0 flex-1")}
            />
            <button type="submit" disabled={pendente} className={botao.primario}>
              Salvar
            </button>
          </div>
        </form>
      ) : null}

      {aviso ? (
        <p
          role="status"
          className={cn(
            "mt-3 text-sm",
            aviso.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}
    </li>
  );
}
