import { AdminShell } from "@/components/admin/admin-shell";
import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O número de leads sem contato vira o selo da aba: quem abre o app já
  // vê se tem alguém esperando resposta. Em paralelo com o perfil — a
  // consulta não depende dele, e o perfil trava a página se for inválido.
  const supabase = await createClient();
  const [perfil, { count }] = await Promise.all([
    exigirPerfil(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "novo"),
  ]);

  return (
    <AdminShell
      perfil={{ nome: perfil.nome, role: perfil.role, avatar_url: perfil.avatar_url }}
      leadsNovos={count ?? 0}
      semSenha={!perfil.senhaPropria}
    >
      {children}
    </AdminShell>
  );
}
