export type ContactMessageInput = {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  category: 'duvida' | 'parceria' | 'suporte' | 'outro';
  message: string;
  userId?: string | null;
};

export type JobApplicationInput = {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  coverLetter: string;
  userId?: string | null;
};

export async function createContactMessage(input: ContactMessageInput) {
  const response = await fetch('/api/contact-messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error || 'Falha ao enviar mensagem');
}

export async function createJobApplication(input: JobApplicationInput) {
  const response = await fetch('/api/career-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error || 'Falha ao enviar candidatura');
}
