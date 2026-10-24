"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirAdmin } from "@/lib/auth";
import { apelidoDe, apelidoParaEmail } from "@/lib/equipe";
import { createAdminClient } from "@/lib/supabase/admin";

const SENHA_MINIMA = 8;

const schemaCriar = z
  .object({
    nome: z.string().trim().min(3, "Escreva o nome completo.").max(120),
    acesso: z.enum(["nome", "email"]),
    email: z.string().trim().max(160).optional(),
    role: z.enum(["admin", "corretor"]),
    senha: z
      .string()
      .min(SENHA_MINIMA, `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`)
      .max(72, "Senha longa demais."),
  })
  .refine((d) => d.acesso === "nome" || z.email().safeParse(d.email).success, {
    message: "Informe um e-mail válido.",
    path: ["email"],
  });

export type EstadoEquipe = {
  ok: boolean;
  mensagem?: string;
  erros?: Record<string, string>;
};

function erros(resultado: z.ZodSafeParseResult<unknown>): Record<string, string> {
  const mapa: Record<string, string> = {};
  if (!resultado.success) {
    for (const p of resultado.error.issues) {
      mapa[String(p.path[0] ?? "form")] ??= p.message;
    }
  }
  return mapa;
}

export async function criarMembro(
  _anterior: EstadoEquipe,
  formData: FormData,
): Promise<EstadoEquipe> {
  await exigirAdmin();

  const resultado = schemaCriar.safeParse({
    nome: formData.get("nome"),
    acesso: formData.get("acesso"),
    email: formData.get("email") ?? "",
    role: formData.get("role"),
    senha: formData.get("senha"),
  });

  if (!resultado.success) return { ok: false, erros: erros(resultado) };

  const { nome, acesso, role, senha } = resultado.data;
  const apelido = acesso === "nome" ? apelidoDe(nome) : null;
  const email =
    acesso === "nome" ? apelidoParaEmail(apelido!) : resultado.data.email!.toLowerCase();

  if (acesso === "nome" && !apelido) {
    return { ok: false, erros: { nome: "Esse nome não gera um usuário válido." } };
  }

  const supabase = createAdminClient();

  const { data: criado, error } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (error) {
    return {
      ok: false,
      mensagem: /already|exists|registered/i.test(error.message)
        ? "Já existe uma conta com esse nome ou e-mail."
        : `Não deu para criar: ${error.message}`,
    };
  }

  // O gatilho do banco cria o perfil sempre como corretor, de propósito.
  // Promover é ato explícito, feito aqui depois da checagem de admin.
  const { error: erroPerfil } = await supabase
    .from("profiles")
    .update({ nome, role, usuario: apelido, ativo: true })
    .eq("id", criado.user.id);

  if (erroPerfil) {
    return { ok: false, mensagem: `Conta criada, mas o perfil falhou: ${erroPerfil.message}` };
  }

  revalidatePath("/admin/equipe");
  return {
    ok: true,
    mensagem:
      acesso === "nome"
        ? `Conta criada. O acesso é "${apelido}" com a senha que você definiu.`
        : `Conta criada para ${email}.`,
  };
}

export async function definirSenhaDe(membroId: string, senha: string) {
  const admin = await exigirAdmin();

  if (senha.length < SENHA_MINIMA) {
    return { ok: false, mensagem: `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.` };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(membroId, {
    password: senha,
  });

  if (error) return { ok: false, mensagem: `Não deu para trocar: ${error.message}` };

  revalidatePath("/admin/equipe");
  return {
    ok: true,
    mensagem:
      membroId === admin.id
        ? "Sua senha foi trocada."
        : "Senha definida. Passe para a pessoa e peça para ela trocar depois.",
  };
}

export async function alterarPapel(membroId: string, role: "admin" | "corretor") {
  const admin = await exigirAdmin();

  if (membroId === admin.id) {
    return { ok: false, mensagem: "Você não pode mudar o seu próprio nível de acesso." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", membroId);

  if (error) return { ok: false, mensagem: `Não deu para salvar: ${error.message}` };

  revalidatePath("/admin/equipe");
  return { ok: true, mensagem: "Nível de acesso atualizado." };
}

export async function alterarSituacao(membroId: string, ativo: boolean) {
  const admin = await exigirAdmin();

  if (membroId === admin.id) {
    return { ok: false, mensagem: "Você não pode desativar o seu próprio acesso." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ ativo }).eq("id", membroId);

  if (error) return { ok: false, mensagem: `Não deu para salvar: ${error.message}` };

  revalidatePath("/admin/equipe");
  return {
    ok: true,
    mensagem: ativo ? "Acesso reativado." : "Acesso suspenso.",
  };
}
