import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const input = path.join(projectRoot, 'public', 'favicon.ico');
const outDir = path.join(projectRoot, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

await fs.mkdir(outDir, { recursive: true });

for (const size of sizes) {
  const outFile = path.join(outDir, `icon-${size}x${size}.png`);

  await sharp(input)
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(outFile);
}

// eslint-disable-next-line no-console
console.log(`Generated PWA icons in ${path.relative(projectRoot, outDir)}`);

