import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { LeadForm } from "@/components/site/lead-form";
import { getPost, getPosts } from "@/lib/blog";
import { getConfig, linkWhatsApp } from "@/lib/settings";
import { RichText, resumoDe } from "@/lib/texto";
import { formatDate } from "@/lib/utils";

export const revalidate = 600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const posts = await getPosts(200);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Texto não encontrado" };

  const descricao =
    post.meta_description ?? post.resumo ?? resumoDe(post.conteudo ?? "");

  return {
    title: post.meta_title ?? post.titulo,
    description: descricao,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.titulo,
      description: descricao,
      publishedTime: post.publicado_em ?? undefined,
      images: post.capa_url ? [{ url: post.capa_url }] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [config, post] = await Promise.all([getConfig(), getPost(slug)]);

  if (!post) notFound();

  const whatsapp = linkWhatsApp(config.contato);
  const outros = (await getPosts(4)).filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <>
      <Header whatsapp={whatsapp} />

      <main>
        <article className="container-site py-12 lg:py-16">
          <nav className="text-sm text-fg-muted">
            <Link href="/blog" className="transition-colors hover:text-fg">
              Blog
            </Link>
            {post.categoria ? (
              <>
                <span className="px-2 text-fg-subtle">/</span>
                <Link
                  href={`/blog?categoria=${encodeURIComponent(post.categoria)}`}
                  className="transition-colors hover:text-fg"
                >
                  {post.categoria}
                </Link>
              </>
            ) : null}
          </nav>

          <header className="mt-6">
            {/* O limite fica no h1: `ch` acompanha a fonte do próprio elemento,
                e na div externa daria uma coluna estreitíssima. */}
            <h1 className="max-w-[20ch] text-balance font-display text-display-sm leading-tight lg:text-display-lg">
              {post.titulo}
            </h1>
          </header>

          <div className="numeros mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-subtle">
            {post.publicado_em ? <span>{formatDate(post.publicado_em)}</span> : null}
            {post.autor?.nome ? <span>por {post.autor.nome}</span> : null}
          </div>

          {post.capa_url ? (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden bg-bg-subtle">
              <Image
                src={post.capa_url}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 80vw"
                className="object-cover"
              />
            </div>
          ) : null}

          {post.resumo ? (
            <p className="mt-10 max-w-[58ch] text-pretty font-display text-xl leading-relaxed text-fg-muted lg:text-2xl">
              {post.resumo}
            </p>
          ) : null}

          {post.conteudo ? (
            // 68ch: linha confortável de ler, nem curta nem larga demais.
            <div className="mt-10 max-w-[68ch] text-[1.0625rem] text-fg-muted">
              <RichText texto={post.conteudo} />
            </div>
          ) : null}
        </article>

        <section className="campo-tinta linha-encontro">
          <div className="container-site max-w-2xl py-16 lg:py-20">
            <h2 className="text-balance font-display text-display-sm">
              Quer conversar sobre um imóvel?
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
              Deixe seu WhatsApp que a equipe entra em contato, ou fale direto
              com o Amauri.
            </p>
            <div className="mt-8">
              <LeadForm origem="blog-post" />
            </div>
          </div>
        </section>

        {outros.length > 0 ? (
          <section className="container-site py-16 lg:py-20">
            <h2 className="font-display text-display-sm">Outros textos</h2>
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {outros.map((outro) => (
                <Link key={outro.id} href={`/blog/${outro.slug}`} className="group block">
                  {outro.capa_url ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-bg-subtle">
                      <Image
                        src={outro.capa_url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <h3 className="mt-5 text-pretty font-display text-xl leading-tight transition-colors group-hover:text-accent">
                    {outro.titulo}
                  </h3>
                  {outro.publicado_em ? (
                    <p className="numeros mt-2 text-xs text-fg-subtle">
                      {formatDate(outro.publicado_em)}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer
        whatsapp={whatsapp}
        telefone={config.contato.telefone_exibicao}
        instagram={config.contato.instagram}
      />
    </>
  );
}
