import { randomUUID } from 'crypto';

import { z } from 'zod';

import { queryOne } from '@/lib/db';
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
    const token = randomUUID();
    const tokenExpiresAt = getTokenExpiryDate().toISOString();

    const existing = await queryOne<{
      id: string;
      meta: Record<string, unknown> | null;
    }>(
      `select id, meta
       from public.leads
       where email_normalized = lower($1)
         and source = $2
       limit 1`,
      [email, input.source],
    );

    const existingMeta = (existing?.meta ?? {}) as Record<string, unknown>;
    const currentStatus = typeof existingMeta.status === 'string' ? existingMeta.status : null;
    const alreadySubscribed = currentStatus === 'active';

    if (!alreadySubscribed) {
      const nextMeta = {
        ...existingMeta,
        path: input.path ?? null,
        channel: 'newsletter',
        status: 'pending',
        confirmationToken: token,
        tokenExpiresAt,
      };

      await queryOne(
        `insert into public.leads (source, name, email, consent, meta)
         values ($1, $2, $3, true, $4::jsonb)
         on conflict (email_normalized, source) do update
           set name = excluded.name,
               consent = excluded.consent,
               meta = excluded.meta
         returning id`,
        [input.source, email.split('@')[0].slice(0, 120) || 'newsletter', email, JSON.stringify(nextMeta)],
      );
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
