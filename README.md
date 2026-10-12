<div align="center">

<img src="packages/brand/assets/icon.svg" width="72" height="72" alt="" />

# Historial de Precios MX

**Community-built price history for Amazon México — right on the product page.**

[![CI](https://github.com/mrluisfer/amazon-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/mrluisfer/amazon-extension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

A free, open-source browser extension (Chrome, Edge, Firefox) that shows a Keepa-style price
history chart on every `amazon.com.mx` product page, hides sponsored results, and puts privacy
first. The history is crowdsourced: users can opt in to anonymously share the prices they see.

> [!NOTE]
> Independent community project. Not affiliated with, sponsored or endorsed by Amazon.

## Features

- **Price history panel** under the product details: Amazon, buy box, used and list price
  series, range selector, drag-to-zoom, min/max of the visible range.
- **Hide sponsored content** on search and product pages (processed locally, nothing is sent).
- **Privacy by design:** anonymous install token, no accounts, no browsing history, explicit
  opt-in before any price is shared. See the [privacy policy](apps/web/app/routes/privacy.tsx).
- **Light / dark / system theme** for the panel and extension pages.
- **Price alerts** — _in progress_ (needs optional sign-in).

## How it works

```
amazon.com.mx product page
  └─ content script ── parses the DOM (packages/amazon-parser), validated with Valibot
       │  sendMessage (sender allow-lists)
       ▼
  background service worker ── the only API client; holds the token, batches observations
       │  HTTPS + bearer token
       ▼
  API (Hono) ── rate limits, anti-poisoning, change-only price history
       ▼
  Postgres (Neon, Drizzle)
```

The panel is an iframe on the extension origin, fully isolated from Amazon's CSS/JS.
Details and design decisions: [`docs/architecture.md`](docs/architecture.md).

## Repository layout

| Path | What |
|---|---|
| `apps/extension` | WXT + React 19 (MV3) extension: content scripts, background, panel, popup, options |
| `apps/api` | Hono API on Node: anonymous auth, crowdsourced ingest, history |
| `apps/web` | Public website (landing, privacy, terms): React Router, prerendered to static HTML |
| `packages/amazon-parser` | Pure DOM parser for Amazon product pages + HTML fixtures |
| `packages/shared` | Valibot wire schemas, marketplaces, history codec, money formatting |
| `packages/db` | Drizzle schema, client and SQL migrations |
| `packages/brand` | Logo, icons and the Tailwind theme shared by the extension and the website |
| `docs/` | Architecture, security, brand and deployment guides |

**Stack:** pnpm + Turborepo · TypeScript · WXT · React 19 · Tailwind CSS v4 · uPlot · Hono ·
Drizzle + Neon Postgres · Valibot · Biome · Vitest.

## Quick start

**Requirements:** Node 24 (see `.nvmrc`; ≥ 22.22 works), pnpm 12 (`corepack enable`), and a
free [Neon](https://neon.com) account for the API database.

```bash
git clone https://github.com/mrluisfer/amazon-extension.git
cd amazon-extension
pnpm install          # also enables the repo's git hooks
pnpm check            # lint + typecheck + tests — no database needed
```

### Work on the extension, parser or website only

No database required: parser and extension logic are covered by unit tests and fixtures.

```bash
pnpm --filter @repo/web dev          # website at http://localhost:5173
pnpm --filter @repo/amazon-parser test
```

### Run the full stack (extension + API + database)

```bash
# 1. Create your own Neon project (free) and link it. Secrets are injected at runtime,
#    never written to disk.
npm i -g neon && neon login
neon projects create --name historial-precios-dev
neon link --project-id <your-project-id> --no-env-pull -y

# 2. Database schema
pnpm db:migrate

# 3. API → http://localhost:8787/health
cp apps/api/.env.example apps/api/.env
pnpm dev:api

# 4. Extension → opens a dedicated Chrome profile with the extension loaded
cp apps/extension/.env.example apps/extension/.env
pnpm dev:extension
```

Open any product at `https://www.amazon.com.mx/dp/…` — the panel appears below the product
details. More setup notes (expired Neon sessions, database branches) are in
[CONTRIBUTING.md](CONTRIBUTING.md#development-setup).

## Scripts

| Command | What it does |
|---|---|
| `pnpm check` | Lint + typecheck + tests. Run before every PR. |
| `pnpm format` | Format and auto-fix with Biome |
| `pnpm build` | Build API (`apps/api/dist`), extension (`apps/extension/.output`) and website (`apps/web/build`) |
| `pnpm dev:api` / `pnpm dev:extension` | Local development |
| `pnpm release:testers [--bump] [--install <dir>]` | Validated tester zip (+ refresh your unpacked copy) — see [deployment](docs/deployment.md#extension--testers-zip) |
| `pnpm --filter @repo/extension zip:store` | Store-ready `.zip` (no manifest key) |
| `pnpm db:generate` | Create a migration from `packages/db/src/schema.ts` |
| `pnpm db:migrate` / `pnpm db:studio` | Apply migrations / open Drizzle Studio |

## Documentation

- [Architecture](docs/architecture.md) — data flow, decisions, scaling path
- [Security & privacy](docs/security.md) — threat model, permissions, data collected
- [Brand & UI](docs/brand.md) — logo, tokens, components, trademark rules
- [Deployment](docs/deployment.md) — website (Vercel), API (Render), Chrome Web Store
- [AGENTS.md](AGENTS.md) — instructions for AI coding agents (also loaded by Claude Code via `CLAUDE.md`)

## Contributing

Contributions are welcome — bug reports, Amazon layout fixes, features and docs. Read
[CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) first. Found
a vulnerability? Please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

[MIT](LICENSE) © mrluisfer and contributors. Amazon is a trademark of Amazon.com, Inc. or its
affiliates; this project is not affiliated with Amazon.
