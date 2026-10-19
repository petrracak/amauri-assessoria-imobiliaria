"use server";

import { revalidatePath } from "next/cache";

import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type StatusLead = "novo" | "em_contato" | "convertido" | "descartado";

export async function mudarStatusLead(id: string, status: StatusLead) {
  await exigirPerfil();
  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
