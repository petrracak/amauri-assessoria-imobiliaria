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

A equipe entra em `/admin/login` pelo nome ou pelo e-mail, com senha. Quem
tem e-mail de verdade pode pedir um link de acesso no lugar da senha.

Contas novas saem de `/admin/equipe`, no próprio painel: um administrador
cria a conta, escolhe entre `admin` e `corretor` e define a primeira senha
ali mesmo. Administrador enxerga também as configurações e pode apagar
imóveis.

Para o primeiro administrador de um projeto novo, ainda não há ninguém para
abrir `/admin/equipe`. Crie-o pela linha de comando; a partir daí o resto da
equipe é criada pelo painel:

```bash
node scripts/criar-usuario.mjs email@exemplo.com "Nome da Pessoa" admin
```

A conta nasce sem senha de propósito: a primeira é definida em `/admin/conta`,
pelo link de primeiro acesso que o script imprime. Assim a senha não passa
por arquivo nem por histórico de terminal.

## E-mails do painel

Sem SMTP próprio o Supabase usa o servidor de cortesia dele: duas mensagens
por hora, remetente genérico e textos em inglês que ele não deixa trocar.

Com uma conta na [Brevo](https://www.brevo.com) (300 e-mails por dia, sem
custo e sem mexer em DNS), dois comandos resolvem:

```bash
node scripts/configurar-smtp.mjs
node scripts/traduzir-emails.mjs
```

O primeiro pede os dados da Brevo e grava no Supabase — a chave é digitada
na hora, não aparece na tela e não fica em arquivo nenhum. O segundo põe as
cinco mensagens em português, com a marca. Para conferir o visual antes:

```bash
node scripts/traduzir-emails.mjs --previa /tmp/emails
```

Os dois precisam de `SUPABASE_ACCESS_TOKEN` no ambiente.

## Banco de dados

O schema está em `supabase/migrations/0001_init.sql`. Todas as tabelas usam
RLS: visitantes anônimos só enxergam o que está publicado, e escrita exige
usuário autenticado com perfil ativo.

## Publicação

```bash
npx vercel deploy --prod
```
