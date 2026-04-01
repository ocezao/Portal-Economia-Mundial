import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

type StoredFile = {
  name: string;
  path: string;
  size: number;
  contentType: string | null;
  updatedAt: string | null;
  publicUrl: string;
  isVector: boolean;
};

const DEFAULT_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export function getUploadsRoot() {
  return process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR;
}

export async function ensureUploadsDir(relativeDir = '') {
  const dirPath = path.join(getUploadsRoot(), relativeDir);
  await mkdir(dirPath, { recursive: true });
  return dirPath;
}

export async function saveUploadedFile(options: {
  relativeDir: string;
  filename: string;
  buffer: Buffer;
}) {
  const targetDir = await ensureUploadsDir(options.relativeDir);
  const absolutePath = path.join(targetDir, options.filename);
  await writeFile(absolutePath, options.buffer);
  return absolutePath;
}

function normalizeRelativePath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

export function buildPublicUploadUrl(relativePath: string) {
  return `/uploads/${normalizeRelativePath(relativePath)}`;
}

export async function listStoredFiles(relativeDir = ''): Promise<StoredFile[]> {
  const targetDir = path.join(getUploadsRoot(), relativeDir);
  await ensureUploadsDir(relativeDir);

  const entries = await readdir(targetDir, { withFileTypes: true });
  const rows: StoredFile[] = [];

  for (const entry of entries) {
    const childRelative = normalizeRelativePath(path.posix.join(relativeDir.replace(/\\/g, '/'), entry.name));
    const absolutePath = path.join(getUploadsRoot(), childRelative);

    if (entry.isDirectory()) {
      const nested = await listStoredFiles(childRelative);
      rows.push(...nested);
      continue;
    }

    const info = await stat(absolutePath);
    const ext = path.extname(entry.name).toLowerCase();
    const contentType = ext === '.webp'
      ? 'image/webp'
      : ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : null;

    rows.push({
      name: entry.name,
      path: childRelative,
      size: info.size,
      contentType,
      updatedAt: info.mtime.toISOString(),
      publicUrl: buildPublicUploadUrl(childRelative),
      isVector: ext === '.svg',
    });
  }

  return rows;
}

export async function deleteStoredFile(relativePath: string) {
  const normalized = normalizeRelativePath(relativePath);
  const absolutePath = path.join(getUploadsRoot(), normalized);
  await rm(absolutePath, { force: true });
}
