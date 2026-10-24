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
        descricao="Preencha o essencial e salve. As fotos entram na tela seguinte, e o imóvel só vai ao ar quando a situação for No ar."
      />
      <PropertyForm />
    </Pagina>
  );
}
