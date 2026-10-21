"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { salvarPost, type EstadoPost } from "@/app/actions/posts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const entrada =
  "mt-2 w-full border-b border-border-strong bg-transparent py-2.5 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none";

export type PostForm = {
  id?: string;
  titulo?: string;
  slug?: string;
  resumo?: string | null;
  conteudo?: string | null;
  categoria?: string | null;
  status?: string;
  capa_url?: string | null;
  capa_path?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

function Campo({
  nome,
  rotulo,
  dica,
  erro,
  children,
}: {
  nome: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={nome} className="block text-sm text-fg-muted">
        {rotulo}
      </label>
      {children}
      {dica && !erro ? <p className="mt-1.5 text-xs text-fg-subtle">{dica}</p> : null}
      {erro ? <p className="mt-1.5 text-xs text-fg">{erro}</p> : null}
    </div>
  );
}

function Salvar({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-7 py-3.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Salvando…" : novo ? "Criar texto" : "Salvar alterações"}
    </button>
  );
}

export function PostFormulario({ post }: { post?: PostForm }) {
  const novo = !post?.id;
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoPost, FormData>(salvarPost, { ok: false });

  const [capa, setCapa] = useState({
    url: post?.capa_url ?? "",
    path: post?.capa_path ?? "",
  });
  const [enviando, setEnviando] = useState(false);
  const [erroCapa, setErroCapa] = useState<string | null>(null);
  const inputCapa = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.ok && novo && estado.id) {
      router.replace(`/admin/posts/${estado.id}`);
    }
  }, [estado, novo, router]);

  async function enviarCapa(arquivo: File | undefined) {
    if (!arquivo) return;
    setErroCapa(null);
    setEnviando(true);

    const supabase = createClient();
    const ext = arquivo.name.split(".").pop() ?? "jpg";
    const caminho = `capas/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("blog")
      .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });

    if (error) {
      setErroCapa(error.message);
      setEnviando(false);
      return;
    }

    const { data } = supabase.storage.from("blog").getPublicUrl(caminho);
    setCapa({ url: data.publicUrl, path: caminho });
    setEnviando(false);
    if (inputCapa.current) inputCapa.current.value = "";
  }

  const erro = (campo: string) => estado.erros?.[campo];

  return (
    <form action={acao} className="max-w-3xl">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="capa_url" value={capa.url} />
      <input type="hidden" name="capa_path" value={capa.path} />

      <section>
        <h2 className="font-display text-2xl">Imagem de capa</h2>

        {capa.url ? (
          <div className="relative mt-5 aspect-[16/9] max-w-xl overflow-hidden bg-bg-subtle">
            <Image src={capa.url} alt="" fill sizes="576px" className="object-cover" />
            <button
              type="button"
              onClick={() => setCapa({ url: "", path: "" })}
              aria-label="Remover capa"
              className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white/90 text-brand-950 transition-colors hover:bg-white"
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputCapa.current?.click()}
            disabled={enviando}
            className="mt-5 flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <ImagePlus className="size-4" strokeWidth={1.5} />
            {enviando ? "Enviando…" : "Escolher imagem"}
          </button>
        )}

        <input
          ref={inputCapa}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => enviarCapa(e.target.files?.[0])}
        />
        {erroCapa ? <p className="mt-3 text-sm text-fg">{erroCapa}</p> : null}
      </section>

      <div className="mt-12 grid gap-6">
        <Campo nome="titulo" rotulo="Título" erro={erro("titulo")}>
          <input
            id="titulo"
            name="titulo"
            required
            defaultValue={post?.titulo}
            placeholder="O que olhar na documentação antes de fechar negócio"
            className={entrada}
          />
        </Campo>

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo nome="categoria" rotulo="Categoria" dica="Ex.: Mercado, Financiamento, Documentação.">
            <input
              id="categoria"
              name="categoria"
              defaultValue={post?.categoria ?? ""}
              className={entrada}
            />
          </Campo>

          <Campo nome="status" rotulo="Situação" dica="Rascunho não aparece no site.">
            <select
              id="status"
              name="status"
              defaultValue={post?.status ?? "rascunho"}
              className={entrada}
            >
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
            </select>
          </Campo>
        </div>

        <Campo
          nome="resumo"
          rotulo="Resumo"
          dica="Aparece na lista do blog e no Google. Duas linhas bastam."
        >
          <textarea
            id="resumo"
            name="resumo"
            rows={3}
            defaultValue={post?.resumo ?? ""}
            className={cn(entrada, "resize-y leading-relaxed")}
          />
        </Campo>

        <Campo
          nome="conteudo"
          rotulo="Texto"
          dica="## para título, ### para subtítulo, - para lista, > para citação, **negrito**, *itálico* e [texto](link)."
        >
          <textarea
            id="conteudo"
            name="conteudo"
            rows={22}
            defaultValue={post?.conteudo ?? ""}
            className={cn(entrada, "resize-y font-mono text-sm leading-relaxed")}
          />
        </Campo>

        <Campo
          nome="slug"
          rotulo="Endereço da página"
          dica="Deixe vazio para gerar a partir do título. Mudar depois quebra links já compartilhados."
        >
          <input
            id="slug"
            name="slug"
            defaultValue={post?.slug ?? ""}
            placeholder="documentacao-antes-de-fechar-negocio"
            className={entrada}
          />
        </Campo>
      </div>

      {estado.mensagem ? (
        <p className="mt-8 text-sm text-fg-muted">{estado.mensagem}</p>
      ) : null}

      <div className="mt-10">
        <Salvar novo={novo} />
      </div>
    </form>
  );
}
