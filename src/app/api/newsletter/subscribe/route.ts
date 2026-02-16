import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { isEmailConfigured, sendEmailSafe } from '@/lib/server/email';
import {
  newsletterConfirmTemplate,
  newsletterInternalTemplate,
} from '@/lib/server/emailTemplates';

const payloadSchema = z.object({
  email: z.string().trim().email().max(200),
  source: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^newsletter_[a-z0-9_]+$/i, 'source invalida')
    .default('newsletter_home'),
  path: z.string().trim().max(300).nullable().optional(),
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function generateConfirmationToken(): string {
  return crypto.randomUUID();
}

function getTokenExpiryDate(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

async function subscribeOnButtondown(email: string, source: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) return { ok: true };

  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags: [source],
      }),
    });

    if (response.ok) return { ok: true };

    const text = await response.text().catch(() => '');
    const alreadySubscribed =
      response.status === 409 || response.status === 422 || /already|exists|subscribed/i.test(text);

    if (alreadySubscribed) return { ok: true };
    return { ok: false, error: `buttondown_${response.status}: ${text || 'erro'}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'buttondown request failed',
    };
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = payloadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: 'Payload invalido', details: parsed.error.flatten() }, 400);
    }

    const input = parsed.data;
    const email = input.email.toLowerCase();
    const admin = getSupabaseAdminClient();

    let alreadySubscribed = false;
    const token = generateConfirmationToken();
    const tokenExpiresAt = getTokenExpiryDate().toISOString();

    // Check if email already has a confirmed subscription
    const existingCheck = await admin
      .from('leads')
      .select('id, status')
      .eq('email', email)
      .eq('source', input.source)
      .limit(1);

    if (existingCheck.error) {
      const leadsMissing = /Could not find the table 'public\.leads'/i.test(existingCheck.error.message);
      if (!leadsMissing) {
        return json({ error: existingCheck.error.message }, 500);
      }
    } else if (existingCheck.data && existingCheck.data.length > 0) {
      const existing = existingCheck.data[0];
      if (existing.status === 'active') {
        alreadySubscribed = true;
      }
      // If status is 'pending', we'll update with new token
    }

    if (!alreadySubscribed) {
      const leadsInsert = await admin.from('leads').insert({
        source: input.source,
        email,
        consent: true,
        status: 'pending',
        confirmation_token: token,
        token_expires_at: tokenExpiresAt,
        meta: {
          path: input.path ?? null,
          channel: 'newsletter',
        },
      });

      if (leadsInsert.error) {
        const duplicate = (leadsInsert.error as { code?: string }).code === '23505';
        const leadsMissing = /Could not find the table 'public\.leads'/i.test(leadsInsert.error.message);

        if (duplicate) {
          // Update existing record with new token (resend confirmation)
          const updateResult = await admin
            .from('leads')
            .update({
              confirmation_token: token,
              token_expires_at: tokenExpiresAt,
              updated_at: new Date().toISOString(),
            })
            .eq('email', email)
            .eq('source', input.source);

          if (updateResult.error) {
            return json({ error: updateResult.error.message }, 500);
          }
        } else if (leadsMissing) {
          const newsletterSubject = `[Newsletter] ${input.source}`;
          const lookup = await admin
            .from('contact_messages')
            .select('id')
            .eq('email', email)
            .eq('subject', newsletterSubject)
            .limit(1);

          if (lookup.error) return json({ error: lookup.error.message }, 500);

          if (lookup.data && lookup.data.length > 0) {
            alreadySubscribed = true;
          } else {
            const fallbackInsert = await admin.from('contact_messages').insert({
              name: email.split('@')[0].slice(0, 120) || 'newsletter',
              email,
              phone: null,
              subject: newsletterSubject,
              category: 'outro',
              message: `newsletter opt-in from ${input.path ?? '/'} - pending confirmation`,
              user_id: null,
            });

            if (fallbackInsert.error) return json({ error: fallbackInsert.error.message }, 500);
          }
        } else {
          return json({ error: leadsInsert.error.message }, 500);
        }
      }
    }

    const warnings: string[] = [];
    const buttondown = await subscribeOnButtondown(email, input.source);
    if (!buttondown.ok && buttondown.error) warnings.push(buttondown.error);

    if (isEmailConfigured() && !alreadySubscribed) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cenariointernacional.com.br';
      const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${token}`;

      const confirm = newsletterConfirmTemplate({ confirmUrl });
      const internal = newsletterInternalTemplate({
        email,
        source: input.source,
        path: input.path ?? null,
      });
      const inbox =
        process.env.NEWSLETTER_INBOX_EMAIL ||
        process.env.CONTACT_INBOX_EMAIL ||
        process.env.FROM_EMAIL ||
        process.env.SMTP_USER ||
        email;

      const [internalResult, confirmResult] = await Promise.all([
        sendEmailSafe({
          to: inbox,
          subject: internal.subject,
          html: internal.html,
          text: internal.text,
          replyTo: email,
        }),
        sendEmailSafe({
          to: email,
          subject: confirm.subject,
          html: confirm.html,
          text: confirm.text,
        }),
      ]);

      if (!internalResult.ok) warnings.push(`internal_email_failed: ${internalResult.error}`);
      if (!confirmResult.ok) warnings.push(`confirm_email_failed: ${confirmResult.error}`);
    }

    return json({
      ok: true,
      alreadySubscribed,
      pendingConfirmation: !alreadySubscribed,
      message: alreadySubscribed
        ? 'Email ja inscrito na newsletter'
        : 'Inscricao recebida! Verifique seu email para confirmar sua inscricao.',
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
