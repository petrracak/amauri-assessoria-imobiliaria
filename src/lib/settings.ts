import { createPublicClient } from "@/lib/supabase/public";
import { whatsappLink } from "@/lib/utils";

export type Contato = {
  whatsapp: string;
  telefone_exibicao: string;
  email: string;
  instagram: string;
  creci: string;
  cidade: string;
};

export type Hero = {
  titulo: string;
  subtitulo: string;
  imagem: string | null;
};

export type Pixels = {
  meta_pixel_id?: string;
  ga4_id?: string;
  gtm_id?: string;
  google_ads_id?: string;
  google_ads_label?: string;
};

const PADRAO = {
  contato: {
    whatsapp: "5593991953656",
    telefone_exibicao: "(93) 99195-3656",
    email: "nobreamauri0@gmail.com",
    instagram: "https://instagram.com/amaurinobrecv",
    creci: "PA 938-J",
    cidade: "Santarém, Pará",
  } satisfies Contato,
  hero: {
    titulo: "Imóveis de alto padrão em Santarém",
    subtitulo:
      "Assessoria completa na compra e na venda, do primeiro contato à escritura.",
    imagem: null,
  } satisfies Hero,
  pixels: {} satisfies Pixels,
};

/**
 * Lê as configurações que o painel edita. Se o banco não responder, o site
 * continua de pé com os valores padrão — nunca uma página em branco.
 */
export async function getConfig() {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("site_settings").select("chave, valor");

    const mapa = new Map((data ?? []).map((l) => [l.chave, l.valor]));
    return {
      contato: { ...PADRAO.contato, ...(mapa.get("contato") as object) } as Contato,
      hero: { ...PADRAO.hero, ...(mapa.get("hero") as object) } as Hero,
      pixels: { ...PADRAO.pixels, ...(mapa.get("pixels") as object) } as Pixels,
    };
  } catch {
    return PADRAO as { contato: Contato; hero: Hero; pixels: Pixels };
  }
}

/** Link de WhatsApp já com a mensagem pronta para o corretor. */
export function linkWhatsApp(contato: Contato, assunto?: string) {
  const mensagem = assunto
    ? `Olá, Amauri! Vi o imóvel ${assunto} no site e quero mais informações.`
    : "Olá, Amauri! Vim pelo site e quero falar sobre imóveis em Santarém.";
  return whatsappLink(contato.whatsapp, mensagem);
}
