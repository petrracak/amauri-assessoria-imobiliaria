import Link from "next/link";

import { Logo } from "@/components/site/logo";

const COLUNAS = [
  {
    titulo: "Imóveis",
    links: [
      { href: "/imoveis", label: "Todos os imóveis" },
      { href: "/imoveis?tipo=Apartamento", label: "Apartamentos" },
      { href: "/imoveis?tipo=Casa", label: "Casas" },
      { href: "/imoveis?tipo=Casa+em+Condom%C3%ADnio", label: "Casas em condomínio" },
    ],
  },
  {
    titulo: "A assessoria",
    links: [
      { href: "/sobre", label: "Sobre o Amauri" },
      { href: "/contato", label: "Contato" },
    ],
  },
];

export function Footer({
  whatsapp,
  telefone,
  instagram,
  creci,
}: {
  whatsapp: string;
  telefone: string;
  instagram: string;
  creci: string;
}) {
  return (
    <footer className="campo-tinta">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] md:py-20">
        <div>
          <Logo href={null} />
          <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-fg-muted">
            Assessoria na compra e na venda de imóveis em Santarém, no Pará.
          </p>
          <p className="numeros mt-5 text-xs text-fg-subtle">CRECI {creci}</p>
        </div>

        {COLUNAS.map((coluna) => (
          <nav key={coluna.titulo}>
            <h2 className="font-display text-lg">{coluna.titulo}</h2>
            <ul className="mt-4 space-y-3">
              {coluna.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="font-display text-lg">Atendimento</h2>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="numeros mt-4 block text-sm text-fg-muted transition-colors hover:text-fg"
          >
            {telefone}
          </a>
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-sm text-fg-muted transition-colors hover:text-fg"
          >
            Instagram
          </a>
        </div>
      </div>

      <div className="linha-encontro">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Amauri Assessoria Imobiliária</p>
          <p>Santarém, Pará</p>
        </div>
      </div>
    </footer>
  );
}
