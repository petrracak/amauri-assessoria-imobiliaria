import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Destino do link enviado por e-mail. Troca o token por uma sessão em cookie
 * e manda a pessoa para o painel.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const destino = searchParams.get("next") ?? "/admin";

  if (!token_hash || !type) {
    redirect("/admin/login?erro=link-invalido");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    redirect("/admin/login?erro=link-expirado");
  }

  redirect(destino);
}
