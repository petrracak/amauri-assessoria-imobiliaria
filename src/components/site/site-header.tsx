import { Header } from "@/components/site/header";
import { getFacetas } from "@/lib/queries";
import { getConfig, linkWhatsApp } from "@/lib/settings";

/**
 * Busca o que o cabeçalho precisa e entrega ao componente de cliente.
 *
 * Existe para as páginas não repetirem essa consulta nem carregarem o
 * contato só para montar o menu.
 */
export async function SiteHeader({ sobreposto = false }: { sobreposto?: boolean }) {
  const [config, facetas] = await Promise.all([getConfig(), getFacetas()]);

  return (
    <Header
      whatsapp={linkWhatsApp(config.contato)}
      facetas={facetas}
      sobreposto={sobreposto}
    />
  );
}
