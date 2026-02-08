export function escXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function withTrailingSlash(path: string) {
  return path === '/' || path.endsWith('/') ? path : `${path}/`;
}

export function absoluteUrl(siteUrl: string, path: string) {
  const base = siteUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${withTrailingSlash(p)}`;
}

export function resolveAbsoluteUrl(siteUrl: string, maybeUrl: string) {
  const v = (maybeUrl ?? '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('/')) return `${siteUrl.replace(/\/$/, '')}${v}`;
  return `${siteUrl.replace(/\/$/, '')}/${v}`;
}

