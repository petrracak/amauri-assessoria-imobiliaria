import { PropertyForm } from "@/components/admin/property-form";
import { Cabecalho, Pagina } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cadastrar imóvel" };

export default async function NovoImovel() {
  await exigirPerfil();

  return (
    <Pagina largura="max-w-3xl">
      <Cabecalho
        voltar={{ href: "/admin/imoveis", rotulo: "Imóveis" }}
        titulo="Cadastrar imóvel"
        descricao="Escolha as fotos, preencha o essencial e salve tudo de uma vez. O imóvel só vai ao ar quando a situação for No ar."
      />
      <PropertyForm />
    </Pagina>
  );
}
