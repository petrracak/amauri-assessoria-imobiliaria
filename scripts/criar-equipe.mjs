/**
 * Cria as contas da equipe, com acesso por nome.
 *
 *   node scripts/criar-equipe.mjs
 *
 * As contas nascem SEM senha de propósito: quem define a primeira senha é
 * um administrador, pelo painel em /admin/equipe. Assim a senha nunca
 * trafega por arquivo, histórico de terminal ou conversa.
 *
 * O e-mail é derivado do nome e não recebe mensagem — serve só como
 * identificador para o Supabase Auth.
 */
import { readFileSync } from "node:fs";

const EQUIPE = [
  { nome: "Josué Ferreira", role: "corretor" },
  { nome: "George Lucas", role: "corretor" },
  { nome: "Amauri Nobre", role: "admin" },
  { nome: "Petr Racak", role: "admin" },
];

const DOMINIO = "equipe.amaurinobre.com.br";

function apelidoDe(nome) {
  return nome
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

function carregarEnv(caminho = ".env.local") {
  const env = {};
  for (const linha of readFileSync(caminho, "utf8").split("\n")) {
    const l = linha.trim();
    if (!l || l.startsWith("#") || !l.includes("=")) continue;
    const [k, ...resto] = l.split("=");
    env[k.trim()] = resto.join("=").trim();
  }
  return env;
}

const env = carregarEnv();
const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  "Content-Type": "application/json",
};

async function corpo(r) {
  const t = await r.text();
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return t;
  }
}

async function acharPorEmail(email) {
  const r = await fetch(`${base}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: cabecalhos,
  });
  const d = await corpo(r);
  return d?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

console.log(`${EQUIPE.length} contas a preparar\n`);

for (const { nome, role } of EQUIPE) {
  const usuario = apelidoDe(nome);
  const email = `${usuario}@${DOMINIO}`;

  let user = null;
  const criacao = await fetch(`${base}/auth/v1/admin/users`, {
    method: "POST",
    headers: cabecalhos,
    body: JSON.stringify({ email, email_confirm: true, user_metadata: { nome } }),
  });

  if (criacao.ok) {
    user = await corpo(criacao);
  } else {
    const erro = await corpo(criacao);
    const msg = typeof erro === "string" ? erro : (erro?.msg ?? erro?.message ?? "");
    if (!/already|exists|registered/i.test(msg)) {
      console.log(`  ${nome.padEnd(18)} ERRO: ${msg || criacao.status}`);
      continue;
    }
    user = await acharPorEmail(email);
  }

  if (!user?.id) {
    console.log(`  ${nome.padEnd(18)} ERRO: conta não localizada`);
    continue;
  }

  // O gatilho cria o perfil como corretor; o papel é definido aqui.
  const perfil = await fetch(`${base}/rest/v1/profiles?id=eq.${user.id}`, {
    method: "PATCH",
    headers: { ...cabecalhos, Prefer: "return=minimal" },
    body: JSON.stringify({ nome, usuario, role, ativo: true, email }),
  });

  console.log(
    perfil.ok
      ? `  ${nome.padEnd(18)} usuário: ${usuario.padEnd(18)} ${role}`
      : `  ${nome.padEnd(18)} ERRO no perfil: ${await perfil.text()}`,
  );
}

console.log(
  "\nContas criadas sem senha. Defina a primeira senha de cada uma em /admin/equipe.",
);
