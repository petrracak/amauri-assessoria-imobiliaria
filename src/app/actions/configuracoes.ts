"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Só dígitos, hífen e sublinhado: IDs de pixel não têm outra coisa. */
const idPixel = z
  .string()
  .trim()
  .max(40)
  .regex(/^[\w-]*$/, "Use apenas letras, números, hífen e sublinhado.")
  .optional()
  .or(z.literal(""));

const schema = z.object({
  whatsapp: z.string().trim().transform((v) => v.replace(/\D/g, "")),
  telefone_exibicao: z.string().trim().max(40),
  email: z.email("E-mail inválido.").or(z.literal("")),
  instagram: z.url("Link inválido.").or(z.literal("")),
  creci: z.string().trim().max(30),
  hero_titulo: z.string().trim().min(3).max(120),
  hero_subtitulo: z.string().trim().max(240),
  meta_pixel_id: idPixel,
  ga4_id: idPixel,
  gtm_id: idPixel,
  google_ads_id: idPixel,
});

export type EstadoConfig = {
  ok: boolean;
  mensagem?: string;
  erros?: Record<string, string>;
};

export async function salvarConfig(
  _anterior: EstadoConfig,
  formData: FormData,
): Promise<EstadoConfig> {
  const perfil = await exigirAdmin();

  const resultado = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!resultado.success) {
    const erros: Record<string, string> = {};
    for (const p of resultado.error.issues) {
      erros[String(p.path[0] ?? "form")] ??= p.message;
    }
    return { ok: false, erros };
  }

  const d = resultado.data;
  const supabase = await createClient();

  const { error } = await supabase.from("site_settings").upsert(
    [
      {
        chave: "contato",
        valor: {
          whatsapp: d.whatsapp,
          telefone_exibicao: d.telefone_exibicao,
          email: d.email,
          instagram: d.instagram,
          creci: d.creci,
          cidade: "Santarém, Pará",
        },
        publico: true,
        updated_by: perfil.id,
      },
      {
        chave: "hero",
        valor: { titulo: d.hero_titulo, subtitulo: d.hero_subtitulo, imagem: null },
        publico: true,
        updated_by: perfil.id,
      },
      {
        chave: "pixels",
        valor: {
          meta_pixel_id: d.meta_pixel_id ?? "",
          ga4_id: d.ga4_id ?? "",
          gtm_id: d.gtm_id ?? "",
          google_ads_id: d.google_ads_id ?? "",
        },
        publico: true,
        updated_by: perfil.id,
      },
    ],
    { onConflict: "chave" },
  );

  if (error) return { ok: false, mensagem: `Não deu para salvar: ${error.message}` };

  revalidatePath("/", "layout");
  return { ok: true, mensagem: "Configurações salvas. O site já está usando." };
}
