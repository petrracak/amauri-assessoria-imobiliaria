import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm">Blog</h1>
          <p className="numeros mt-2 text-fg-muted">
            {posts?.length ?? 0} {posts?.length === 1 ? "texto" : "textos"}
          </p>
        </div>
        <Link
          href="/admin/posts/novo"
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" strokeWidth={2} />
          Escrever texto
        </Link>
      </div>

      {posts?.length ? (
        <ul className="mt-10 divide-y divide-border-base border-y border-border-base">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/posts/${post.id}`}
                className="flex items-center gap-4 py-3 transition-colors hover:bg-bg-subtle"
              >
                <div className="relative size-16 shrink-0 overflow-hidden bg-bg-subtle">
                  {post.capa_url ? (
                    <Image
                      src={post.capa_url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem]">{post.titulo}</p>
                  <p className="truncate text-sm text-fg-muted">
                    {post.categoria ?? "sem categoria"}
                  </p>
                </div>

                <div className="hidden text-right sm:block">
                  <p
                    className={cn(
                      "text-xs capitalize",
                      post.status === "publicado" ? "text-accent" : "text-fg-muted",
                    )}
                  >
                    {post.status}
                  </p>
                  {post.publicado_em ? (
                    <p className="numeros text-xs text-fg-subtle">
                      {formatDate(post.publicado_em)}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 border-t border-border-base pt-10">
          <p className="font-display text-2xl">Nenhum texto ainda.</p>
          <p className="mt-3 max-w-[50ch] text-pretty leading-relaxed text-fg-muted">
            O blog aparece no site assim que o primeiro texto for publicado.
            Dúvidas que o cliente repete no WhatsApp costumam render bons temas.
          </p>
          <Link
            href="/admin/posts/novo"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm text-accent-fg"
          >
            Escrever o primeiro
          </Link>
        </div>
      )}
    </div>
  );
}
