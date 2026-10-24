"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { salvarPost, type EstadoPost } from "@/app/actions/posts";
import {
  BarraSalvar,
  Campo,
  Cartao,
  Segmentos,
  botao,
  campo,
} from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

function Salvar({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(botao.primario, "flex-1 sm:flex-none")}>
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
    <form action={acao} className="space-y-4">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="capa_url" value={capa.url} />
      <input type="hidden" name="capa_path" value={capa.path} />

      <Cartao titulo="Imagem de capa">
        {capa.url ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-bg-subtle">
            <Image src={capa.url} alt="" fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
            <button
              type="button"
              onClick={() => setCapa({ url: "", path: "" })}
              aria-label="Remover capa"
              className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-white/95 text-red-600 transition-transform active:scale-90"
            >
              <Trash2 className="size-[1.15rem]" strokeWidth={1.7} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputCapa.current?.click()}
            disabled={enviando}
            className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-fg-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            <ImagePlus className="size-7" strokeWidth={1.4} />
            <span className="text-sm font-medium">{enviando ? "Enviando…" : "Escolher imagem"}</span>
          </button>
        )}

        <input
          ref={inputCapa}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => enviarCapa(e.target.files?.[0])}
        />
        {erroCapa ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {erroCapa}
          </p>
        ) : null}
      </Cartao>

      <Cartao titulo="Sobre o texto">
        <div className="grid gap-5">
          <Campo nome="titulo" rotulo="Título" erro={erro("titulo")}>
            <input
              id="titulo"
              name="titulo"
              required
              defaultValue={post?.titulo}
              placeholder="O que olhar na documentação antes de fechar negócio"
              className={campo}
            />
          </Campo>

          <Campo nome="categoria" rotulo="Categoria" dica="Ex.: Mercado, Financiamento, Documentação.">
            <input id="categoria" name="categoria" defaultValue={post?.categoria ?? ""} className={campo} />
          </Campo>

          <div>
            <span className="block text-sm font-medium">Situação</span>
            <Segmentos
              nome="status"
              valor={post?.status ?? "rascunho"}
              opcoes={[
                { valor: "rascunho", rotulo: "Rascunho" },
                { valor: "publicado", rotulo: "No ar" },
              ]}
            />
            <p className="mt-1.5 text-xs text-fg-muted">Rascunho não aparece no site.</p>
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
              className={cn(campo, "resize-y leading-relaxed")}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Texto">
        <Campo
          nome="conteudo"
          rotulo="Conteúdo"
          dica="## para título, ### para subtítulo, - para lista, > para citação, **negrito**, *itálico* e [texto](link)."
        >
          <textarea
            id="conteudo"
            name="conteudo"
            rows={18}
            defaultValue={post?.conteudo ?? ""}
            className={cn(campo, "resize-y font-mono leading-relaxed")}
          />
        </Campo>
      </Cartao>

      <Cartao
        titulo="Endereço da página"
        descricao="Deixe vazio para gerar a partir do título. Mudar depois quebra links já compartilhados."
      >
        <Campo nome="slug" rotulo="Final do endereço">
          <input
            id="slug"
            name="slug"
            defaultValue={post?.slug ?? ""}
            placeholder="documentacao-antes-de-fechar-negocio"
            className={campo}
          />
        </Campo>
      </Cartao>

      <BarraSalvar
        mensagem={estado.mensagem ?? (estado.erros ? "Confira os campos marcados em vermelho." : undefined)}
        tom={estado.ok ? "sucesso" : estado.mensagem || estado.erros ? "erro" : "neutro"}
      >
        <Salvar novo={novo} />
      </BarraSalvar>
    </form>
  );
}
