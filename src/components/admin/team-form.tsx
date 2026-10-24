"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { criarMembro, type EstadoEquipe } from "@/app/actions/equipe";
import { apelidoDe } from "@/lib/equipe";
import { cn } from "@/lib/utils";

const entrada =
  "mt-2 w-full border-b border-border-strong bg-transparent py-2.5 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-7 py-3.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Criando…" : "Criar acesso"}
    </button>
  );
}

export function TeamForm() {
  const [estado, acao] = useActionState<EstadoEquipe, FormData>(criarMembro, {
    ok: false,
  });

  const [acesso, setAcesso] = useState<"nome" | "email">("nome");
  const [nome, setNome] = useState("");

  const apelido = apelidoDe(nome);
  const erro = (campo: string) => estado.erros?.[campo];

  return (
    <form action={acao} className="max-w-xl">
      <h2 className="font-display text-2xl">Criar acesso</h2>

      <div className="mt-7">
        <label htmlFor="nome" className="block text-sm text-fg-muted">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Josué Ferreira"
          className={entrada}
        />
        {erro("nome") ? (
          <p className="mt-1.5 text-xs text-fg">{erro("nome")}</p>
        ) : null}
      </div>

      <fieldset className="mt-8">
        <legend className="text-sm text-fg-muted">Como essa pessoa entra</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { valor: "nome", rotulo: "Pelo nome" },
              { valor: "email", rotulo: "Por e-mail" },
            ] as const
          ).map((opcao) => (
            <label
              key={opcao.valor}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors",
                acesso === opcao.valor
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              <input
                type="radio"
                name="acesso"
                value={opcao.valor}
                checked={acesso === opcao.valor}
                onChange={() => setAcesso(opcao.valor)}
                className="sr-only"
              />
              {opcao.rotulo}
            </label>
          ))}
        </div>

        {acesso === "nome" ? (
          <p className="mt-3 text-xs text-fg-subtle">
            {apelido ? (
              <>
                Vai entrar digitando{" "}
                <span className="numeros text-fg">{apelido}</span>. Esse acesso
                não recebe e-mail, então quem recupera a senha é um
                administrador, por aqui.
              </>
            ) : (
              "Escreva o nome acima para ver o usuário que será criado."
            )}
          </p>
        ) : null}
      </fieldset>

      {acesso === "email" ? (
        <div className="mt-8">
          <label htmlFor="email" className="block text-sm text-fg-muted">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="pessoa@exemplo.com"
            className={entrada}
          />
          {erro("email") ? (
            <p className="mt-1.5 text-xs text-fg">{erro("email")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="role" className="block text-sm text-fg-muted">
            Nível de acesso
          </label>
          <select id="role" name="role" defaultValue="corretor" className={entrada}>
            <option value="corretor">Corretor</option>
            <option value="admin">Administrador</option>
          </select>
          <p className="mt-1.5 text-xs text-fg-subtle">
            Corretor cadastra imóveis e textos. Administrador também mexe em
            configurações, equipe e exclusões.
          </p>
        </div>

        <div>
          <label htmlFor="senha" className="block text-sm text-fg-muted">
            Senha temporária
          </label>
          <input
            id="senha"
            name="senha"
            type="text"
            required
            minLength={8}
            autoComplete="off"
            placeholder="pelo menos 8 caracteres"
            className={entrada}
          />
          <p className="mt-1.5 text-xs text-fg-subtle">
            Passe para a pessoa e peça para ela trocar em Conta.
          </p>
          {erro("senha") ? (
            <p className="mt-1.5 text-xs text-fg">{erro("senha")}</p>
          ) : null}
        </div>
      </div>

      {estado.mensagem ? (
        <p
          className={cn(
            "mt-8 text-sm",
            estado.ok ? "text-accent" : "text-fg",
          )}
        >
          {estado.mensagem}
        </p>
      ) : null}

      <div className="mt-9">
        <Botao />
      </div>
    </form>
  );
}
