import { MARKETPLACES } from '@repo/shared';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'wxt';

const amazonMatches = Object.values(MARKETPLACES).map((m) => `${m.origin}/*`);

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'WXT_');
    const apiUrl = new URL(env.WXT_API_URL || 'http://localhost:8787');
    const apiOrigin = apiUrl.origin;
    const isProd = mode === 'production';
    if (isProd && apiUrl.protocol !== 'https:' && apiUrl.hostname !== 'localhost') {
      throw new Error(`WXT_API_URL must use https in production builds (got ${apiOrigin})`);
    }
    const frameAncestors = Object.values(MARKETPLACES).map((m) => m.origin);
    // Pins the extension ID for unpacked/zip builds (otherwise Chrome derives it from the
    // folder path). Public key, not a secret: see scripts/manifest-key.mjs. Leave it unset
    // for store uploads — the store assigns the ID.
    const manifestKey = env.WXT_MANIFEST_KEY?.trim();

    return {
      name: 'Historial de Precios MX',
      ...(manifestKey && { key: manifestKey }),
      description:
        'Historial de precios y alertas para Amazon México, construido por la comunidad.',
      // Least privilege: no tabs, no <all_urls>, no scripting. Each permission must be justified
      // in the Chrome Web Store listing.
      permissions: ['storage', 'alarms'],
      host_permissions: [...amazonMatches, `${apiOrigin}/*`],
      web_accessible_resources: [
        {
          // Only the panel page is embeddable, and only on Amazon.
          resources: ['panel.html'],
          matches: amazonMatches,
        },
      ],
      // Production only: `wxt dev` injects its own CSP for the HMR dev server.
      ...(isProd && {
        content_security_policy: {
          extension_pages: [
            "script-src 'self'",
            "object-src 'self'",
            `connect-src 'self' ${apiOrigin}`,
            `frame-ancestors 'self' ${frameAncestors.join(' ')}`,
          ].join('; '),
        },
      }),
    };
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  // `wxt dev` launches Chrome via web-ext. A persistent profile (git-ignored, under
  // .wxt/) keeps Amazon captchas/cookies and extension storage between runs.
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    startUrls: [`${MARKETPLACES.mx.origin}/`],
  },
});
