/**
 * Liga o envio de e-mails do Supabase num servidor SMTP próprio (Brevo).
 *
 *   node scripts/configurar-smtp.mjs
 *
 * Sem isso o Supabase usa o servidor de cortesia dele: 2 e-mails por hora,
 * remetente genérico e templates que não dá para traduzir. Com SMTP próprio
 * o limite sobe, o remetente passa a ser o da Amauri e os textos viram
 * portugês com a marca.
 *
 * A chave SMTP é pedida aqui na hora e não aparece na tela, no histórico do
 * terminal nem em arquivo algum: vai direto deste processo para a API do
 * Supabase, que a guarda do lado dele.
 *
 * Precisa de SUPABASE_ACCESS_TOKEN no ambiente (token de conta do Supabase).
 */
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

const PROJETO = "yumksmypwjyzvupetpgg";

const BREVO = {
  host: "smtp-relay.brevo.com",
  port: 587,
};

/** Quantos e-mails o Supabase aceita disparar por hora. */
const LIMITE_POR_HORA = 100;

/** Segundos mínimos entre dois e-mails para o mesmo endereço. */
const INTERVALO = 20;

function pergunta(texto, { oculto = false } = {}) {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });

  if (oculto) {
    // Intercepta a escrita do readline: ele ecoaria a chave caractere a
    // caractere. Depois do prompt, engole tudo.
    let prompt = true;
    rl._writeToOutput = (s) => {
      if (prompt) {
        stdout.write(s);
        if (s.includes(texto)) prompt = false;
      }
    };
  }

  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      rl.close();
      if (oculto) stdout.write("\n");
      resolve(resposta.trim());
    });
  });
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    "Falta SUPABASE_ACCESS_TOKEN no ambiente.\n" +
      "Abra um terminal novo ou rode: source ~/.zshrc",
  );
  process.exit(1);
}

console.log(
  "\nDados da Brevo (Settings → SMTP & API → SMTP).\n" +
    "O remetente precisa estar verificado lá em Senders.\n",
);

const remetente = await pergunta("E-mail remetente (ex.: contato@...): ");
const nome = (await pergunta("Nome que aparece no envio [Amauri Assessoria Imobiliária]: ")) ||
  "Amauri Assessoria Imobiliária";
const login = await pergunta("Login SMTP da Brevo (algo@smtp-brevo.com): ");
const chave = await pergunta("Chave SMTP (não aparece na tela): ", { oculto: true });

if (!remetente.includes("@") || !login || !chave) {
  console.error("\nFaltou algum dado. Nada foi alterado.");
  process.exit(1);
}

const resposta = await fetch(
  `https://api.supabase.com/v1/projects/${PROJETO}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      smtp_host: BREVO.host,
      smtp_port: String(BREVO.port),
      smtp_user: login,
      smtp_pass: chave,
      smtp_admin_email: remetente,
      smtp_sender_name: nome,
      rate_limit_email_sent: LIMITE_POR_HORA,
      smtp_max_frequency: INTERVALO,
    }),
  },
);

if (!resposta.ok) {
  console.error(`\nO Supabase recusou (${resposta.status}):`);
  console.error(await resposta.text());
  process.exit(1);
}

console.log(
  `\nPronto. Os e-mails saem agora por ${BREVO.host} como "${nome}" <${remetente}>,\n` +
    `até ${LIMITE_POR_HORA} por hora.\n\n` +
    "Próximo passo: node scripts/traduzir-emails.mjs\n",
);
