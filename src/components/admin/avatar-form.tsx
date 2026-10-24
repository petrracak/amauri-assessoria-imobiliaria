"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { salvarAvatar } from "@/app/actions/avatar";
import { Avatar } from "@/components/admin/avatar";
import { Cartao, botao } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LADO = 400;

/**
 * Recorta no centro e reduz para um quadrado, no próprio aparelho.
 * Foto de celular tem vários MB e vem em qualquer proporção; o avatar é
 * exibido em círculo pequeno, então nada disso precisa subir.
 */
async function prepararQuadrado(arquivo: File) {
  const bitmap = await createImageBitmap(arquivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const x = (bitmap.width - lado) / 2;
  const y = (bitmap.height - lado) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(bitmap, x, y, lado, lado, 0, 0, LADO, LADO);
  bitmap.close();

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
}

export function AvatarForm({
  perfilId,
  nome,
  avatarUrl,
}: {
  perfilId: string;
  nome: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [pendente, startTransition] = useTransition();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(arquivo: File | undefined) {
    if (!arquivo) return;
    setAviso(null);
    setEnviando(true);

    const quadrado = await prepararQuadrado(arquivo).catch(() => null);
    if (!quadrado) {
      setAviso("Não deu para ler essa imagem. Tente outra.");
      setEnviando(false);
      return;
    }

    const caminho = `${perfilId}/${Date.now()}.webp`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("avatares")
      .upload(caminho, quadrado, { contentType: "image/webp", upsert: false });

    setEnviando(false);
    if (entrada.current) entrada.current.value = "";

    if (error) {
      setAviso(`Falhou ao enviar: ${error.message}`);
      return;
    }

    startTransition(async () => {
      const r = await salvarAvatar(caminho);
      setAviso(r.mensagem ?? null);
      router.refresh();
    });
  }

  function remover() {
    startTransition(async () => {
      const r = await salvarAvatar(null);
      setAviso(r.mensagem ?? null);
      router.refresh();
    });
  }

  const ocupado = enviando || pendente;

  return (
    <Cartao titulo="Foto de perfil" descricao="Aparece no painel, ao lado do seu nome. Sem foto, fica o ícone padrão.">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar url={avatarUrl} nome={nome} tamanho="lg" />

        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={ocupado}
            className={cn(botao.secundario, "flex-1 sm:flex-none")}
          >
            <Camera className="size-5" strokeWidth={1.6} />
            {enviando ? "Enviando…" : avatarUrl ? "Trocar foto" : "Escolher foto"}
          </button>

          {avatarUrl ? (
            <button
              type="button"
              onClick={remover}
              disabled={ocupado}
              className={cn(botao.suave, "flex-1 sm:flex-none")}
            >
              <Trash2 className="size-5" strokeWidth={1.6} />
              Remover
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => enviar(e.target.files?.[0])}
      />

      {aviso ? (
        <p role="status" className="mt-4 text-sm text-fg-muted">
          {aviso}
        </p>
      ) : null}
    </Cartao>
  );
}
