export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  // Vercel provides this at runtime on the server (no protocol).
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  // Default local URL (dev server runs on 5173 in this project).
  return 'http://localhost:5173';
}
