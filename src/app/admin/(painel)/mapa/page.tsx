import { MapPinOff } from "lucide-react";
import Link from "next/link";

import { MapaCarteira, type PinoImovel } from "@/components/admin/mapa-carteira";
import { Cabecalho, Pagina, Vazio, botao } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mapa" };

export default async function MapaDaCarteira() {
  await exigirPerfil();
  const supabase = await createClient();

  // Arquivado fica de fora: o mapa é a carteira viva, não o histórico.
  const [{ data: comPino }, semCoordenada] = await Promise.all([
    supabase
      .from("properties")
      .select(
        `id, ref, titulo, tipo, bairro, preco, latitude, longitude,
         situacao, placa, imagens:property_images (url, ordem)`,
      )
      .neq("status", "arquivado")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(500),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .neq("status", "arquivado")
      .is("latitude", null),
  ]);

  const imoveis: PinoImovel[] = (comPino ?? []).map((i) => ({
    id: i.id,
    ref: i.ref,
    titulo: i.titulo,
    tipo: i.tipo,
    bairro: i.bairro,
    preco: i.preco,
    lat: Number(i.latitude),
    lng: Number(i.longitude),
    situacao: i.situacao,
    placa: i.placa,
    foto: [...(i.imagens ?? [])].sort((a, b) => a.ordem - b.ordem)[0]?.url ?? null,
  }));

  const faltam = semCoordenada.count ?? 0;

  return (
    <Pagina largura="max-w-6xl">
      <Cabecalho
        titulo="Mapa da carteira"
        descricao={
          faltam
            ? `Cada pino é um imóvel, pela cor da situação. Faltam ${faltam} sem localização.`
            : "Cada pino é um imóvel, pela cor da situação."
        }
        acoes={
          faltam ? (
            <Link
              href="/admin/imoveis?visao=sem-mapa"
              className={botao.secundario}
            >
              Ver os {faltam} sem localização
            </Link>
          ) : null
        }
      />

      {imoveis.length ? (
        <MapaCarteira imoveis={imoveis} />
      ) : (
        <Vazio
          icone={MapPinOff}
          titulo="Nenhum imóvel no mapa ainda"
          texto="O pino vem do link do Google Maps no cadastro do imóvel. Cole o link em um deles e ele aparece aqui."
          acao={
            <Link href="/admin/imoveis?visao=sem-mapa" className={botao.primario}>
              Começar pelos sem localização
            </Link>
          }
        />
      )}
    </Pagina>
  );
}
