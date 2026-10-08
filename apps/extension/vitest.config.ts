import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// WxtVitest wires up @/ aliases, import.meta.env and an in-memory fake `browser`.
export default defineConfig({
  plugins: [WxtVitest()],
});
