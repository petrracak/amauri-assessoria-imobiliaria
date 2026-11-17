import { PropertyForm } from "@/components/admin/property-form";
import { Cabecalho, Pagina } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cadastrar imóvel" };

export default async function NovoImovel() {
  await exigirPerfil();

  // Função no banco em vez de consulta à tabela: a política de profiles é
  // estreita de propósito, e aqui só o nome interessa (ver migração 0006).
  const supabase = await createClient();
  const { data: equipe } = await supabase.rpc("equipe_nomes");

  return (
    <Pagina largura="max-w-3xl">
      <Cabecalho
        voltar={{ href: "/admin/imoveis", rotulo: "Imóveis" }}
        titulo="Cadastrar imóvel"
        descricao="Escolha as fotos, preencha o essencial e salve tudo de uma vez. O imóvel só vai ao ar quando a situação for No ar."
      />
      <PropertyForm equipe={equipe ?? []} />
    </Pagina>
  );
}
