import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { isEmailConfigured, sendEmailSafe } from '@/lib/server/email';
import { newsletterAckTemplate, newsletterInternalTemplate } from '@/lib/server/emailTemplates';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      max-width: 500px;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
    }
    .message {
      background: ${bgColor};
      color: ${textColor};
      border: 1px solid ${borderColor};
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    h1 {
      color: #111;
      margin-bottom: 10px;
    }
    a {
      color: #3b82f6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #111;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Cenário Internacional</div>
    <h1>${title}</h1>
    <div class="message">
      ${message}
    </div>
    <p><a href="/">Voltar para o site</a></p>
  </div>
</body>
</html>
  `;
  
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
        'error'
      );
    }

    // Validar formato do token UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return htmlResponse(
        'Token inválido',
        'O formato do token de confirmação é inválido. Por favor, solicite uma nova inscrição.',
        'error'
      );
    }

    const admin = getSupabaseAdminClient();

    // Buscar lead pelo token
    const { data: lead, error: findError } = await admin
      .from('leads')
      .select('id, email, source, status, token_expires_at, meta')
      .eq('confirmation_token', token)
      .limit(1)
      .single();

    if (findError || !lead) {
      return htmlResponse(
        'Token não encontrado',
        'Não encontramos uma inscrição pendente com este token. Ele pode ter expirado ou já ter sido utilizado.',
        'error'
      );
    }

    // Verificar se já está ativo
    if (lead.status === 'active') {
      return htmlResponse(
        'Inscrição já confirmada',
        'Seu email já está confirmado em nossa newsletter. Obrigado!',
        'success'
      );
    }

    // Verificar se foi desinscrito
    if (lead.status === 'unsubscribed') {
      return htmlResponse(
        'Inscrição cancelada',
        'Esta inscrição foi cancelada anteriormente. Para se reinscrever, por favor faça uma nova inscrição no site.',
        'error'
      );
    }

    // Verificar expiração do token
    if (lead.token_expires_at && new Date(lead.token_expires_at) < new Date()) {
      return htmlResponse(
        'Link expirado',
        'O link de confirmação expirou. Por favor, faça uma nova inscrição para receber um novo link.',
        'error'
      );
    }

    // Ativar a inscrição
    const { error: updateError } = await admin
      .from('leads')
      .update({
        status: 'active',
        confirmation_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Erro ao atualizar lead:', updateError);
      return htmlResponse(
        'Erro ao confirmar',
        'Ocorreu um erro ao confirmar sua inscrição. Por favor, tente novamente mais tarde ou entre em contato conosco.',
        'error'
      );
    }

    // Enviar email de boas-vindas (não bloqueante)
    if (isEmailConfigured()) {
      const ack = newsletterAckTemplate();
      const inbox =
        process.env.NEWSLETTER_INBOX_EMAIL ||
        process.env.CONTACT_INBOX_EMAIL ||
        process.env.FROM_EMAIL ||
        process.env.SMTP_USER ||
        lead.email;

      const meta = lead.meta as { path?: string | null } || {};
      const internal = newsletterInternalTemplate({
        email: lead.email,
        source: lead.source,
        path: meta.path || null,
      });

      // Enviar emails em background (não aguardar)
      Promise.all([
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
      'Inscrição confirmada!',
      'Seu email foi confirmado com sucesso. Você receberá nossas newsletters em breve. Obrigado por fazer parte do Cenário Internacional!',
      'success'
    );
  } catch (error) {
    console.error('Erro na confirmação:', error);
    return htmlResponse(
      'Erro interno',
      'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
      'error'
    );
  }
}
