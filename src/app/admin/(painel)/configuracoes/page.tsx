import { SettingsForm } from "@/components/admin/settings-form";
import { exigirAdmin } from "@/lib/auth";
import { getConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configurações" };

export default async function Configuracoes() {
  await exigirAdmin();
  const config = await getConfig();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-display-sm">Configurações</h1>
      <p className="mt-2 max-w-[52ch] text-pretty leading-relaxed text-fg-muted">
        O que muda aqui vale para o site inteiro. Alterações aparecem em até
        cinco minutos nas páginas públicas.
      </p>

      <div className="mt-12">
        <SettingsForm
          contato={config.contato}
          hero={config.hero}
          pixels={config.pixels}
        />
      </div>
    </div>
  );
}
