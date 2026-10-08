#!/usr/bin/env node
// PostToolUse hook: formats the edited file with Biome. Format only — lint fixes
// (e.g. let→const) can corrupt multi-step edits; `pnpm lint` reports those instead.
// Never blocks: formatting problems surface later in `pnpm lint`.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const FORMATTABLE = /\.(ts|tsx|js|mjs|cjs|jsx|json|jsonc|css)$/;

let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const filePath = JSON.parse(input)?.tool_input?.file_path ?? '';
    const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    const biome = join(root, 'node_modules', '.bin', 'biome');
    if (FORMATTABLE.test(filePath) && existsSync(filePath) && existsSync(biome)) {
      spawnSync(biome, ['format', '--write', '--no-errors-on-unmatched', filePath], {
        cwd: root,
        stdio: 'ignore',
        timeout: 15_000,
      });
    }
  } catch {
    // ignore
  }
  process.exit(0);
});
