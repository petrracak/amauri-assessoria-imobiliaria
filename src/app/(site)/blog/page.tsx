import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { LeadForm } from "@/components/site/lead-form";
import { getCategorias, getPosts, type PostCard } from "@/lib/blog";
import { getConfig, linkWhatsApp } from "@/lib/settings";
import { cn, formatDate } from "@/lib/utils";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Mercado imobiliário de Santarém, financiamento, documentação e o que observar antes de comprar.",
};

type Params = Promise<Record<string, string | string[] | undefined>>;

function Cartao({ post, destaque = false }: { post: PostCard; destaque?: boolean }) {
  return (
    <article>
      <Link href={`/blog/${post.slug}`} className="group block">
        {/* Sem capa não há moldura: um retângulo cinza vazio só ocupa espaço. */}
        {post.capa_url ? (
          <div
            className={cn(
              "relative overflow-hidden bg-bg-subtle",
              destaque ? "aspect-[16/9]" : "aspect-[4/3]",
            )}
          >
            <Image
              src={post.capa_url}
              alt=""
              fill
              priority={destaque}
              sizes={destaque ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
              className="object-cover"
            />
          </div>
        ) : null}

        <div className={post.capa_url ? "pt-5" : ""}>
          {post.categoria ? (
            <p className="text-xs text-fg-subtle">{post.categoria}</p>
          ) : null}

          <h2
            className={cn(
              "mt-2 text-pretty font-display leading-tight transition-colors group-hover:text-accent",
              destaque ? "text-display-sm" : "text-2xl",
            )}
          >
            {post.titulo}
          </h2>

          {post.resumo ? (
            <p className="mt-3 max-w-[60ch] text-pretty leading-relaxed text-fg-muted">
              {post.resumo}
            </p>
          ) : null}

          {post.publicado_em ? (
            <p className="numeros mt-4 text-xs text-fg-subtle">
              {formatDate(post.publicado_em)}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export default async function Blog({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const categoria = typeof params.categoria === "string" ? params.categoria : undefined;

  const [config, posts, categorias] = await Promise.all([
    getConfig(),
    getPosts(24, categoria),
    getCategorias(),
  ]);

  const whatsapp = linkWhatsApp(config.contato);
  const [principal, ...demais] = posts;

  return (
    <>
      <Header whatsapp={whatsapp} />

      <main className="container-site py-12 lg:py-16">
        <h1 className="max-w-[20ch] text-balance font-display text-display-sm lg:text-display-lg">
          Antes de comprar, vale entender
        </h1>
        <p className="mt-4 max-w-[52ch] text-pretty leading-relaxed text-fg-muted">
          Financiamento, documentação, mercado de Santarém e o que costuma
          passar despercebido numa visita.
        </p>

        {categorias.length > 0 ? (
          <div className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
            <Link
              href="/blog"
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                !categoria
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              Tudo
            </Link>
            {categorias.map((c) => (
              <Link
                key={c.nome}
                href={`/blog?categoria=${encodeURIComponent(c.nome)}`}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                  categoria === c.nome
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border-base text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {c.nome} <span className="numeros opacity-60">{c.total}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {principal ? (
          <div className="mt-12 grid gap-x-8 gap-y-14 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <Cartao post={principal} destaque />
            </div>
            {demais.map((post) => (
              <Cartao key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-16 border-t border-border-base pt-10">
            <p className="font-display text-2xl">Ainda não há textos publicados.</p>
            <p className="mt-3 max-w-[50ch] text-pretty leading-relaxed text-fg-muted">
              {categoria
                ? "Nada nessa categoria por enquanto."
                : "Os artigos da assessoria aparecem aqui assim que o primeiro for ao ar."}
            </p>
            {categoria ? (
              <Link
                href="/blog"
                className="mt-6 inline-block rounded-full border border-border-strong px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent"
              >
                Ver todos os textos
              </Link>
            ) : null}
          </div>
        )}
      </main>

      <section className="campo-tinta linha-encontro">
        <div className="container-site max-w-2xl py-16 lg:py-20">
          <h2 className="text-balance font-display text-display-sm">
            Receba os imóveis novos antes de todo mundo
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
            Deixe seu WhatsApp e avisamos quando entrar um imóvel com o perfil
            que você procura.
          </p>
          <div className="mt-8">
            <LeadForm origem="blog" />
          </div>
        </div>
      </section>

      <Footer
        whatsapp={whatsapp}
        telefone={config.contato.telefone_exibicao}
        instagram={config.contato.instagram}
      />
    </>
  );
}
