import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
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

function resolveUploadsPath(relativePath = '') {
  const normalized = normalizeRelativePath(relativePath);
  const root = path.resolve(getUploadsRoot());
  const absolutePath = path.resolve(root, normalized);

  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error('Upload path outside storage root');
  }

  return {
    root,
    normalized,
    absolutePath,
  };
}

export function buildPublicUploadUrl(relativePath: string) {
  return `/uploads/${normalizeRelativePath(relativePath)}`;
}

export async function listStoredFiles(relativeDir = ''): Promise<StoredFile[]> {
  const { absolutePath: targetDir } = resolveUploadsPath(relativeDir);
  await ensureUploadsDir(relativeDir);

  const entries = await readdir(targetDir, { withFileTypes: true });
  const rows: StoredFile[] = [];

  for (const entry of entries) {
    const childRelative = normalizeRelativePath(path.posix.join(relativeDir.replace(/\\/g, '/'), entry.name));
    const { absolutePath } = resolveUploadsPath(childRelative);

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
  const { absolutePath } = resolveUploadsPath(relativePath);
  await rm(absolutePath, { force: true });
}

export function getStoredFileContentType(relativePath: string) {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.avif') return 'image/avif';
  return 'application/octet-stream';
}

export async function readStoredFile(relativePath: string) {
  const { normalized, absolutePath } = resolveUploadsPath(relativePath);
  const [buffer, info] = await Promise.all([
    readFile(absolutePath),
    stat(absolutePath),
  ]);

  return {
    path: normalized,
    absolutePath,
    buffer,
    size: info.size,
    updatedAt: info.mtime.toUTCString(),
    contentType: getStoredFileContentType(normalized),
  };
}
