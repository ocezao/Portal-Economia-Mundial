import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { isEmailConfigured, sendEmailSafe } from '@/lib/server/email';
import { careerAckTemplate, careerInternalTemplate } from '@/lib/server/emailTemplates';

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).nullable().optional(),
  role: z.string().trim().min(2).max(160),
  location: z.string().trim().max(160).nullable().optional(),
  linkedinUrl: z.string().trim().url().max(500).nullable().optional(),
  portfolioUrl: z.string().trim().url().max(500).nullable().optional(),
  resumeUrl: z.string().trim().url().max(500).nullable().optional(),
  coverLetter: z.string().trim().min(60).max(6000),
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
    const admin = getSupabaseAdminClient();

    const { error } = await admin.from('career_applications').insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role,
      location: input.location ?? null,
      linkedin_url: input.linkedinUrl ?? null,
      portfolio_url: input.portfolioUrl ?? null,
      resume_url: input.resumeUrl ?? null,
      cover_letter: input.coverLetter,
      user_id: input.userId ?? null,
    });

    if (error) return json({ error: error.message }, 500);

    let emailWarnings: string[] = [];
    if (isEmailConfigured()) {
      const internal = careerInternalTemplate(input);
      const ack = careerAckTemplate(input.name);
      const inbox = process.env.CAREERS_INBOX_EMAIL || process.env.CONTACT_INBOX_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USER || input.email;

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
