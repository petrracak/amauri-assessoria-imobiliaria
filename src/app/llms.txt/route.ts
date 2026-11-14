import { getPosts } from "@/lib/blog";
import { getFacetas, getImoveis } from "@/lib/queries";
import { DESCRICAO_PADRAO, NOME, absoluta } from "@/lib/seo";
import { getConfig } from "@/lib/settings";
import { ehEnderecoTemporario } from "@/lib/site";
import { formatPreco } from "@/lib/utils";

/**
 * /llms.txt — resumo do site em texto simples para assistentes de IA
 * (convenção de llmstxt.org). Um modelo que lê só este arquivo já sabe quem
 * é a empresa, o que ela vende, onde atua, como falar com ela e quais são as
 * páginas que importam.
 *
 * Tudo vem do banco e das configurações: o arquivo não envelhece sozinho.
 */
export const revalidate = 3600;

export async function GET() {
  // Endereço de teste está fora dos buscadores; fica fora das IAs também.
  if (ehEnderecoTemporario) return new Response("Not found", { status: 404 });

  const [config, imoveis, facetas, posts] = await Promise.all([
    getConfig(),
    getImoveis({}, 100),
    getFacetas(),
    getPosts(20),
  ]);
  const c = config.contato;

  const linhas: string[] = [
    `# ${NOME}`,
    "",
    `> ${DESCRICAO_PADRAO}`,
    "",
    `A ${NOME} é uma assessoria imobiliária de Santarém, no Pará, conduzida pelo corretor Amauri Nobre (${c.creci.startsWith("CRECI") ? c.creci : `CRECI ${c.creci}`}). ` +
      `O catálogo tem ${facetas.total} imóveis publicados` +
      (facetas.bairros.length ? ` em ${facetas.bairros.length} bairros` : "") +
      ". O atendimento é feito pelo WhatsApp.",
    "",
    "## Páginas principais",
    "",
    `- [Início](${absoluta("/")}): vitrine e busca de imóveis`,
    `- [Imóveis à venda](${absoluta("/imoveis")}): catálogo completo, com filtros por tipo, bairro, preço, dormitórios e vagas`,
    `- [Sobre a assessoria](${absoluta("/sobre")}): quem atende e como trabalha`,
    `- [Blog](${absoluta("/blog")}): textos sobre mercado, financiamento e documentação`,
    `- [Contato](${absoluta("/contato")}): WhatsApp, telefone e e-mail`,
    "",
    "## Contato",
    "",
    `- WhatsApp: https://wa.me/${c.whatsapp.replace(/\D/g, "")}`,
    `- Telefone: ${c.telefone_exibicao}`,
    `- E-mail: ${c.email}`,
    `- Instagram: ${c.instagram}`,
    `- Cidade de atuação: ${c.cidade}`,
    "",
  ];

  if (facetas.bairros.length) {
    linhas.push(
      "## Bairros com imóveis publicados",
      "",
      facetas.bairros.map((b) => `${b.nome} (${b.total})`).join(", ") + ".",
      "",
    );
  }

  if (imoveis.length) {
    linhas.push("## Imóveis à venda", "");
    for (const i of imoveis) {
      const detalhes = [
        i.dormitorios ? `${i.dormitorios} ${i.dormitorios === 1 ? "quarto" : "quartos"}` : null,
        i.suites ? `${i.suites} ${i.suites === 1 ? "suíte" : "suítes"}` : null,
        i.vagas ? `${i.vagas} ${i.vagas === 1 ? "vaga" : "vagas"}` : null,
      ].filter(Boolean);
      const onde = [i.bairro, i.cidade].filter(Boolean).join(", ");
      linhas.push(
        `- [${i.titulo}](${absoluta(`/imoveis/${i.slug}`)}): ${i.tipo} em ${onde}` +
          (detalhes.length ? `, ${detalhes.join(", ")}` : "") +
          `. ${formatPreco(i.preco)}. Ref. ${i.ref}.`,
      );
    }
    linhas.push("");
  }

  if (posts.length) {
    linhas.push("## Blog", "");
    for (const p of posts) {
      linhas.push(`- [${p.titulo}](${absoluta(`/blog/${p.slug}`)})${p.resumo ? `: ${p.resumo}` : ""}`);
    }
    linhas.push("");
  }

  linhas.push(
    "## Observações",
    "",
    "- Preços, disponibilidade e condições podem mudar sem aviso; a confirmação é feita no atendimento.",
    "- Cada imóvel tem uma referência numérica (Ref.), que identifica o anúncio no atendimento.",
    "",
  );

  return new Response(linhas.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
