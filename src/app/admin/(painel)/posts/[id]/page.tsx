import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { apagarPost } from "@/app/actions/posts";
import { PostFormulario } from "@/components/admin/post-form";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditarPost({ params }: { params: Params }) {
  const perfil = await exigirPerfil();
  const { id } = await params;

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  async function apagar() {
    "use server";
    await apagarPost(id);
    redirect("/admin/posts");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="text-sm text-fg-muted">
        <Link href="/admin/posts" className="transition-colors hover:text-fg">
          Blog
        </Link>
        <span className="px-2 text-fg-subtle">/</span>
        <span className="text-fg">Editar</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-balance font-display text-display-sm">{post.titulo}</h1>
          <p className="mt-2 text-sm capitalize text-fg-muted">{post.status}</p>
        </div>

        {post.status === "publicado" ? (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-full border border-border-base px-4 py-2.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <ExternalLink className="size-4" strokeWidth={1.5} />
            Ver no site
          </Link>
        ) : null}
      </div>

      <div className="mt-12">
        <PostFormulario post={post} />
      </div>

      {perfil.role === "admin" ? (
        <div className="mt-20 border-t border-border-base pt-10">
          <h2 className="font-display text-xl">Apagar texto</h2>
          <p className="mt-2 max-w-[52ch] text-pretty text-sm leading-relaxed text-fg-muted">
            Remove o texto e a imagem de capa, sem volta. Para só tirar do ar,
            mude a situação para rascunho.
          </p>
          <form action={apagar} className="mt-5">
            <button
              type="submit"
              className="rounded-full border border-border-strong px-5 py-2.5 text-sm transition-colors hover:border-fg hover:text-fg"
            >
              Apagar definitivamente
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
