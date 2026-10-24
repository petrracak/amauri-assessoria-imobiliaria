import { AccountForm } from "@/components/admin/account-form";
import { AvatarForm } from "@/components/admin/avatar-form";
import { Cabecalho, Cartao, Pagina, Selo } from "@/components/admin/ui";
import { exigirPerfil } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Minha conta" };

export default async function Conta() {
  const perfil = await exigirPerfil();

  return (
    <Pagina largura="max-w-2xl">
      <Cabecalho titulo="Minha conta" />

      <AvatarForm perfilId={perfil.id} nome={perfil.nome} avatarUrl={perfil.avatar_url} />

      <Cartao titulo="Seus dados">
        <dl className="divide-y divide-border-base">
          <div className="flex items-baseline justify-between gap-6 py-3 first:pt-0">
            <dt className="text-sm text-fg-muted">Nome</dt>
            <dd className="min-w-0 text-right">{perfil.nome}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 py-3">
            <dt className="shrink-0 text-sm text-fg-muted">Acesso</dt>
            <dd className="min-w-0 break-all text-right text-sm">{perfil.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-6 py-3 last:pb-0">
            <dt className="text-sm text-fg-muted">Nível</dt>
            <dd>
              <Selo tom={perfil.role === "admin" ? "azul" : "cinza"}>
                {perfil.role === "admin" ? "Administrador" : "Corretor"}
              </Selo>
            </dd>
          </div>
        </dl>
      </Cartao>

      <AccountForm />
    </Pagina>
  );
}
