import Link from "next/link";

import { PropertyForm } from "@/components/admin/property-form";
import { exigirPerfil } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cadastrar imóvel" };

export default async function NovoImovel() {
  await exigirPerfil();

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="text-sm text-fg-muted">
        <Link href="/admin/imoveis" className="transition-colors hover:text-fg">
          Imóveis
        </Link>
        <span className="px-2 text-fg-subtle">/</span>
        <span className="text-fg">Novo</span>
      </nav>

      <h1 className="mt-4 font-display text-display-sm">Cadastrar imóvel</h1>
      <p className="mt-2 max-w-[52ch] text-pretty leading-relaxed text-fg-muted">
        Preencha o essencial e salve. As fotos entram na tela seguinte, e o
        imóvel só vai ao ar quando a situação virar publicado.
      </p>

      <div className="mt-10">
        <PropertyForm />
      </div>
    </div>
  );
}
