import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.svg']);

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

async function convertToWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExt.has(ext)) return null;
  if (filePath.toLowerCase().endsWith('.webp')) return null;

  const outputPath = filePath.replace(/\.[^.]+$/, '.webp');

  try {
    await sharp(filePath, { animated: true })
      .webp({ quality: 82 })
      .toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error(`Erro ao converter: ${filePath}`, error?.message ?? error);
    return null;
  }
}

async function main() {
  const files = await listFiles(publicDir);
  const converted = [];

  for (const file of files) {
    const result = await convertToWebp(file);
    if (result) converted.push(result);
  }

  console.log(`Convertidos: ${converted.length}`);
  if (converted.length > 0) {
    console.log(converted.map(p => `- ${path.relative(projectRoot, p)}`).join('\n'));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
