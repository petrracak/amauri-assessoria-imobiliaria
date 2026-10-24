"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Escreva seu nome.")
    .max(120, "Nome muito longo."),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, "Informe um WhatsApp com DDD."),
  origem: z.string().trim().max(40).optional(),
  property_id: z.uuid().optional().or(z.literal("")),
});

const SUCESSO = "Pronto. Vamos te avisar pelo WhatsApp quando entrar novidade.";

export type EstadoLead = {
  ok: boolean;
  mensagem?: string;
  erros?: Record<string, string>;
};

export async function cadastrarLead(
  _anterior: EstadoLead,
  formData: FormData,
): Promise<EstadoLead> {
  // Campo escondido que pessoa nenhuma vê nem preenche. Robô que preenche
  // tudo cai aqui e recebe um "ok", para não ter o que ajustar.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { ok: true, mensagem: SUCESSO };
  }

  const resultado = schema.safeParse({
    nome: formData.get("nome"),
    whatsapp: formData.get("whatsapp"),
    origem: formData.get("origem") ?? "newsletter",
    property_id: formData.get("property_id") ?? "",
  });

  if (!resultado.success) {
    const erros: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "form");
      erros[campo] ??= problema.message;
    }
    return { ok: false, erros };
  }

  const { nome, whatsapp, origem, property_id } = resultado.data;

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    nome,
    whatsapp,
    origem: origem || "newsletter",
    property_id: property_id || null,
    consentimento: true,
  });

  if (error) {
    // O banco barra o mesmo número em 10 minutos (toque duplo) como sucesso
    // para quem enviou: o cadastro já está lá.
    if (error.message.includes("lead_repetido")) return { ok: true, mensagem: SUCESSO };
    if (error.message.includes("lead_excesso")) {
      return {
        ok: false,
        mensagem: "Estamos com muitos cadastros agora. Tente de novo em alguns minutos.",
      };
    }
    return {
      ok: false,
      mensagem: "Não deu para salvar seu cadastro agora. Tente de novo em instantes.",
    };
  }

  return { ok: true, mensagem: SUCESSO };
}
