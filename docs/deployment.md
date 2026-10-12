# Deployment

Three independent pieces: the **API** (Render), the **website** (Vercel) and the
**extension** (browser stores). All of them build from the monorepo root.

## API → Render (web service)

Create a **Web Service** from the GitHub repo with these settings:

| Setting | Value |
|---|---|
| Root directory | _(empty — repo root, the API needs the workspace packages)_ |
| Build filters → included paths | `apps/api/**`, `packages/shared/**`, `packages/db/**`, `package.json`, `pnpm-lock.yaml` (so website/extension changes don't redeploy the API) |
| Region | **Ohio (US East)** — same region as the Neon database (`aws-us-east-2`) |
| Runtime | Node |
| Build command | `corepack pnpm install --frozen-lockfile && corepack pnpm --filter @repo/api build` |
| Start command | `NODE_ENV=production node apps/api/dist/index.mjs` |
| Health check path | `/health` |
| Auto-deploy | On commit to `main` (optionally "after CI checks pass") |

Environment variables (Render → Environment). Render sets `PORT` itself.

> [!IMPORTANT]
> Don't add `NODE_ENV` here: with `NODE_ENV=production` at build time, `pnpm install` skips
> devDependencies and the build fails (`tsdown` is one). It's set in the start command instead.

Why these commands: Render's `/usr/bin` is read-only, so `corepack enable` fails with
`EROFS … unlink '/usr/bin/pnpm'`; `corepack pnpm …` runs the pnpm version pinned in
`packageManager` without installing shims. The start command runs Node directly — no package
manager at runtime, faster cold starts (all runtime imports are direct dependencies of
`@repo/api`; workspace packages are bundled into `dist/`).

| Variable | Value |
|---|---|
| `NODE_VERSION` | `24` |
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`) for the least-privileged `app_runtime` role — see [`security.md`](security.md#database-roles-neon). Never the owner role. |
| `ALLOWED_ORIGINS` | Optional. Origins allowed to read responses via CORS, comma-separated. The extension doesn't need it: its background calls the API with host permissions, which bypass CORS. Leave it empty unless a web page must call the API. |
| `TRUST_PROXY` | `true` — Render's proxy sets `X-Forwarded-For`, which the per-IP rate limits rely on. |

Notes:

- **Free instances sleep after 15 minutes** without traffic and take about a minute to wake
  up; the first panel load after a pause will be slow. Fine for a beta; a paid instance (or
  another host) removes it.
- The in-memory rate limiter is per instance: keep **one instance** until it moves to a shared
  store (see `architecture.md` → Scaling path).
- Apply migrations before deploying a version that needs them, from your machine with the
  production branch linked: `pnpm db:migrate` (maintainers only).

## Website → Vercel

Import the repo in Vercel and set:

| Setting | Value |
|---|---|
| Root directory | `apps/web` (keep "Include files outside the root directory" enabled) |
| Framework preset | Other — `apps/web/vercel.json` defines build, output and headers |
| Node.js version | 24.x |

Environment variables:

| Variable | Value |
|---|---|
| `VITE_CONTACT_EMAIL` | Public contact for the privacy policy. **Production builds fail without it.** |
| `VITE_CHROME_STORE_URL` | Store listing URL; leave empty until published (CTAs show "Próximamente"). |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` — only if the install step picks the wrong pnpm version. |

The site is fully static (every route prerendered), so previews and production cost nothing
beyond the free tier.

## Extension → testers (zip)

Pin the extension ID so it doesn't depend on the folder each tester unzips into (otherwise
their data resets whenever the path changes):

One-time setup:

```bash
# Creates the private key OUTSIDE the repo and prints the public key + extension ID.
pnpm --filter @repo/extension manifest-key -- ~/.config/historial-precios-mx/extension-key.pem
```

- Put the printed `WXT_MANIFEST_KEY=…` in `apps/extension/.env`.
- Put `WXT_API_URL=https://<your-api>.onrender.com` in `apps/extension/.env.production`
  (both git-ignored; `.env.production` only applies to production builds, so `pnpm dev:extension`
  keeps using the local API).
- Back up the `.pem` (password manager): losing it changes the ID for future builds.

Every release:

```bash
pnpm release:testers --bump --install ~/Extensions/historial-precios-mx
```

It refuses to build against `localhost`/non-https or without the key, bumps the patch
version (`--bump`, optional), writes `apps/extension/.output/historial-precios-mx-<version>-chrome.zip`
and, with `--install` (or `EXTENSION_INSTALL_DIR`), refreshes your own unpacked copy — then
click ↻ in `chrome://extensions`. Commit the version bump.

Testers unzip into a folder once and use *Load unpacked*; each update = unzip over the same
folder + ↻ (same folder → same ID and data).

## Extension → Chrome Web Store (and Edge / Firefox)

1. Build against the production API:
   `WXT_API_URL=https://<your-api>.onrender.com pnpm --filter @repo/extension zip:store`
   (`zip:store` always omits the manifest `key`, even if `WXT_MANIFEST_KEY` is in your `.env`)
   (production builds refuse a non-HTTPS API URL). Firefox: `pnpm --filter @repo/extension zip -b firefox`.
2. Upload the zip from `apps/extension/.output/`. The store assigns the extension ID.
3. Listing: privacy policy URL (`https://<website>/privacidad`), the permission justifications
   from [`security.md`](security.md#manifest-permissions-keep-in-sync-with-the-store-listing), the
   non-affiliation notice ([`brand.md`](brand.md)), and screenshots of the panel.
4. Chrome Web Store charges a one-time USD 5 developer registration; Edge Add-ons and Firefox
   AMO are free.

Before the first public release, check the launch items in
[`security.md` → Known gaps](security.md#known-gaps--todo).
