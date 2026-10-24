import type { Metadata } from "next";

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

export default function AdminRaiz({ children }: { children: React.ReactNode }) {
  return children;
}
