/* Service worker da Amauri Assessoria Imobiliária.
 *
 * Objetivo: o site continuar utilizável com sinal ruim, que é a realidade de
 * quem abre um anúncio na rua. Nada de sessão entra em cache.
 *
 * Trocar VERSAO invalida tudo que ficou para trás.
 */
const VERSAO = "v1";
const ESTATICO = `estatico-${VERSAO}`;
const PAGINAS = `paginas-${VERSAO}`;

const OFFLINE = `<!doctype html>
<html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sem conexão</title>
<style>
 body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#fff;color:#101723;
      font-family:system-ui,-apple-system,sans-serif;padding:24px;text-align:center}
 p{color:#5a6475;line-height:1.6;max-width:34ch}
 @media (prefers-color-scheme:dark){body{background:#0b1220;color:#e9eef7}p{color:#a3b0c4}}
</style>
<div>
  <h1>Sem conexão</h1>
  <p>Verifique a internet do aparelho. Assim que voltar, atualize a página.</p>
</div>`;

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(ESTATICO).then((cache) =>
      cache.addAll(["/icone-192.png", "/icone-512.png"]).catch(() => undefined),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => !nome.endsWith(VERSAO))
            .map((nome) => caches.delete(nome)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** O que nunca pode encostar no cache. */
function passarDireto(url, requisicao) {
  return (
    requisicao.method !== "GET" ||
    url.origin !== self.location.origin ||
    // Painel e retorno do login dependem de sessão.
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/auth") ||
    // Server Actions e dados do Next.
    url.pathname.startsWith("/api") ||
    url.searchParams.has("_rsc")
  );
}

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  const url = new URL(requisicao.url);

  if (passarDireto(url, requisicao)) return;

  // Build do Next tem hash no nome: pode servir do cache sem medo de ficar velho.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icone-")) {
    evento.respondWith(
      caches.match(requisicao).then(
        (resposta) =>
          resposta ||
          fetch(requisicao).then((rede) => {
            if (rede.ok) {
              const copia = rede.clone();
              caches.open(ESTATICO).then((cache) => cache.put(requisicao, copia));
            }
            return rede;
          }),
      ),
    );
    return;
  }

  // Páginas e imagens: rede primeiro, cache como rede de segurança.
  if (requisicao.mode === "navigate" || url.pathname.startsWith("/_next/image")) {
    evento.respondWith(
      fetch(requisicao)
        .then((rede) => {
          if (rede.ok) {
            const copia = rede.clone();
            caches.open(PAGINAS).then((cache) => cache.put(requisicao, copia));
          }
          return rede;
        })
        .catch(async () => {
          const guardado = await caches.match(requisicao);
          if (guardado) return guardado;
          if (requisicao.mode === "navigate") {
            return new Response(OFFLINE, {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          }
          return Response.error();
        }),
    );
  }
});
