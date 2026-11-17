import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { apagarImovel } from "@/app/actions/imoveis";
import { Abas } from "@/components/admin/abas";
import { HistoricoImovel, type EventoImovel } from "@/components/admin/historico-imovel";
import { PhotoManager } from "@/components/admin/photo-manager";
import { PropertyForm } from "@/components/admin/property-form";
import {
  Cabecalho,
  Cartao,
  Pagina,
  SeloNegocio,
  SeloPlaca,
  SeloSituacao,
  botao,
} from "@/components/admin/ui";
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

  const [{ data: equipe }, { data: eventos }] = await Promise.all([
    supabase.rpc("equipe_nomes"),
    supabase
      .from("property_events")
      .select("id, campo, de, para, nota, created_at, autor:profiles (nome)")
      .eq("property_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const fotos = [...(imovel.imagens ?? [])].sort((a, b) => a.ordem - b.ordem);

  async function apagar() {
    "use server";
    await apagarImovel(id);
    redirect("/admin/imoveis");
  }

  return (
    <Pagina largura="max-w-3xl">
      <Cabecalho
        voltar={{ href: "/admin/imoveis", rotulo: "Imóveis" }}
        titulo={imovel.titulo}
        descricao={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="numeros">Ref. {imovel.ref}</span>
            <SeloSituacao situacao={imovel.status} />
            <SeloNegocio situacao={imovel.situacao} />
            <SeloPlaca placa={imovel.placa} />
          </span>
        }
        acoes={
          imovel.status === "publicado" ? (
            <Link href={`/imoveis/${imovel.slug}`} target="_blank" className={botao.secundario}>
              <ExternalLink className="size-5" strokeWidth={1.6} />
              Ver no site
            </Link>
          ) : null
        }
      />

      <Abas
        abas={[
          {
            id: "dados",
            rotulo: "Dados",
            conteudo: <PropertyForm imovel={imovel} equipe={equipe ?? []} />,
          },
          {
            id: "fotos",
            rotulo: "Fotos",
            contagem: fotos.length,
            conteudo: <PhotoManager propertyId={imovel.id} refImovel={imovel.ref} fotos={fotos} />,
          },
          {
            id: "historico",
            rotulo: "Histórico",
            conteudo: <HistoricoImovel eventos={(eventos ?? []) as unknown as EventoImovel[]} />,
          },
        ]}
      />

      {perfil.role === "admin" ? (
        <Cartao
          tom="perigo"
          titulo="Apagar imóvel"
          descricao="Remove o imóvel e todas as fotos, sem volta. Para só tirar do ar, mude a situação para Arquivado."
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
