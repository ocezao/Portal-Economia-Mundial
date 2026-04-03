import { queryOne } from '@/lib/db';
import { logger } from '@/lib/logger';
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
  <title>${title} - Cenário Internacional</title>
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
    <div class="logo">Cenário Internacional</div>
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
        'Token não encontrado',
        'O link de confirmação está inválido ou incompleto. Por favor, solicite uma nova inscrição.',
        'error',
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return htmlResponse(
        'Token inválido',
        'O formato do token de confirmação é inválido. Por favor, solicite uma nova inscrição.',
        'error',
      );
    }

    const lead = await queryOne<{
      id: string;
      email: string;
      source: string;
      meta: Record<string, unknown> | null;
    }>(
      `select id, email, source, meta
       from public.leads
       where meta->>'confirmationToken' = $1
       limit 1`,
      [token],
    );

    if (!lead) {
      return htmlResponse(
        'Token não encontrado',
        'Não encontramos uma inscrição pendente com este token. Ele pode ter expirado ou já ter sido utilizado.',
        'error',
      );
    }

    const meta = { ...(lead.meta ?? {}) } as Record<string, unknown>;
    const status = typeof meta.status === 'string' ? meta.status : 'pending';
    const tokenExpiresAt = typeof meta.tokenExpiresAt === 'string' ? meta.tokenExpiresAt : null;

    if (status === 'active') {
      return htmlResponse(
        'Inscrição já confirmada',
        'Seu email já está confirmado em nossa newsletter. Obrigado!',
        'success',
      );
    }

    if (status === 'unsubscribed') {
      return htmlResponse(
        'Inscrição cancelada',
        'Esta inscrição foi cancelada anteriormente. Para se reinscrever, faça uma nova inscrição no site.',
        'error',
      );
    }

    if (tokenExpiresAt && new Date(tokenExpiresAt) < new Date()) {
      return htmlResponse(
        'Link expirado',
        'O link de confirmação expirou. Por favor, faça uma nova inscrição para receber um novo link.',
        'error',
      );
    }

    const nextMeta = {
      ...meta,
      status: 'active',
      confirmationToken: null,
      tokenExpiresAt: null,
      confirmedAt: new Date().toISOString(),
    };

    await queryOne(
      `update public.leads
       set meta = $2::jsonb
       where id = $1
       returning id`,
      [lead.id, JSON.stringify(nextMeta)],
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
        path: typeof meta.path === 'string' ? meta.path : null,
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
      ]).catch((error) => logger.error('Newsletter confirmation email dispatch failed', error));
    }

    return htmlResponse(
      'Inscrição confirmada!',
      'Seu email foi confirmado com sucesso. Você receberá nossas newsletters em breve. Obrigado por fazer parte do Cenário Internacional!',
      'success',
    );
  } catch (error) {
    logger.error('Erro na confirmação:', error);
    return htmlResponse(
      'Erro interno',
      'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
      'error',
    );
  }
}
