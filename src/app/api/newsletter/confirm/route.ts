import { query, queryOne } from '@/lib/db';
import { isEmailConfigured, sendEmailSafe } from '@/lib/server/email';
import { newsletterAckTemplate, newsletterInternalTemplate } from '@/lib/server/emailTemplates';

function htmlResponse(title: string, message: string, status: 'success' | 'error' = 'success'): Response {
  const bgColor = status === 'success' ? '#dcfce7' : '#fee2e2';
  const textColor = status === 'success' ? '#166534' : '#991b1b';
  const borderColor = status === 'success' ? '#86efac' : '#fca5a5';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Cenario Internacional</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { max-width: 500px; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    .message { background: ${bgColor}; color: ${textColor}; border: 1px solid ${borderColor}; padding: 20px; border-radius: 8px; margin: 20px 0; }
    h1 { color: #111; margin-bottom: 10px; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #111; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Cenario Internacional</div>
    <h1>${title}</h1>
    <div class="message">${message}</div>
    <p><a href="/">Voltar para o site</a></p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: status === 'success' ? 200 : 400,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return htmlResponse(
        'Token nao encontrado',
        'O link de confirmacao esta invalido ou incompleto. Por favor, solicite uma nova inscricao.',
        'error',
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return htmlResponse(
        'Token invalido',
        'O formato do token de confirmacao e invalido. Por favor, solicite uma nova inscricao.',
        'error',
      );
    }

    const lead = await queryOne<{
      id: string;
      email: string;
      source: string;
      status: string;
      token_expires_at: string | null;
      meta: { path?: string | null } | null;
    }>(
      `select id, email, source, status, token_expires_at, meta
       from leads
       where confirmation_token = $1
       limit 1`,
      [token],
    );

    if (!lead) {
      return htmlResponse(
        'Token nao encontrado',
        'Nao encontramos uma inscricao pendente com este token. Ele pode ter expirado ou ja ter sido utilizado.',
        'error',
      );
    }

    if (lead.status === 'active') {
      return htmlResponse(
        'Inscricao ja confirmada',
        'Seu email ja esta confirmado em nossa newsletter. Obrigado!',
        'success',
      );
    }

    if (lead.status === 'unsubscribed') {
      return htmlResponse(
        'Inscricao cancelada',
        'Esta inscricao foi cancelada anteriormente. Para se reinscrever, por favor faca uma nova inscricao no site.',
        'error',
      );
    }

    if (lead.token_expires_at && new Date(lead.token_expires_at) < new Date()) {
      return htmlResponse(
        'Link expirado',
        'O link de confirmacao expirou. Por favor, faca uma nova inscricao para receber um novo link.',
        'error',
      );
    }

    await query(
      `update leads
       set status = 'active',
           confirmation_token = null,
           token_expires_at = null,
           updated_at = now()
       where id = $1`,
      [lead.id],
    );

    if (isEmailConfigured()) {
      const ack = newsletterAckTemplate();
      const inbox =
        process.env.NEWSLETTER_INBOX_EMAIL ||
        process.env.CONTACT_INBOX_EMAIL ||
        process.env.FROM_EMAIL ||
        process.env.SMTP_USER ||
        lead.email;

      const internal = newsletterInternalTemplate({
        email: lead.email,
        source: lead.source,
        path: lead.meta?.path || null,
      });

      void Promise.all([
        sendEmailSafe({
          to: lead.email,
          subject: ack.subject,
          html: ack.html,
          text: ack.text,
        }),
        sendEmailSafe({
          to: inbox,
          subject: `[CONFIRMADO] ${internal.subject}`,
          html: internal.html,
          text: internal.text,
          replyTo: lead.email,
        }),
      ]).catch(console.error);
    }

    return htmlResponse(
      'Inscricao confirmada!',
      'Seu email foi confirmado com sucesso. Voce recebera nossas newsletters em breve. Obrigado por fazer parte do Cenario Internacional!',
      'success',
    );
  } catch (error) {
    console.error('Erro na confirmacao:', error);
    return htmlResponse(
      'Erro interno',
      'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
      'error',
    );
  }
}
