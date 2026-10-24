"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { criarMembro, type EstadoEquipe } from "@/app/actions/equipe";
import { Campo, Cartao, botao, campo } from "@/components/admin/ui";
import { apelidoDe } from "@/lib/equipe";
import { cn } from "@/lib/utils";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(botao.primario, "w-full sm:w-auto")}>
      {pending ? "Criando…" : "Criar acesso"}
    </button>
  );
}

export function TeamForm() {
  const [estado, acao] = useActionState<EstadoEquipe, FormData>(criarMembro, { ok: false });

  const [acesso, setAcesso] = useState<"nome" | "email">("nome");
  const [nome, setNome] = useState("");

  const apelido = apelidoDe(nome);
  const erro = (c: string) => estado.erros?.[c];

  return (
    <Cartao titulo="Criar acesso" descricao="Cadastre uma pessoa nova e passe a senha provisória para ela.">
      <form action={acao} className="grid gap-5">
        <Campo nome="nome" rotulo="Nome completo" erro={erro("nome")}>
          <input
            id="nome"
            name="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Maria Souza"
            className={campo}
          />
        </Campo>

        <fieldset>
          <legend className="text-sm font-medium">Como essa pessoa entra</legend>
          <div className="mt-1.5 grid auto-cols-fr grid-flow-col gap-1.5 rounded-xl bg-bg-subtle p-1">
            {(
              [
                { valor: "nome", rotulo: "Pelo nome" },
                { valor: "email", rotulo: "Por e-mail" },
              ] as const
            ).map((o) => (
              <label key={o.valor} className="min-w-0 cursor-pointer">
                <input
                  type="radio"
                  name="acesso"
                  value={o.valor}
                  checked={acesso === o.valor}
                  onChange={() => setAcesso(o.valor)}
                  className="peer sr-only"
                />
                <span className="flex min-h-10 items-center justify-center rounded-lg px-2 text-sm text-fg-muted transition-colors peer-checked:bg-bg-elevated peer-checked:font-medium peer-checked:text-fg peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
                  {o.rotulo}
                </span>
              </label>
            ))}
          </div>

          {acesso === "nome" ? (
            <p className="mt-2 text-xs text-fg-muted">
              {apelido ? (
                <>
                  Vai entrar digitando <span className="numeros font-medium text-fg">{apelido}</span>.
                  Esse acesso não recebe e-mail, então quem recupera a senha é um administrador,
                  aqui mesmo.
                </>
              ) : (
                "Escreva o nome acima para ver o usuário que será criado."
              )}
            </p>
          ) : null}
        </fieldset>

        {acesso === "email" ? (
          <Campo nome="email" rotulo="E-mail" erro={erro("email")}>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="pessoa@exemplo.com"
              className={campo}
            />
          </Campo>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            nome="role"
            rotulo="Nível de acesso"
            dica="Corretor cadastra imóveis e textos. Administrador também mexe em configurações, equipe e exclusões."
          >
            <select id="role" name="role" defaultValue="corretor" className={campo}>
              <option value="corretor">Corretor</option>
              <option value="admin">Administrador</option>
            </select>
          </Campo>

          <Campo
            nome="senha"
            rotulo="Senha provisória"
            dica="Passe para a pessoa; ela troca em Minha conta."
            erro={erro("senha")}
          >
            <input
              id="senha"
              name="senha"
              type="text"
              required
              minLength={8}
              autoComplete="off"
              placeholder="pelo menos 8 caracteres"
              className={campo}
            />
          </Campo>
        </div>

        {estado.mensagem ? (
          <p
            role="status"
            className={cn(
              "text-sm",
              estado.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400",
            )}
          >
            {estado.mensagem}
          </p>
        ) : null}

        <div>
          <Botao />
        </div>
      </form>
    </Cartao>
  );
}
