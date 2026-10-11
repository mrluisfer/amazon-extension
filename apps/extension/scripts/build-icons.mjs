// Rasterizes the brand SVGs into the PNG icons WXT puts in the manifest
// (public/icon/<size>.png). Chrome requires PNG for extension/toolbar icons.
// Run after editing packages/brand/assets/*.svg:  pnpm --filter @repo/extension icons
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const root = new URL('..', import.meta.url);
const source = (name) => readFileSync(new URL(`../../packages/brand/assets/${name}`, root), 'utf8');
const outDir = new URL('public/icon/', root);
mkdirSync(outDir, { recursive: true });

// 16px gets the simplified mark; the detailed one turns to mush that small.
const targets = [
  [16, 'icon-16.svg'],
  [32, 'icon.svg'],
  [48, 'icon.svg'],
  [128, 'icon.svg'],
];

for (const [size, file] of targets) {
  const png = new Resvg(source(file), { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(new URL(`${size}.png`, outDir), png);
  console.info(`public/icon/${size}.png ← ${file}`);
}
