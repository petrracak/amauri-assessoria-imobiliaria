"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/client";

const MENSAGENS: Record<string, string> = {
  "link-invalido": "Esse link não é válido. Peça um novo abaixo.",
  "link-expirado": "O link expirou. Peça um novo abaixo.",
  "sem-acesso": "Esse e-mail não tem acesso ao painel. Fale com o administrador.",
  // PKCE: o link só vale no navegador que pediu.
  "outro-navegador":
    "Abra o link no mesmo aparelho em que você pediu o acesso, ou peça um novo aqui.",
};

function Formulario() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado">("parado");
  const [erro, setErro] = useState<string | null>(
    MENSAGENS[params.get("erro") ?? ""] ?? null,
  );

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEstado("enviando");

    const supabase = createClient();
    const destino = params.get("redirect") ?? "/admin";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(destino)}`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setEstado("parado");
      setErro(
        error.message.toLowerCase().includes("signups not allowed")
          ? "Esse e-mail não tem acesso ao painel. Fale com o administrador."
          : "Não deu para enviar o link agora. Tente de novo em instantes.",
      );
      return;
    }

    setEstado("enviado");
  }

  if (estado === "enviado") {
    return (
      <div>
        <h1 className="font-display text-display-sm">Link enviado</h1>
        <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
          Abra o e-mail que acabou de chegar em{" "}
          <span className="text-fg">{email}</span> e toque no link para entrar.
          Ele vale por uma hora.
        </p>
        <button
          type="button"
          onClick={() => setEstado("parado")}
          className="mt-8 text-sm text-accent underline-offset-4 hover:underline"
        >
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <h1 className="font-display text-display-sm">Entrar no painel</h1>
      <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
        Informe seu e-mail e enviamos um link de acesso. Não existe senha para
        guardar nem para perder.
      </p>

      <label htmlFor="email" className="mt-10 block text-sm text-fg-muted">
        Seu e-mail
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
        className="mt-2 w-full border-b border-border-strong bg-transparent py-3 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none"
      />

      {erro ? <p className="mt-3 text-sm text-fg">{erro}</p> : null}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-8 w-full rounded-full bg-accent px-7 py-3.5 text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Enviar link de acesso"}
      </button>
    </form>
  );
}

export default function Login() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-md">
        <Logo />
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
