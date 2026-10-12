// Builds the tester zip in one step and, optionally, refreshes your own unpacked copy.
//
//   pnpm release:testers                      # validate + zip
//   pnpm release:testers --bump               # also bump the patch version (testers see it change)
//   pnpm release:testers --install <dir>      # also copy the build into <dir> (then click ↻)
//
// Reads WXT_API_URL and WXT_MANIFEST_KEY like the build does (env vars, then
// apps/extension/.env.production / .env). EXTENSION_INSTALL_DIR can replace --install.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { loadEnv } from 'vite';

const root = resolve(import.meta.dirname, '..');
const { values: args } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== '--'),
  options: { bump: { type: 'boolean', default: false }, install: { type: 'string' } },
});

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

// 1. Validate the configuration the zip will be built with.
const env = loadEnv('production', root, 'WXT_');
let api;
try {
  api = new URL(env.WXT_API_URL ?? '');
} catch {
  fail(
    'WXT_API_URL is not set. Add it to apps/extension/.env.production (git-ignored):\n' +
      '  WXT_API_URL=https://<your-api>.onrender.com',
  );
}
if (api.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(api.hostname)) {
  fail(`Tester builds must call the deployed API over https (got ${api.origin}).`);
}
const key = env.WXT_MANIFEST_KEY?.trim();
if (!key) {
  fail(
    'WXT_MANIFEST_KEY is not set, so the extension ID would change with each folder.\n' +
      '  Create it once: pnpm --filter @repo/extension manifest-key -- ~/.config/historial-precios-mx/extension-key.pem\n' +
      '  and add the printed line to apps/extension/.env',
  );
}

// Validate the optional install folder before building, so a bad path fails fast.
const installDir = args.install ?? process.env.EXTENSION_INSTALL_DIR;
const target = installDir
  ? resolve(installDir.replace(/^~(?=$|\/)/, process.env.HOME ?? '~'))
  : null;
if (target && existsSync(target)) {
  const entries = readdirSync(target);
  if (entries.length > 0 && !entries.includes('manifest.json')) {
    fail(`${target} is not empty and doesn't look like an extension folder; refusing to wipe it.`);
  }
}

// 2. Optional patch bump, so testers can tell versions apart in chrome://extensions.
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (args.bump) {
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  pkg.version = `${major}.${minor}.${patch + 1}`;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.info(`Version bumped to ${pkg.version}`);
}

// 3. Build + zip (wxt reads the same env).
const build = spawnSync('pnpm', ['exec', 'wxt', 'zip'], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) fail('wxt zip failed (see output above).');
const zip = join(root, '.output', `historial-precios-mx-${pkg.version}-chrome.zip`);
if (!existsSync(zip)) fail(`Expected ${zip} after the build.`);

// 4. Optional: refresh a local unpacked copy (same folder → same data, just reload).
if (target) {
  if (existsSync(target)) {
    for (const entry of readdirSync(target))
      rmSync(join(target, entry), { recursive: true, force: true });
  } else {
    mkdirSync(target, { recursive: true });
  }
  cpSync(join(root, '.output', 'chrome-mv3'), target, { recursive: true });
}

// Chrome's extension ID: first 128 bits of SHA-256(public key), hex 0-f → a-p.
const id = createHash('sha256')
  .update(Buffer.from(key, 'base64'))
  .digest('hex')
  .slice(0, 32)
  .replace(/[0-9a-f]/g, (c) => String.fromCharCode(97 + Number.parseInt(c, 16)));

console.info(`
✔ Tester build ${pkg.version}
  Zip:          ${zip}
  API:          ${api.origin}
  Extension ID: ${id}${target ? `\n  Installed in: ${target}` : ''}

Next: ${target ? 'chrome://extensions → ↻ on "Historial de Precios MX".' : 'share the zip; testers unzip it over the same folder and click ↻ in chrome://extensions.'}
`);
