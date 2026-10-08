# CLAUDE.md

Crowdsourced Amazon price-history extension (Keepa-style), starting with **amazon.com.mx**.

## Layout

```
apps/extension      WXT + React 19 (MV3). Content script → background → API.
apps/api            Hono on Node. Anonymous bearer-token auth, crowdsourced ingest.
packages/shared     Valibot wire schemas, marketplaces, history codec, money formatting.
packages/amazon-parser  Pure DOM parser for Amazon product pages (+ fixtures).
packages/db         Drizzle schema/client for Neon Postgres, migrations in ./migrations.
docs/               architecture.md, security.md — read before structural changes.
```

## Commands

- `pnpm check` — lint + typecheck + tests (run before declaring work done)
- `pnpm dev:api` / `pnpm dev:extension` — local dev (extension loads in a fresh Chrome profile)
- `pnpm db:generate` — create a migration from `packages/db/src/schema.ts` (no DB needed)
- `pnpm db:migrate` — apply migrations to the Neon branch pinned in `.neon` (**ask before running against `production`**)
- Single package: `pnpm --filter @repo/api test`

## Neon

- Project `lingering-wildflower-57049207`, default branch `production`. Linked via `.neon` (git-ignored); infra config in `neon.ts` (`neon config plan` → `neon deploy`).
- DB env is injected at runtime by `scripts/neon-env-run.mjs` (wraps `neon-env`; refreshes an expired OAuth session via `neon me` and retries) — used by `db:migrate`, `db:studio`, `dev:api`. Don't copy connection strings into files. Use `--no-env-pull` with `neon link`/`neon checkout`.
- Branch-first: `neon checkout <feature> --create --no-env-pull` before schema work; `neon diff` before committing. Neon skills live in `.claude/skills/neon*`.

## Non-negotiable rules

1. **Trust boundaries.** Amazon's DOM is hostile input. Everything crossing content script → background → API is validated with schemas from `@repo/shared`. Never `innerHTML`/`dangerouslySetInnerHTML` page-derived data.
2. **Only the background talks to the API** and only it reads the auth token. Content scripts and the panel use `sendMessage` (`apps/extension/src/lib/messaging.ts`), which enforces sender allow-lists.
3. **Least privilege.** Don't add manifest permissions or host permissions without updating `docs/security.md` with the justification (it goes into the Chrome Web Store listing).
4. **No secrets in the extension.** Anything bundled is public.
5. **Consent first.** No observation is queued or sent unless `consentItem === 'granted'`.
6. **Schema changes go through migrations.** Never edit an existing file in `packages/db/migrations/`.
7. Prices are **integer cents** everywhere. Timestamps from clients are untrusted (server clamps them).

## Conventions

- TypeScript strict, ESM, Biome (single quotes, 100 cols). Workspace packages export TS source directly.
- Prefer explicit imports from `wxt/*` subpaths over auto-imports.
- Tests live next to each package in `test/`. Parser changes need a fixture (see `.claude/skills/amazon-parser`).
- UI copy is Spanish (es-MX); code, comments and commits in English.

## Claude tooling

Project skills in `.claude/skills/`, subagents in `.claude/agents/`, hooks in `.claude/hooks/`, local plugins in `plugins/`. See `.claude/README.md`.
