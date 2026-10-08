import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  // Workspace packages ship TypeScript source, so they must be bundled in.
  deps: { alwaysBundle: [/^@repo\//] },
});
