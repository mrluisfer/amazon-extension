#!/usr/bin/env node
/**
 * Runs a command with the linked Neon branch's env (DATABASE_URL, …) injected,
 * like `neon-env run -- <cmd>`, but resilient to expired OAuth sessions:
 * `@neon/env` does not refresh an expired OAuth token, while the `neon` CLI
 * does. On an auth failure we refresh once via the CLI and retry.
 *
 * Usage: node scripts/neon-env-run.mjs -- <command> [args…]
 * Variables already set in the shell win (explicit override).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const neonEnvBin = join(root, 'node_modules', '.bin', 'neon-env');

const sep = process.argv.indexOf('--');
const [cmd, ...args] = sep === -1 ? [] : process.argv.slice(sep + 1);
if (!cmd) {
  console.error('Usage: node scripts/neon-env-run.mjs -- <command> [args…]');
  process.exit(2);
}
if (!existsSync(neonEnvBin)) {
  console.error('neon-env not found. Run `pnpm install` at the repo root.');
  process.exit(1);
}

function exportEnv() {
  const res = spawnSync(neonEnvBin, ['export', '--format', 'json'], { encoding: 'utf8' });
  if (res.status === 0) {
    try {
      return { vars: JSON.parse(res.stdout) };
    } catch {
      return { error: 'neon-env returned invalid JSON' };
    }
  }
  return { error: (res.stderr || res.stdout || `exit ${res.status}`).trim() };
}

const isAuthError = (msg) => /credentials|bearer token|authenticat|unauthori[sz]ed|401/i.test(msg);

let result = exportEnv();
if (result.error && isAuthError(result.error)) {
  // Any authenticated CLI call refreshes the stored OAuth token.
  const refresh = spawnSync('neon', ['me', '-o', 'json'], { stdio: 'ignore' });
  if (refresh.status === 0) result = exportEnv();
}

if (result.error) {
  console.error(`\n✖ Could not load Neon env for the linked branch:\n  ${result.error}\n`);
  console.error(
    isAuthError(result.error)
      ? '  Fix: run `neon login`, or set a non-expiring NEON_API_KEY in your shell\n' +
          '  (https://console.neon.tech/app/settings/api-keys).\n'
      : '  Check `.neon` (run `neon link`) and your network connection.\n',
  );
  process.exit(1);
}

const child = spawn(cmd, args, {
  stdio: 'inherit',
  env: { ...result.vars, ...process.env },
});

// Let the child handle Ctrl+C (tsx watch shuts down gracefully); mirror its exit.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
child.on('error', (err) => {
  console.error(`✖ Failed to start ${cmd}: ${err.message}`);
  process.exit(1);
});
