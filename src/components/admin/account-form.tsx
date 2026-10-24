"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Campo, Cartao, botao, campo } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
    <Cartao
      titulo="Senha de acesso"
      descricao="Com uma senha definida você entra direto no painel, sem depender de link no e-mail. Definir de novo substitui a anterior."
    >
      <form onSubmit={salvar} className="grid gap-5">
        <Campo nome="senha" rotulo="Senha nova">
          <input
            id="senha"
            type="password"
            required
            minLength={MINIMO}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="pelo menos 8 caracteres"
            className={campo}
          />
        </Campo>

        <Campo nome="confirma" rotulo="Repita a senha">
          <input
            id="confirma"
            type="password"
            required
            autoComplete="new-password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            className={campo}
          />
        </Campo>

        {erro ? (
          <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
            {erro}
          </p>
        ) : null}
        {pronto ? (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
            Senha salva. Use ela no próximo acesso.
          </p>
        ) : null}

        <div>
          <button type="submit" disabled={ocupado} className={cn(botao.primario, "w-full sm:w-auto")}>
            {ocupado ? "Salvando…" : "Salvar senha"}
          </button>
        </div>
      </form>
    </Cartao>
  );
}
