"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/client";

const MENSAGENS: Record<string, string> = {
  "link-invalido": "Esse link não é válido. Entre com sua senha abaixo.",
  "link-expirado": "O link expirou. Entre com sua senha abaixo.",
  "sem-acesso": "Esse e-mail não tem acesso ao painel. Fale com o administrador.",
  "outro-navegador":
    "Abra o link no mesmo aparelho em que você pediu o acesso, ou entre com a senha.",
};

const entrada =
  "mt-2 w-full border-b border-border-strong bg-transparent py-3 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none";

function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get("redirect") ?? "/admin";

  const [modo, setModo] = useState<"senha" | "link">("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(
    MENSAGENS[params.get("erro") ?? ""] ?? null,
  );

  async function entrarComSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setOcupado(false);
      setErro(
        /invalid login credentials/i.test(error.message)
          ? "E-mail ou senha não conferem."
          : "Não deu para entrar agora. Tente de novo em instantes.",
      );
      return;
    }

    // refresh() faz o servidor reler a sessão recém-gravada no cookie.
    router.replace(destino);
    router.refresh();
  }

  async function pedirLink(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(destino)}`,
        shouldCreateUser: false,
      },
    });

    setOcupado(false);

    if (error) {
      setErro(
        /signups not allowed/i.test(error.message)
          ? "Esse e-mail não tem acesso ao painel. Fale com o administrador."
          : "Não deu para enviar o link agora. Entre com sua senha.",
      );
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div>
        <h1 className="font-display text-display-sm">Link enviado</h1>
        <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
          Abra o e-mail que chegou em <span className="text-fg">{email}</span> e
          toque no link. Ele vale por uma hora.
        </p>
        <button
          type="button"
          onClick={() => {
            setEnviado(false);
            setModo("senha");
          }}
          className="mt-8 text-sm text-accent underline-offset-4 hover:underline"
        >
          Entrar com senha
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={modo === "senha" ? entrarComSenha : pedirLink}>
      <h1 className="font-display text-display-sm">Entrar no painel</h1>
      <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
        {modo === "senha"
          ? "Use o e-mail e a senha do seu acesso."
          : "Informe seu e-mail e enviamos um link de acesso."}
      </p>

      <label htmlFor="email" className="mt-10 block text-sm text-fg-muted">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nome@exemplo.com"
        className={entrada}
      />

      {modo === "senha" ? (
        <>
          <label htmlFor="senha" className="mt-7 block text-sm text-fg-muted">
            Senha
          </label>
          <div className="relative">
            <input
              id="senha"
              type={verSenha ? "text" : "password"}
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className={`${entrada} pr-12`}
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
              className="absolute bottom-3 right-0 text-fg-subtle transition-colors hover:text-fg"
            >
              {verSenha ? (
                <EyeOff className="size-5" strokeWidth={1.5} />
              ) : (
                <Eye className="size-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </>
      ) : null}

      {erro ? <p className="mt-5 text-sm text-fg">{erro}</p> : null}

      <button
        type="submit"
        disabled={ocupado}
        className="mt-9 w-full rounded-full bg-accent px-7 py-3.5 text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {ocupado
          ? "Aguarde…"
          : modo === "senha"
            ? "Entrar"
            : "Enviar link de acesso"}
      </button>

      <button
        type="button"
        onClick={() => {
          setModo(modo === "senha" ? "link" : "senha");
          setErro(null);
        }}
        className="mt-6 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
      >
        {modo === "senha"
          ? "Esqueci a senha, quero um link por e-mail"
          : "Prefiro entrar com minha senha"}
      </button>
    </form>
  );
}

export default function Login() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-md">
        <Logo tamanho="sm" />
        <div className="mt-12">
          <Suspense fallback={null}>
            <Formulario />
          </Suspense>
        </div>
        <Link
          href="/"
          className="mt-12 inline-block text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}
