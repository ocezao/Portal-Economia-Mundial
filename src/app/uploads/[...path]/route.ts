import { readStoredFile } from '@/lib/server/fileStorage';

function buildRelativePath(parts: string[] | undefined) {
  return (parts ?? [])
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');
}

function buildHeaders(file: Awaited<ReturnType<typeof readStoredFile>>) {
  return {
    'Content-Type': file.contentType,
    'Content-Length': String(file.size),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Last-Modified': file.updatedAt,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const file = await readStoredFile(buildRelativePath((await params).path));
    return new Response(file.buffer, {
      status: 200,
      headers: buildHeaders(file),
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}

export async function HEAD(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const file = await readStoredFile(buildRelativePath((await params).path));
    return new Response(null, {
      status: 200,
      headers: buildHeaders(file),
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
