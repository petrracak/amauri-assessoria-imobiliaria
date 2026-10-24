import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { apagarPost } from "@/app/actions/posts";
import { PostFormulario } from "@/components/admin/post-form";
import { Cabecalho, Cartao, Pagina, SeloSituacao, botao } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditarPost({ params }: { params: Params }) {
  const perfil = await exigirPerfil();
  const { id } = await params;

  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();

  if (!post) notFound();

  async function apagar() {
    "use server";
    await apagarPost(id);
    redirect("/admin/posts");
  }

  return (
    <Pagina largura="max-w-3xl">
      <Cabecalho
        voltar={{ href: "/admin/posts", rotulo: "Blog" }}
        titulo={post.titulo}
        descricao={<SeloSituacao situacao={post.status} />}
        acoes={
          post.status === "publicado" ? (
            <Link href={`/blog/${post.slug}`} target="_blank" className={botao.secundario}>
              <ExternalLink className="size-5" strokeWidth={1.6} />
              Ver no site
            </Link>
          ) : null
        }
      />

      <PostFormulario post={post} />

      {perfil.role === "admin" ? (
        <Cartao
          tom="perigo"
          titulo="Apagar texto"
          descricao="Remove o texto e a imagem de capa, sem volta. Para só tirar do ar, mude a situação para Rascunho."
        >
          <form action={apagar}>
            <button type="submit" className={botao.perigo}>
              Apagar definitivamente
            </button>
          </form>
        </Cartao>
      ) : null}
    </Pagina>
  );
}
