import { PostFormulario } from "@/components/admin/post-form";
import { Cabecalho, Pagina } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Escrever texto" };

export default async function NovoPost() {
  await exigirPerfil();

  return (
    <Pagina largura="max-w-3xl">
      <Cabecalho
        voltar={{ href: "/admin/posts", rotulo: "Blog" }}
        titulo="Escrever texto"
        descricao="Salve como rascunho quantas vezes quiser. O texto só aparece no site quando a situação for No ar."
      />
      <PostFormulario />
    </Pagina>
  );
}
