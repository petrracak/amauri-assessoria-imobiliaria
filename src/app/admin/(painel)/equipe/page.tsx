import { TeamForm } from "@/components/admin/team-form";
import { TeamRow, type Membro } from "@/components/admin/team-row";
import { Cabecalho, Pagina } from "@/components/admin/ui";
import { exigirAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Equipe" };

export default async function Equipe() {
  const admin = await exigirAdmin();

  const supabase = await createClient();
  const { data: membros } = await supabase
    .from("profiles")
    .select("id, nome, email, usuario, role, ativo, avatar_url")
    .order("role")
    .order("nome");

  return (
    <Pagina largura="max-w-3xl">
      <Cabecalho
        titulo="Equipe"
        descricao="Quem tem acesso ao painel. Cada pessoa troca a própria senha em Minha conta; aqui você define a primeira e resolve esquecimento."
      />

      <section className="space-y-3">
        <h2 className="font-display text-xl">
          Pessoas com acesso{" "}
          <span className="numeros text-base font-normal text-fg-muted">({membros?.length ?? 0})</span>
        </h2>

        {membros?.length ? (
          <ul className="grid gap-3">
            {membros.map((membro) => (
              <TeamRow key={membro.id} membro={membro as Membro} euSou={admin.id} />
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">Nenhum acesso cadastrado ainda.</p>
        )}
      </section>

      <TeamForm />
    </Pagina>
  );
}
