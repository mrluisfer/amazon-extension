# AGENTS.md

Instructions for AI coding agents working in this repository (Codex, Cursor, Copilot,
Gemini CLI, Claude Code, …). Humans: see [README.md](README.md) and
[CONTRIBUTING.md](CONTRIBUTING.md) — this file follows the same rules.

## Project

Crowdsourced Amazon price-history browser extension (Keepa-style) for **amazon.com.mx**:
a price chart panel on product pages, sponsored-content hiding, opt-in anonymous price
sharing. pnpm + Turborepo monorepo, TypeScript strict, ESM.

```
apps/extension          WXT + React 19 (MV3). Content script → background → API.
apps/api                Hono on Node. Anonymous bearer-token auth, crowdsourced ingest.
apps/web                Public website (landing, privacy, terms): React Router, prerendered static → Vercel.
packages/amazon-parser  Pure DOM parser for Amazon product pages (+ HTML fixtures).
packages/shared         Valibot wire schemas, marketplaces, history codec, money formatting.
packages/db             Drizzle schema/client for Neon Postgres, SQL migrations in ./migrations.
packages/brand          Logo, icons, Tailwind theme (tokens + btn/card/input/switch) for extension and web.
docs/                   architecture.md, security.md (read before structural changes), brand.md (UI), deployment.md.
```

Workspace packages export TypeScript source directly (no build step for `packages/*`).

## Commands

- `pnpm check` — lint + typecheck + tests. **Run it before declaring any task done.**
- `pnpm format` — Biome format + safe fixes.
- `pnpm --filter <pkg> test` — one package, e.g. `pnpm --filter @repo/amazon-parser test`.
- `pnpm build` — build everything (run when touching build config, manifests or routes).
- `pnpm dev:api` / `pnpm dev:extension` / `pnpm --filter @repo/web dev` — local dev.
- `pnpm db:generate` — create a migration from `packages/db/src/schema.ts` (no DB needed).
- `pnpm db:migrate` — applies migrations to the Neon branch linked in `.neon`. **Ask the human
  before running it**, and never against a production branch without explicit approval.

The API needs a Neon database: connection strings are injected at runtime by
`scripts/neon-env-run.mjs` (`neon-env`). Never write connection strings or secrets into files.
Everything else (parser, extension UI, website, shared) is testable without a database.

## Non-negotiable rules

1. **Trust boundaries.** Amazon's DOM is hostile input. Everything crossing content script →
   background → API is validated with schemas from `@repo/shared`. Never use `innerHTML` /
   `dangerouslySetInnerHTML` with page-derived data (`noDangerouslySetInnerHtml` is a lint error).
2. **Only the background talks to the API** and only it reads the auth token. Content scripts
   and extension pages use `sendMessage` (`apps/extension/src/lib/messaging.ts`), which enforces
   sender allow-lists.
3. **Least privilege.** Don't add manifest permissions or host permissions without adding the
   justification to `docs/security.md` (it goes into the Chrome Web Store listing).
4. **No secrets in the extension or website.** Anything bundled is public. Don't read `.env`
   files; use `.env.example` for documentation.
5. **Consent first.** No observation is queued or sent unless `consentItem === 'granted'`.
6. **Privacy policy stays true.** Any change to collected data updates
   `apps/web/app/routes/privacy.tsx` and `docs/security.md` in the same change.
7. **Schema changes go through migrations.** Never edit an existing file in
   `packages/db/migrations/`; generate a new one.
8. Prices are **integer cents** everywhere. Client timestamps are untrusted (the server clamps them).

## Conventions

- Biome is the linter/formatter: single quotes, 2 spaces, 100 columns. Don't add ESLint/Prettier.
- Code, comments, commits and docs in **English**; user-facing UI copy in **Spanish (es-MX)**, _tú_.
- UI: tokens, `btn`/`card`/`input`/`switch` utilities, `Logo` and icons from `@repo/brand`
  (`docs/brand.md`). No emoji in UI; no raw hex outside `packages/brand` and the chart palettes.
- Prefer explicit imports from `wxt/*` subpaths over WXT auto-imports.
- Tests live in each package's `test/` directory (Vitest). Parser changes need a sanitised HTML
  fixture in `packages/amazon-parser/test/fixtures/`. Bug fixes come with a regression test.
- Match the surrounding code: naming, comment density (explain _why_), idioms. Keep changes
  focused; don't reformat or refactor unrelated code.
- New dependencies: prefer none. If needed, keep them small and explain why (supply-chain risk;
  pnpm enforces a 24h `minimumReleaseAge`).

## Git

- Conventional Commits: `type(scope): summary` (types: feat, fix, docs, refactor, perf, test,
  build, ci, chore, style, revert; scopes: extension, api, web, parser, shared, db, brand, deps, dev).
  The `commit-msg` hook enforces it.
- Don't commit, push or open PRs unless asked. Never bypass hooks (`--no-verify`) to hide a failure.

## Before you finish

1. `pnpm check` passes (and `pnpm build` if relevant).
2. Rules above respected; docs updated if behavior, permissions or data collection changed.
3. Summarize what changed and anything you could not verify.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
