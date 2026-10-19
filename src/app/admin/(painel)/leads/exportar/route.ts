import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Escapa para CSV e neutraliza fórmulas (=, +, -, @) que o Excel executaria. */
function celula(valor: unknown) {
  const texto = valor == null ? "" : String(valor);
  const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export async function GET() {
  await exigirPerfil();

  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("nome, whatsapp, email, origem, status, mensagem, created_at")
    .order("created_at", { ascending: false });

  const cabecalho = [
    "Nome",
    "WhatsApp",
    "E-mail",
    "Origem",
    "Situação",
    "Mensagem",
    "Cadastrado em",
  ];

  const linhas = (leads ?? []).map((l) =>
    [
      l.nome,
      l.whatsapp,
      l.email,
      l.origem,
      l.status,
      l.mensagem,
      new Date(l.created_at).toLocaleString("pt-BR"),
    ].map(celula).join(";"),
  );

  // BOM: sem ele o Excel no Windows abre os acentos errados.
  const csv = "﻿" + [cabecalho.map(celula).join(";"), ...linhas].join("\r\n");
  const hoje = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-amauri-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
