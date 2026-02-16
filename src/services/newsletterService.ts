export interface NewsletterSubscribeInput {
  email: string;
  source?: string;
  path?: string | null;
}

export async function subscribeNewsletter(input: NewsletterSubscribeInput): Promise<{ alreadySubscribed: boolean }> {
  const response = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    alreadySubscribed?: boolean;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Falha ao assinar newsletter');
  }

  return { alreadySubscribed: Boolean(payload.alreadySubscribed) };
}
