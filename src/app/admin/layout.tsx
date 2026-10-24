import type { Metadata, Viewport } from "next";

import { Intro } from "@/components/site/intro";

/**
 * Vale para tudo em /admin, a tela de login inclusa. Ela fica fora do
 * layout do painel (que exige sessão), então o manifesto precisa morar aqui:
 * se morasse lá, quem instalasse a partir do login ganharia o app do site
 * público, que abre em "/", e não o do painel.
 */
export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Amauri" },
  robots: { index: false, follow: false },
  manifest: "/painel.webmanifest",
  // O iOS usa este nome para o ícone na tela inicial.
  appleWebApp: { capable: true, title: "Painel", statusBarStyle: "default" },
};

/**
 * viewport-fit=cover deixa o app ocupar a tela inteira no iPhone; sem ele,
 * env(safe-area-inset-bottom) vale zero e a barra de abas fica por baixo
 * do indicador de início. Os espaços seguros são tratados no layout.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function AdminRaiz({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mesma cortina do site, e a mesma chave de sessão: quem já a viu
          navegando no site não a vê de novo ao abrir o painel na mesma aba.
          Como app instalado, cada abertura é uma sessão nova e ela aparece. */}
      <Intro />
      {children}
    </>
  );
}
