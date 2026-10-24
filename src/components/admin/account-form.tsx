"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const entrada =
  "mt-2 w-full border-b border-border-strong bg-transparent py-3 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none";

const MINIMO = 8;

/**
 * Define ou troca a própria senha.
 *
 * Quem entrou por link cai aqui para criar uma senha e não depender mais
 * do e-mail — que é o caminho de quem acabou de ser adicionado à equipe.
 */
export function AccountForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < MINIMO) {
      setErro(`A senha precisa ter pelo menos ${MINIMO} caracteres.`);
      return;
    }
    if (senha !== confirma) {
      setErro("As duas senhas não são iguais.");
      return;
    }

    setOcupado(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: senha,
      data: { senha_propria: true },
    });
    setOcupado(false);

    if (error) {
      setErro(
        /should be different/i.test(error.message)
          ? "Escolha uma senha diferente da atual."
          : "Não deu para salvar agora. Tente de novo em instantes.",
      );
      return;
    }

    setSenha("");
    setConfirma("");
    setPronto(true);
    // O aviso de "crie uma senha" mora no layout: relê para ele sumir.
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="max-w-md">
      <h2 className="font-display text-2xl">Senha de acesso</h2>
      <p className="mt-3 text-pretty leading-relaxed text-fg-muted">
        Com uma senha definida você entra direto no painel, sem depender de
        link no e-mail. Definir de novo substitui a anterior.
      </p>

      <label htmlFor="senha" className="mt-8 block text-sm text-fg-muted">
        Senha nova
      </label>
      <input
        id="senha"
        type="password"
        required
        minLength={MINIMO}
        autoComplete="new-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="pelo menos 8 caracteres"
        className={entrada}
      />

      <label htmlFor="confirma" className="mt-7 block text-sm text-fg-muted">
        Repita a senha
      </label>
      <input
        id="confirma"
        type="password"
        required
        autoComplete="new-password"
        value={confirma}
        onChange={(e) => setConfirma(e.target.value)}
        className={entrada}
      />

      {erro ? <p className="mt-5 text-sm text-fg">{erro}</p> : null}
      {pronto ? (
        <p className="mt-5 text-sm text-accent">
          Senha salva. Use ela no próximo acesso.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={ocupado}
        className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {ocupado ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
