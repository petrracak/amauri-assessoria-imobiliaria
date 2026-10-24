"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirAdmin, exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** "Casa no Cidade Jardim" -> "casa-no-cidade-jardim" */
function slugify(texto: string) {
  return texto
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

const numeroOpcional = z
  .union([z.string(), z.number(), z.null()])
  .transform((v) => {
    if (v === null || v === "" || v === undefined) return null;
    const n = Number(String(v).replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  });

const schema = z.object({
  id: z.uuid().optional().or(z.literal("")),
  titulo: z.string().trim().min(3, "Dê um título ao imóvel."),
  tipo: z.string().trim().min(2, "Escolha o tipo."),
  status: z.enum(["rascunho", "publicado", "arquivado"]),
  bairro: z.string().trim().max(80).optional(),
  cidade: z.string().trim().min(2).default("Santarém"),
  endereco: z.string().trim().max(200).optional(),
  descricao: z.string().trim().max(20000).optional(),
  badge: z.string().trim().max(40).optional(),
  preco: numeroOpcional,
  preco_anterior: numeroOpcional,
  dormitorios: numeroOpcional,
  suites: numeroOpcional,
  banheiros: numeroOpcional,
  vagas: numeroOpcional,
  area_total: numeroOpcional,
  area_privativa: numeroOpcional,
  destaque: z.coerce.boolean().default(false),
  alto_padrao: z.coerce.boolean().default(false),
});

export type EstadoImovel = {
  ok: boolean;
  id?: string;
  mensagem?: string;
  erros?: Record<string, string>;
};

/**
 * Limpa o cache das páginas que mostram este imóvel.
 *
 * A ficha precisa do caminho dela: sem isto, o catálogo atualizava na hora
 * mas a página do imóvel ficava até cinco minutos com o conteúdo velho —
 * justamente a página que a equipe abre para conferir o que acabou de
 * cadastrar.
 */
async function revalidarImovel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
) {
  const { data } = await supabase
    .from("properties")
    .select("slug")
    .eq("id", propertyId)
    .maybeSingle();

  if (data?.slug) revalidatePath(`/imoveis/${data.slug}`);

  revalidatePath("/admin", "layout"); // limpa o cache do painel no aparelho
  revalidatePath("/admin/imoveis");
  revalidatePath(`/admin/imoveis/${propertyId}`);
  revalidatePath("/imoveis");
  revalidatePath("/");
}

/** Próxima referência livre: 035 -> 036. */
async function proximaRef(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("properties")
    .select("ref")
    .order("ref", { ascending: false })
    .limit(200);

  const maior = (data ?? []).reduce((acc, linha) => {
    const n = Number(String(linha.ref).replace(/\D/g, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);

  return String(maior + 1).padStart(3, "0");
}

export async function salvarImovel(
  _anterior: EstadoImovel,
  formData: FormData,
): Promise<EstadoImovel> {
  const perfil = await exigirPerfil();

  const bruto = Object.fromEntries(formData.entries());
  const resultado = schema.safeParse({
    ...bruto,
    destaque: formData.get("destaque") === "on",
    alto_padrao: formData.get("alto_padrao") === "on",
  });

  if (!resultado.success) {
    const erros: Record<string, string> = {};
    for (const p of resultado.error.issues) {
      const campo = String(p.path[0] ?? "form");
      erros[campo] ??= p.message;
    }
    return { ok: false, erros };
  }

  const { id, ...dados } = resultado.data;
  const supabase = await createClient();

  const campos = {
    ...dados,
    bairro: dados.bairro || null,
    endereco: dados.endereco || null,
    descricao: dados.descricao || null,
    badge: dados.badge || null,
    meta_description: dados.descricao ? dados.descricao.slice(0, 155) : null,
  };

  if (id) {
    const { error } = await supabase.from("properties").update(campos).eq("id", id);
    if (error) return { ok: false, mensagem: `Não deu para salvar: ${error.message}` };

    await revalidarImovel(supabase, id);
    return { ok: true, id, mensagem: "Alterações salvas." };
  }

  const ref = await proximaRef(supabase);
  const slugBase = slugify(`${dados.titulo}-${dados.bairro ?? ""}-ref-${ref}`);

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...campos, ref, slug: slugBase, ordem: Number(ref), created_by: perfil.id })
    .select("id")
    .single();

  if (error) return { ok: false, mensagem: `Não deu para cadastrar: ${error.message}` };

  await revalidarImovel(supabase, data.id);
  return { ok: true, id: data.id, mensagem: "Imóvel cadastrado." };
}

export async function alterarStatus(id: string, status: "rascunho" | "publicado" | "arquivado") {
  await exigirPerfil();
  const supabase = await createClient();
  await supabase.from("properties").update({ status }).eq("id", id);

  await revalidarImovel(supabase, id);
}

export async function apagarImovel(id: string) {
  // Só admin apaga. A interface já escondia o botão, mas esconder não é
  // autorizar: a ação é chamável direto por quem souber o endereço.
  await exigirAdmin();
  const supabase = await createClient();

  // Tira os arquivos do storage antes da linha sumir com o cascade.
  const { data: fotos } = await supabase
    .from("property_images")
    .select("path")
    .eq("property_id", id);

  const caminhos = (fotos ?? []).map((f) => f.path).filter(Boolean) as string[];
  if (caminhos.length) await supabase.storage.from("imoveis").remove(caminhos);

  // O slug precisa ser lido antes da exclusão: depois não há de onde tirar,
  // e sem limpar esse caminho a ficha do imóvel apagado continuaria no ar.
  const { data: antes } = await supabase
    .from("properties")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("properties").delete().eq("id", id);

  if (antes?.slug) revalidatePath(`/imoveis/${antes.slug}`);
  revalidatePath("/admin", "layout"); // limpa o cache do painel no aparelho
  revalidatePath("/admin/imoveis");
  revalidatePath("/imoveis");
  revalidatePath("/");
}

/** Grava no banco as fotos que o browser já enviou ao storage. */
export async function registrarFotos(
  propertyId: string,
  fotos: { url: string; path: string }[],
) {
  await exigirPerfil();
  const supabase = await createClient();

  const { count } = await supabase
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  const base = count ?? 0;
  const linhas = fotos.map((foto, i) => ({
    property_id: propertyId,
    url: foto.url,
    path: foto.path,
    ordem: base + i,
    capa: base === 0 && i === 0,
  }));

  const { error } = await supabase.from("property_images").insert(linhas);
  if (error) return { ok: false, mensagem: error.message };

  await revalidarImovel(supabase, propertyId);
  return { ok: true };
}

export async function removerFoto(fotoId: string, propertyId: string) {
  await exigirPerfil();
  const supabase = await createClient();

  const { data: foto } = await supabase
    .from("property_images")
    .select("path, capa")
    .eq("id", fotoId)
    .maybeSingle();

  if (foto?.path) await supabase.storage.from("imoveis").remove([foto.path]);
  await supabase.from("property_images").delete().eq("id", fotoId);

  // Se a capa saiu, a primeira foto restante assume.
  if (foto?.capa) {
    const { data: resto } = await supabase
      .from("property_images")
      .select("id")
      .eq("property_id", propertyId)
      .order("ordem")
      .limit(1);
    if (resto?.[0]) {
      await supabase.from("property_images").update({ capa: true }).eq("id", resto[0].id);
    }
  }

  await revalidarImovel(supabase, propertyId);
}

export async function definirCapa(fotoId: string, propertyId: string) {
  await exigirPerfil();
  const supabase = await createClient();

  // O índice único exige limpar a capa antiga antes de marcar a nova.
  await supabase
    .from("property_images")
    .update({ capa: false })
    .eq("property_id", propertyId)
    .eq("capa", true);

  await supabase.from("property_images").update({ capa: true }).eq("id", fotoId);

  await revalidarImovel(supabase, propertyId);
}
