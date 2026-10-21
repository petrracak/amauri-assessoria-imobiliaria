import Link from "next/link";

import { PostFormulario } from "@/components/admin/post-form";
import { exigirPerfil } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Escrever texto" };

export default async function NovoPost() {
  await exigirPerfil();

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="text-sm text-fg-muted">
        <Link href="/admin/posts" className="transition-colors hover:text-fg">
          Blog
        </Link>
        <span className="px-2 text-fg-subtle">/</span>
        <span className="text-fg">Novo</span>
      </nav>

      <h1 className="mt-4 font-display text-display-sm">Escrever texto</h1>
      <p className="mt-2 max-w-[52ch] text-pretty leading-relaxed text-fg-muted">
        Salve como rascunho quantas vezes quiser. O texto só aparece no site
        quando a situação virar publicado.
      </p>

      <div className="mt-10">
        <PostFormulario />
      </div>
    </div>
  );
}
