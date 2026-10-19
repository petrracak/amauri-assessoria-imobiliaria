import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { apagarImovel } from "@/app/actions/imoveis";
import { PhotoManager } from "@/components/admin/photo-manager";
import { PropertyForm } from "@/components/admin/property-form";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditarImovel({ params }: { params: Params }) {
  const perfil = await exigirPerfil();
  const { id } = await params;

  const supabase = await createClient();
  const { data: imovel } = await supabase
    .from("properties")
    .select("*, imagens:property_images (id, url, capa, ordem)")
    .eq("id", id)
    .maybeSingle();

  if (!imovel) notFound();

  const fotos = [...(imovel.imagens ?? [])].sort((a, b) => a.ordem - b.ordem);

  async function apagar() {
    "use server";
    await apagarImovel(id);
    redirect("/admin/imoveis");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="text-sm text-fg-muted">
        <Link href="/admin/imoveis" className="transition-colors hover:text-fg">
          Imóveis
        </Link>
        <span className="px-2 text-fg-subtle">/</span>
        <span className="numeros text-fg">{imovel.ref}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-balance font-display text-display-sm">{imovel.titulo}</h1>
          <p className="mt-2 text-sm capitalize text-fg-muted">{imovel.status}</p>
        </div>

        {imovel.status === "publicado" ? (
          <Link
            href={`/imoveis/${imovel.slug}`}
            target="_blank"
            className="flex items-center gap-2 rounded-full border border-border-base px-4 py-2.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <ExternalLink className="size-4" strokeWidth={1.5} />
            Ver no site
          </Link>
        ) : null}
      </div>

      <div className="mt-12">
        <PhotoManager propertyId={imovel.id} refImovel={imovel.ref} fotos={fotos} />
      </div>

      <div className="mt-16 border-t border-border-base pt-12">
        <h2 className="font-display text-2xl">Dados do imóvel</h2>
        <div className="mt-6">
          <PropertyForm imovel={imovel} />
        </div>
      </div>

      {perfil.role === "admin" ? (
        <div className="mt-20 border-t border-border-base pt-10">
          <h2 className="font-display text-xl">Apagar imóvel</h2>
          <p className="mt-2 max-w-[52ch] text-pretty text-sm leading-relaxed text-fg-muted">
            Remove o imóvel e todas as fotos, sem volta. Para só tirar do ar,
            mude a situação para arquivado.
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
