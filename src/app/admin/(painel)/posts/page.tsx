import { Newspaper, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Cabecalho, Pagina, SeloSituacao, Vazio, botao } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function AdminPosts() {
  await exigirPerfil();

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, titulo, slug, categoria, status, publicado_em, capa_url, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  const total = posts?.length ?? 0;

  return (
    <Pagina largura="max-w-4xl">
      <Cabecalho
        titulo="Blog"
        descricao={`${total} ${total === 1 ? "texto" : "textos"}`}
        acoes={
          <Link href="/admin/posts/novo" className={cn(botao.primario, "hidden sm:inline-flex")}>
            <Plus className="size-5" strokeWidth={2} />
            Escrever texto
          </Link>
        }
      />

      {total ? (
        <ul className="grid gap-3">
          {posts!.map((post) => (
            <li key={post.id} className="min-w-0">
              <Link
                href={`/admin/posts/${post.id}`}
                className="flex min-w-0 gap-3 rounded-2xl border border-border-base bg-bg-elevated p-3 shadow-[var(--shadow-card)] transition-colors hover:border-border-strong active:scale-[0.99]"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-bg-subtle">
                  {post.capa_url ? (
                    <Image src={post.capa_url} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <Newspaper
                      className="absolute inset-0 m-auto size-6 text-fg-subtle"
                      strokeWidth={1.4}
                    />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[0.9375rem] font-medium leading-snug">
                      {post.titulo}
                    </p>
                    <p className="mt-1 truncate text-sm text-fg-muted">
                      {post.categoria ?? "sem categoria"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <SeloSituacao situacao={post.status} />
                    {post.publicado_em ? (
                      <span className="numeros text-xs text-fg-subtle">
                        {formatDate(post.publicado_em)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio
          icone={Newspaper}
          titulo="Nenhum texto ainda"
          texto="O blog aparece no site assim que o primeiro texto for publicado. Dúvidas que o cliente repete no WhatsApp costumam render bons temas."
          acao={
            <Link href="/admin/posts/novo" className={botao.primario}>
              <Plus className="size-5" strokeWidth={2} />
              Escrever o primeiro
            </Link>
          }
        />
      )}
    </Pagina>
  );
}
