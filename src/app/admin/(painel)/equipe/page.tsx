import { TeamForm } from "@/components/admin/team-form";
import { TeamRow, type Membro } from "@/components/admin/team-row";
import { exigirAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Equipe" };

export default async function Equipe() {
  const admin = await exigirAdmin();

  const supabase = await createClient();
  const { data: membros } = await supabase
    .from("profiles")
    .select("id, nome, email, usuario, role, ativo")
    .order("role")
    .order("nome");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-display-sm">Equipe</h1>
      <p className="mt-2 max-w-[56ch] text-pretty leading-relaxed text-fg-muted">
        Quem tem acesso ao painel. Cada pessoa pode trocar a própria senha em
        Conta; aqui você define a primeira e resolve esquecimento.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl">
          Pessoas com acesso{" "}
          <span className="numeros text-base text-fg-muted">
            ({membros?.length ?? 0})
          </span>
        </h2>

        {membros?.length ? (
          <ul className="mt-5 divide-y divide-border-base border-y border-border-base">
            {membros.map((membro) => (
              <TeamRow
                key={membro.id}
                membro={membro as Membro}
                euSou={admin.id}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-fg-muted">Nenhum acesso cadastrado ainda.</p>
        )}
      </section>

      <div className="mt-16 border-t border-border-base pt-12">
        <TeamForm />
      </div>
    </div>
  );
}
