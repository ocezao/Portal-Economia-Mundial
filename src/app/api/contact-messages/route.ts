import { z } from 'zod';
import { query } from '@/lib/db';
import { isEmailConfigured, sendEmailSafe } from '@/lib/server/email';
import { contactAckTemplate, contactInternalTemplate } from '@/lib/server/emailTemplates';

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).nullable().optional(),
  subject: z.string().trim().min(4).max(180),
  category: z.enum(['duvida', 'parceria', 'suporte', 'outro']),
  message: z.string().trim().min(20).max(4000),
  userId: z.string().trim().uuid().nullable().optional(),
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = payloadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: 'Payload invalido', details: parsed.error.flatten() }, 400);
    }

    const input = parsed.data;

    await query(
      `insert into contact_messages (
        name, email, phone, subject, category, message, user_id
      ) values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.name,
        input.email,
        input.phone ?? null,
        input.subject,
        input.category,
        input.message,
        input.userId ?? null,
      ],
    );

    const emailWarnings: string[] = [];
    if (isEmailConfigured()) {
      const internal = contactInternalTemplate(input);
      const ack = contactAckTemplate(input.name);
      const inbox = process.env.CONTACT_INBOX_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USER || input.email;

      const [internalResult, ackResult] = await Promise.all([
        sendEmailSafe({
          to: inbox,
          subject: internal.subject,
          html: internal.html,
          text: internal.text,
          replyTo: input.email,
        }),
        sendEmailSafe({
          to: input.email,
          subject: ack.subject,
          html: ack.html,
          text: ack.text,
        }),
      ]);

      if (!internalResult.ok) emailWarnings.push(`internal_email_failed: ${internalResult.error}`);
      if (!ackResult.ok) emailWarnings.push(`ack_email_failed: ${ackResult.error}`);
    }

    return json({ ok: true, emailWarnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
