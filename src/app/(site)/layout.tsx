import { Pixels } from "@/components/site/pixels";
import { getConfig } from "@/lib/settings";

/**
 * Envolve só as páginas públicas. O painel fica de fora, para não disparar
 * rastreio enquanto a equipe trabalha.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pixels } = await getConfig();

  return (
    <>
      {children}
      <Pixels pixels={pixels} />
    </>
  );
}
