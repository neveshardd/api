import type { EmailMessage } from "@/lib/email/mailer";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildInvitationEmail(params: {
  readonly to: string;
  readonly link: string;
  readonly baseUrl: string;
  readonly isInitialSetup: boolean;
  readonly expiresInHours: number;
}): EmailMessage {
  const { to, link, baseUrl, isInitialSetup, expiresInHours } = params;
  const subject = isInitialSetup
    ? "Configure o acesso de administrador principal — AGAGE"
    : "Você foi convidado para o AGAGE Painel";
  const intro = isInitialSetup
    ? "Use o link abaixo para criar a senha do administrador principal do AGAGE Painel."
    : "Você recebeu acesso ao AGAGE Painel. Use o link abaixo para criar a sua senha.";
  const warning = `O link é pessoal, vale por ${expiresInHours} horas e pode ser usado uma única vez. Se você não esperava este e-mail, ignore-o.`;

  const safeLink = escapeHtml(link);
  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:32px 16px;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c2127;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;">
      <tr><td style="padding:32px 32px 8px;"><img src="${escapeHtml(baseUrl)}/agage.png" alt="AGAGE" width="140" style="display:block;height:auto;" /></td></tr>
      <tr><td style="padding:16px 32px;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</td></tr>
      <tr><td style="padding:8px 32px 24px;"><a href="${safeLink}" style="display:inline-block;padding:10px 20px;background:#2d72d2;color:#ffffff;text-decoration:none;font-weight:600;border-radius:4px;">Criar senha</a></td></tr>
      <tr><td style="padding:0 32px 32px;font-size:13px;line-height:1.6;color:#5f6b7c;">${escapeHtml(warning)}<br /><br />Se o botão não funcionar, copie este endereço no navegador:<br /><span style="word-break:break-all;">${safeLink}</span></td></tr>
    </table>
  </body>
</html>`;

  const text = `${intro}\n\n${link}\n\n${warning}`;
  return { to, subject, html, text };
}
