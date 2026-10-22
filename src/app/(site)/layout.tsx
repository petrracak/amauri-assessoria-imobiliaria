import { AvisoCookies } from "@/components/site/cookies";
import { Intro } from "@/components/site/intro";
import { Pixels } from "@/components/site/pixels";
import { WhatsAppFlutuante } from "@/components/site/whatsapp-float";
import { getConfig, linkWhatsApp } from "@/lib/settings";

/**
 * Envolve só as páginas públicas. O painel fica de fora: a equipe não
 * precisa de cortina de abertura nem de aviso de cookies a cada acesso,
 * e rastreio não dispara enquanto eles trabalham.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pixels, contato } = await getConfig();

  return (
    <>
      <Intro />
      {children}
      <WhatsAppFlutuante href={linkWhatsApp(contato)} />
      <AvisoCookies />
      <Pixels pixels={pixels} />
    </>
  );
}
