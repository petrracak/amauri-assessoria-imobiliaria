/**
 * Fotos e arquivos do Storage são servidos por /midia/..., no próprio
 * domínio (rota em app/midia), e não direto do Supabase.
 *
 * O motivo é o cache: o Storage devolve "private, no-cache" nas fotos deste
 * projeto e não deixa mudar isso, então o celular rebaixava cada foto a
 * cada visita e CDN nenhum guardava. Pelo /midia a Vercel as guarda por um
 * ano, na borda mais perto de quem acessa — e o banco, que fica nos
 * Estados Unidos, deixa de ser a origem de cada imagem.
 */
const PADRAO = /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/(.+)$/;

/** URL do Storage → caminho /midia/..., ou a própria URL se não for do Storage. */
export function urlDaMidia(src: string, { pequena = false } = {}) {
  const m = PADRAO.exec(src);
  if (!m) return src;

  let caminho = m[1];
  // Só as fotos de imóvel têm os dois tamanhos (foto.webp e foto-sm.webp).
  // Avatar e capa de blog são arquivo único: pedir a variante pequena deles
  // daria 404.
  if (pequena && caminho.startsWith("imoveis/") && /\.webp$/.test(caminho) && !/-sm\.webp$/.test(caminho)) {
    caminho = caminho.replace(/\.webp$/, "-sm.webp");
  }
  return `/midia/${caminho}`;
}
