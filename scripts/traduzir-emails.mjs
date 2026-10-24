/**
 * Põe os e-mails do Supabase Auth em português e com a cara da Amauri.
 *
 *   node scripts/traduzir-emails.mjs
 *
 * O Supabase só aceita template próprio depois que o projeto tem SMTP
 * próprio — rode scripts/configurar-smtp.mjs antes.
 *
 * O cabeçalho é tipográfico de propósito: quase todo cliente de e-mail
 * bloqueia imagem por padrão, e um logo que não carrega deixa um buraco no
 * topo da mensagem.
 */
const PROJETO = "yumksmypwjyzvupetpgg";

const TINTA = "#081828";
const AZUL = "#1868a8";

/**
 * Monta a mensagem inteira. Tabela e estilo em linha porque o Outlook
 * ignora folha de estilo e layout moderno.
 */
function email({ titulo, texto, botao, rodape }) {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(8,24,40,.08);">

        <tr><td style="background:${TINTA};padding:28px 32px;">
          <div style="font-size:22px;font-weight:700;letter-spacing:.14em;color:#ffffff;">AMAURI</div>
          <div style="margin-top:6px;font-size:10px;letter-spacing:.22em;color:rgba(255,255,255,.65);">ASSESSORIA IMOBILIÁRIA</div>
        </td></tr>

        <tr><td style="padding:36px 32px 32px;">
          <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:${TINTA};">${titulo}</h1>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#4a5767;">${texto}</p>

          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:${AZUL};">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${botao}</a>
          </td></tr></table>

          <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#8793a3;">${rodape}</p>

          <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#aab3bf;word-break:break-all;">
            Se o botão não funcionar, copie este endereço no navegador:<br>{{ .ConfirmationURL }}
          </p>
        </td></tr>

        <tr><td style="padding:20px 32px;border-top:1px solid #eef1f5;font-size:12px;color:#aab3bf;">
          Amauri Assessoria Imobiliária · Santarém, Pará · CRECI 1028
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const EXPIRA = "O link vale por uma hora e só pode ser usado uma vez.";
const NAO_PEDIU = (o) =>
  `Se não foi você que ${o}, pode ignorar esta mensagem — nada muda sozinho.`;

const config = {
  mailer_subjects_magic_link: "Seu acesso ao painel da Amauri",
  mailer_templates_magic_link_content: email({
    titulo: "Entrar no painel",
    texto:
      "Toque no botão abaixo para abrir o painel da Amauri Assessoria " +
      "Imobiliária. Não precisa digitar senha.",
    botao: "Abrir o painel",
    rodape: `${EXPIRA} ${NAO_PEDIU("pediu este acesso")}`,
  }),

  mailer_subjects_recovery: "Redefinir sua senha do painel",
  mailer_templates_recovery_content: email({
    titulo: "Criar uma senha nova",
    texto:
      "Você pediu para trocar a senha de acesso ao painel. Toque no botão " +
      "e escolha a senha nova.",
    botao: "Escolher nova senha",
    rodape: `${EXPIRA} ${NAO_PEDIU("fez este pedido")} Sua senha atual continua valendo.`,
  }),

  mailer_subjects_invite: "Você foi convidado para o painel da Amauri",
  mailer_templates_invite_content: email({
    titulo: "Seu acesso está pronto",
    texto:
      "Criaram uma conta para você no painel da Amauri Assessoria " +
      "Imobiliária, onde a equipe cadastra os imóveis e acompanha os " +
      "contatos. Toque no botão para entrar e definir sua senha.",
    botao: "Ativar meu acesso",
    rodape: EXPIRA,
  }),

  mailer_subjects_confirmation: "Confirme seu e-mail",
  mailer_templates_confirmation_content: email({
    titulo: "Confirme seu e-mail",
    texto:
      "Falta só confirmar que este endereço é seu para liberar o acesso ao " +
      "painel.",
    botao: "Confirmar e-mail",
    rodape: EXPIRA,
  }),

  mailer_subjects_email_change: "Confirme seu novo e-mail",
  mailer_templates_email_change_content: email({
    titulo: "Confirme o novo endereço",
    texto:
      "Pediram para trocar o e-mail de acesso ao painel para este endereço. " +
      "Confirme para concluir a troca.",
    botao: "Confirmar a troca",
    rodape: `${EXPIRA} ${NAO_PEDIU("pediu a troca")}`,
  }),
};

// `--previa <pasta>` grava os arquivos em vez de aplicar, para conferir o
// visual no navegador antes de mexer no projeto.
const previa = process.argv.indexOf("--previa");
if (previa !== -1) {
  const pasta = process.argv[previa + 1] ?? ".";
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(pasta, { recursive: true });

  for (const [chave, valor] of Object.entries(config)) {
    if (!chave.endsWith("_content")) continue;
    const nome = chave.replace("mailer_templates_", "").replace("_content", "");
    // O token do Supabase não vale nada fora do envio real.
    const arquivo = `${pasta}/${nome}.html`;
    await writeFile(arquivo, valor.replaceAll("{{ .ConfirmationURL }}", "#"));
    console.log(arquivo);
  }
  process.exit(0);
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    "Falta SUPABASE_ACCESS_TOKEN no ambiente.\n" +
      "Abra um terminal novo ou rode: source ~/.zshrc",
  );
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
    body: JSON.stringify(config),
  },
);

if (!resposta.ok) {
  const corpo = await resposta.text();
  console.error(`\nO Supabase recusou (${resposta.status}):`);
  console.error(corpo);
  if (/smtp/i.test(corpo) || resposta.status === 400) {
    console.error(
      "\nNo plano gratuito o template só é aceito depois do SMTP próprio.\n" +
        "Rode antes: node scripts/configurar-smtp.mjs",
    );
  }
  process.exit(1);
}

console.log("\nOs cinco e-mails do painel estão em português e com a marca.\n");
