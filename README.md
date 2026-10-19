# Amauri Assessoria Imobiliária

Site institucional, catálogo de imóveis e painel de administração para a
Amauri Assessoria Imobiliária, em Santarém, no Pará.

No ar: https://amauri-assessoria-imobiliaria-ebon.vercel.app

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase
npm run dev
```

As chaves ficam no painel do Supabase, em Project Settings → API.
`SUPABASE_SERVICE_ROLE_KEY` só é usada pelos scripts locais; o site em
produção não precisa dela.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/app/(site)` | Páginas públicas: home, catálogo, ficha do imóvel, sobre, contato |
| `src/app/admin` | Painel: login por link, imóveis, leads, configurações |
| `src/app/actions` | Server Actions (formulários e gravações) |
| `src/lib` | Clientes do Supabase, consultas, formatação |
| `supabase/migrations` | Schema do banco |
| `scripts` | Utilitários de linha de comando |

## Acesso ao painel

Não há senha: a pessoa informa o e-mail em `/admin/login` e recebe um link.

Para dar acesso a alguém:

```bash
node scripts/criar-usuario.mjs email@exemplo.com "Nome da Pessoa" corretor
```

O terceiro argumento é `admin` ou `corretor`. Administrador enxerga também as
configurações e pode apagar imóveis.

> O envio de e-mail usa o serviço padrão do Supabase, que limita a poucas
> mensagens por hora. Antes de liberar para a equipe, configure um SMTP
> próprio em Authentication → Emails.

## Banco de dados

O schema está em `supabase/migrations/0001_init.sql`. Todas as tabelas usam
RLS: visitantes anônimos só enxergam o que está publicado, e escrita exige
usuário autenticado com perfil ativo.

## Publicação

```bash
npx vercel deploy --prod
```
