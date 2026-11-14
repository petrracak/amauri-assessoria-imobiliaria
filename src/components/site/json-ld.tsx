/**
 * Dados estruturados (schema.org) para buscadores e assistentes de IA.
 *
 * JSON.stringify não escapa "<", e um título com "</script>" fecharia a tag e
 * abriria espaço para injeção de HTML. Trocar "<" pelo equivalente unicode
 * é o que a documentação do Next recomenda.
 */
export function JsonLd({ dados }: { dados: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dados).replace(/</g, "\\u003c"),
      }}
    />
  );
}
