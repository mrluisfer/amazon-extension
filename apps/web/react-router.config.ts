import type { Config } from '@react-router/dev/config';

// Fully static site: every route is prerendered to HTML at build time
// (build/client), so it can be served from any static host/CDN (Vercel).
export default {
  ssr: false,
  prerender: true,
} satisfies Config;
