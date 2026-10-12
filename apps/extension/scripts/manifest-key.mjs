// Creates (or reads) the RSA key that pins the extension ID for unpacked/zip builds,
// and prints the public key for WXT_MANIFEST_KEY plus the resulting extension ID.
//
//   pnpm --filter @repo/extension manifest-key -- <path/to/key.pem>
//
// Keep the .pem OUTSIDE the repo (e.g. ~/.config/historial-precios-mx/) and back it up:
// it's the identity of the extension. The public key printed here is not secret.
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const file = process.argv.slice(2).find((a) => a !== '--');
if (!file) {
  console.error('Usage: pnpm --filter @repo/extension manifest-key -- <path/to/key.pem>');
  process.exit(1);
}
const path = resolve(file);
if (path.startsWith(resolve(import.meta.dirname, '../../..'))) {
  console.error('Refusing to write the private key inside the repository. Pick a path outside it.');
  process.exit(1);
}

if (!existsSync(path)) {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  console.info(`Created ${path}`);
}

const der = createPublicKey(createPrivateKey(readFileSync(path))).export({
  type: 'spki',
  format: 'der',
});
// Chrome's extension ID: first 128 bits of SHA-256(public key), hex digits mapped 0-f → a-p.
const id = createHash('sha256')
  .update(der)
  .digest('hex')
  .slice(0, 32)
  .replace(/[0-9a-f]/g, (c) => String.fromCharCode(97 + Number.parseInt(c, 16)));

console.info(`\nAdd to apps/extension/.env:\nWXT_MANIFEST_KEY=${der.toString('base64')}\n`);
console.info(`Extension ID: ${id}\nOrigin:       chrome-extension://${id}`);
