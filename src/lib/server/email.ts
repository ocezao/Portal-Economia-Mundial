import nodemailer from 'nodemailer';

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 0);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_SECURITY = (process.env.SMTP_SECURITY || 'SSL').toUpperCase();
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const FROM_NAME = process.env.FROM_NAME || 'Cenario Internacional';
const DEFAULT_REPLY_TO = process.env.REPLY_TO || FROM_EMAIL;

let transporter: nodemailer.Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && FROM_EMAIL);
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const secure = SMTP_SECURITY === 'SSL' || SMTP_PORT === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('Email provider not configured. Set SMTP_* and FROM_* env vars.');
  }

  await getTransporter().sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
    replyTo: payload.replyTo || DEFAULT_REPLY_TO,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

export async function sendEmailSafe(payload: EmailPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sendEmail(payload);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown email error';
    return { ok: false, error: message };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const html = {
  esc: escapeHtml,
};
