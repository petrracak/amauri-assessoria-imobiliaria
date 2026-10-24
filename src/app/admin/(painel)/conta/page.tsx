import { AccountForm } from "@/components/admin/account-form";
import { AvatarForm } from "@/components/admin/avatar-form";
import { exigirPerfil } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Minha conta" };

export default async function Conta() {
  const perfil = await exigirPerfil();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-display-sm">Minha conta</h1>

      <div className="mt-12">
        <AvatarForm
          perfilId={perfil.id}
          nome={perfil.nome}
          avatarUrl={perfil.avatar_url}
        />
      </div>

      <dl className="mt-14 max-w-md divide-y divide-border-base border-y border-border-base">
        <div className="flex items-baseline justify-between gap-6 py-4">
          <dt className="text-sm text-fg-muted">Nome</dt>
          <dd>{perfil.nome}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-6 py-4">
          <dt className="text-sm text-fg-muted">E-mail</dt>
          <dd className="break-all text-right">{perfil.email}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-6 py-4">
          <dt className="text-sm text-fg-muted">Acesso</dt>
          <dd className="capitalize">{perfil.role}</dd>
        </div>
      </dl>

      <div className="mt-14">
        <AccountForm />
      </div>
    </div>
  );
}
