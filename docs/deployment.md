# Deployment

Three independent pieces: the **API** (Render), the **website** (Vercel) and the
**extension** (browser stores). All of them build from the monorepo root.

## API → Render (web service)

Create a **Web Service** from the GitHub repo with these settings:

| Setting | Value |
|---|---|
| Root directory | _(empty — repo root, the API needs the workspace packages)_ |
| Region | **Ohio (US East)** — same region as the Neon database (`aws-us-east-2`) |
| Runtime | Node |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @repo/api build` |
| Start command | `pnpm --filter @repo/api start` |
| Health check path | `/health` |
| Auto-deploy | On commit to `main` (optionally "after CI checks pass") |

Environment variables (Render → Environment). Render sets `PORT` itself.

| Variable | Value |
|---|---|
| `NODE_VERSION` | `24` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`) for the least-privileged `app_runtime` role — see [`security.md`](security.md#database-roles-neon). Never the owner role. |
| `ALLOWED_ORIGINS` | `chrome-extension://<extension-id>` (comma-separated; add `moz-extension://…` / Edge IDs as needed). Required in production. |
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

## Extension → Chrome Web Store (and Edge / Firefox)

1. Build against the production API:
   `WXT_API_URL=https://<your-api>.onrender.com pnpm --filter @repo/extension zip`
   (production builds refuse a non-HTTPS API URL). Firefox: `pnpm --filter @repo/extension zip -b firefox`.
2. Upload the zip from `apps/extension/.output/`. The store assigns the extension ID: add
   `chrome-extension://<id>` to the API's `ALLOWED_ORIGINS`.
3. Listing: privacy policy URL (`https://<website>/privacidad`), the permission justifications
   from [`security.md`](security.md#manifest-permissions-keep-in-sync-with-the-store-listing), the
   non-affiliation notice ([`brand.md`](brand.md)), and screenshots of the panel.
4. Chrome Web Store charges a one-time USD 5 developer registration; Edge Add-ons and Firefox
   AMO are free.

Before the first public release, check the launch items in
[`security.md` → Known gaps](security.md#known-gaps--todo) (e.g. the observation retention job
promised by the privacy policy).
