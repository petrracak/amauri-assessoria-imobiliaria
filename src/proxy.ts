import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão a cada request e protege /admin.
 * Server Components não escrevem cookie, então a renovação acontece aqui.
 *
 * Chamava-se `middleware` até o Next 15; no 16 a convenção é `proxy`,
 * que roda sempre no runtime Node.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() confere a assinatura do token localmente, com a chave pública
  // do projeto (ES256, em cache). getUser() iria até o Supabase a cada toque
  // — uma viagem a Oregon, por página aberta. O token vale uma hora; a
  // renovação continua acontecendo aqui. Quem for suspenso perde o acesso na
  // checagem do perfil (exigirPerfil), que não depende do token.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const { pathname } = request.nextUrl;
  const painel = pathname.startsWith("/admin");
  const login = pathname === "/admin/login";

  if (painel && !login && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (login && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // tudo, menos estáticos e imagens
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
