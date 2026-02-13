import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const mode = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!mode || (mode !== 'dev' && mode !== 'start')) {
  // Keep this terse: it's used in CI and by Playwright webServer.
  // eslint-disable-next-line no-console
  console.error('Usage: node scripts/run-next.mjs <dev|start> [args...]');
  process.exit(1);
}

const defaultPort = mode === 'dev' ? '5173' : '3000';
const port = process.env.PORT || defaultPort;

const nextBin = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'next.cmd' : 'next'
);

const args = mode === 'dev'
  ? ['dev', '-p', port, ...extraArgs]
  : ['start', '-p', port, ...extraArgs];

const child = spawn(nextBin, args, {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (typeof code === 'number') process.exit(code);
  // eslint-disable-next-line no-console
  console.error(`Next process exited due to signal: ${signal}`);
  process.exit(1);
});
