/**
 * Entrega as fotos do Storage com cache longo. Ver lib/midia.ts para o porquê.
 *
 * O Storage responde "private, no-cache" nas fotos deste projeto e não deixa
 * mudar. Um rewrite não resolve: o cabeçalho do destino prevalece. Esta rota
 * busca o arquivo e responde com o cabeçalho certo; a Vercel guarda o
 * resultado na borda, então a função só roda na primeira vez de cada foto.
 */
const BUCKETS = new Set(["imoveis", "blog", "site", "avatares"]);
const SEGURO = /^[\w.\-]+$/;

const UM_ANO = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caminho: string[] }> },
) {
  const { caminho } = await params;
  const [bucket, ...resto] = caminho;

  // Só os buckets do projeto, e nada de "..": esta rota nunca vira um proxy
  // para outro lugar do Storage ou da internet.
  if (
    !BUCKETS.has(bucket) ||
    resto.length === 0 ||
    !resto.every((p) => SEGURO.test(p) && p !== "." && p !== "..")
  ) {
    return new Response(null, { status: 404 });
  }

  const origem = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const url = `${origem}/storage/v1/object/public/${bucket}/${resto.map(encodeURIComponent).join("/")}`;

  const upstream = await fetch(url, { cache: "no-store" });

  if (!upstream.ok || !upstream.body) {
    // Não guarda o erro por muito tempo: a foto pode estar chegando.
    return new Response(null, {
      // O Storage responde 400 para arquivo inexistente.
      status: upstream.status === 404 || upstream.status === 400 ? 404 : 502,
      headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
    });
  }

  const tipo = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (!tipo.startsWith("image/")) return new Response(null, { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": tipo,
      "Cache-Control": UM_ANO,
      "X-Content-Type-Options": "nosniff",
      // SVG enviado por engano com <script> não executa a partir daqui.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
