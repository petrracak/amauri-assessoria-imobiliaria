import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Destino do link enviado por e-mail. Troca o token por uma sessão em cookie.
 *
 * Aceita os dois formatos que o Supabase pode mandar:
 *
 * - `code`: fluxo PKCE, que é o do template padrão. Só funciona no mesmo
 *   navegador que pediu o link, porque depende de um cookie gravado ali.
 * - `token_hash`: exige template customizado (e, no Supabase, SMTP próprio),
 *   mas funciona entre aparelhos — pedir o link no computador e abrir no
 *   celular, que é o caso da equipe em campo.
 *
 * Suportar os dois significa que o login não quebra quando o template mudar,
 * nem depende dele para começar a funcionar.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const destino = searchParams.get("next") ?? "/admin";
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) redirect("/admin/login?erro=link-expirado");
    redirect(destino);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirect("/admin/login?erro=outro-navegador");
    redirect(destino);
  }

  redirect("/admin/login?erro=link-invalido");
}
