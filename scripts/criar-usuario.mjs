/**
 * Cria (ou promove) um usuário do painel.
 *
 *   node scripts/criar-usuario.mjs email@exemplo.com "Nome da Pessoa" admin
 *
 * O terceiro argumento é admin ou corretor; o padrão é corretor.
 * Não existe senha: a pessoa entra pelo link enviado por e-mail.
 *
 * Usa fetch direto na API, sem o supabase-js, para rodar em qualquer Node.
 */
import { readFileSync } from "node:fs";

function carregarEnv(caminho = ".env.local") {
  const env = {};
  for (const linha of readFileSync(caminho, "utf8").split("\n")) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#") || !limpa.includes("=")) continue;
    const [chave, ...resto] = limpa.split("=");
    env[chave.trim()] = resto.join("=").trim();
  }
  return env;
}

const [email, nome, role = "corretor"] = process.argv.slice(2);

if (!email || !nome) {
  console.error('Uso: node scripts/criar-usuario.mjs email@exemplo.com "Nome" [admin|corretor]');
  process.exit(1);
}

if (!["admin", "corretor"].includes(role)) {
  console.error('O papel precisa ser "admin" ou "corretor".');
  process.exit(1);
}

const env = carregarEnv();
const base = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const chave = env.SUPABASE_SERVICE_ROLE_KEY;

if (!base || !chave) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  "Content-Type": "application/json",
};

async function json(resposta) {
  const texto = await resposta.text();
  try {
    return texto ? JSON.parse(texto) : null;
  } catch {
    return texto;
  }
}

// 1. Cria o usuário no Auth (ou localiza, se já existir).
let userId;

const criacao = await fetch(`${base}/auth/v1/admin/users`, {
  method: "POST",
  headers: cabecalhos,
  body: JSON.stringify({ email, email_confirm: true, user_metadata: { nome, role } }),
});

if (criacao.ok) {
  userId = (await json(criacao))?.id;
} else {
  const erro = await json(criacao);
  const mensagem = typeof erro === "string" ? erro : (erro?.msg ?? erro?.message ?? "");

  if (!/already|exists|registered/i.test(mensagem)) {
    console.error("Erro ao criar usuário:", mensagem || criacao.status);
    process.exit(1);
  }

  const busca = await fetch(
    `${base}/auth/v1/admin/users?page=1&per_page=1000`,
    { headers: cabecalhos },
  );
  const lista = await json(busca);
  userId = lista?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )?.id;

  if (!userId) {
    console.error("Usuário já existe, mas não foi encontrado na listagem.");
    process.exit(1);
  }
  console.log("Usuário já existia — atualizando o perfil.");
}

// 2. Garante o perfil com o papel certo (o gatilho já cria; isto confirma).
const perfil = await fetch(`${base}/rest/v1/profiles?on_conflict=id`, {
  method: "POST",
  headers: {
    ...cabecalhos,
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify([{ id: userId, nome, email, role, ativo: true }]),
});

if (!perfil.ok) {
  console.error("Erro ao gravar o perfil:", await perfil.text());
  process.exit(1);
}

console.log(`Pronto: ${nome} <${email}> com acesso de ${role}.`);
console.log("Entre em /admin/login e peça o link de acesso por e-mail.");
