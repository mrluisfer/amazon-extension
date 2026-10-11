# Contributing

Thanks for helping! This guide covers setup, the workflow we follow and the rules every change
must respect. By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Amazon changed its layout and prices are missing?** That's the most valuable report. Use
  the _Amazon layout broke_ issue template and include the product URL (ASIN).
- **Bugs and ideas:** open an issue with the matching template. For larger features, open an
  issue first so we can agree on the approach before you write code.
- **Good first issues** are labelled [`good first issue`](https://github.com/mrluisfer/amazon-extension/labels/good%20first%20issue).
- **Docs, translations of docs and UI polish** are welcome too.

## Development setup

Requirements: Node 24 (`.nvmrc`; ≥ 22.22 works), pnpm 12 via `corepack enable`.

```bash
pnpm install   # installs deps and enables .githooks (pre-commit + commit-msg)
pnpm check     # lint + typecheck + tests, no database needed
```

Most work (parser, extension UI, website, shared code) needs **no database**. Unit tests and
HTML fixtures cover it.

### Full stack (API + database)

The API needs Postgres on [Neon](https://neon.com) (free tier is plenty). Use **your own** Neon
project; the maintainers' production project is private.

```bash
npm i -g neon && neon login
neon projects create --name historial-precios-dev
neon link --project-id <your-project-id> --no-env-pull -y   # writes .neon (git-ignored)
pnpm db:migrate
cp apps/api/.env.example apps/api/.env && pnpm dev:api
cp apps/extension/.env.example apps/extension/.env && pnpm dev:extension
```

Connection strings are injected at runtime by `scripts/neon-env-run.mjs` and are **never**
written to files. If `pnpm dev:api` fails with _"Bearer token … rejected"_, your Neon session
expired: run `neon login`, or export a non-expiring `NEON_API_KEY` in your shell profile.

**Schema changes go on a Neon branch** (copy-on-write, isolated from your main data):

```bash
neon checkout my-feature --create --no-env-pull
# edit packages/db/src/schema.ts
pnpm db:generate && pnpm db:migrate
neon diff                                   # review the schema change
```

### Editor

Open the repo in VS Code / Cursor and accept the recommended extensions
(`.vscode/extensions.json`): Biome formats on save and organizes imports, Tailwind
IntelliSense knows our tokens. Other editors: install Biome and respect `.editorconfig`.

## Workflow

1. Fork the repo (or create a branch if you have access): `feat/short-description`,
   `fix/…`, `docs/…`.
2. Make focused commits using [Conventional Commits](https://www.conventionalcommits.org/):
   `type(scope): summary` — e.g. `fix(parser): read the deal price on lightning offers`.
   - Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `style`, `revert`.
   - Scopes: `extension`, `api`, `web`, `parser`, `shared`, `db`, `brand`, `deps`, `dev`.
   - The `commit-msg` hook checks the format; CI checks the PR title.
3. Run `pnpm check` (and `pnpm build` if you touched build config or manifests).
4. Open a PR and fill in the template. PRs are **squash-merged**, so the PR title becomes the
   commit message.

## Rules every change must follow

These are non-negotiable and reviewers will block on them (full rationale in
[`docs/security.md`](docs/security.md)):

1. **Amazon's DOM is hostile input.** Validate everything that crosses content script →
   background → API with the schemas in `@repo/shared`. Never use `innerHTML` /
   `dangerouslySetInnerHTML` with page-derived data.
2. **Only the background service worker talks to the API** and reads the auth token. Other
   contexts use `sendMessage` from `apps/extension/src/lib/messaging.ts`.
3. **Least privilege.** New manifest or host permissions require a justification in
   `docs/security.md` (it goes into the Chrome Web Store listing).
4. **No secrets in the extension or website** — everything bundled is public.
5. **Consent first.** Nothing is queued or sent unless the user opted in.
6. **Privacy policy stays true.** If you change what data is collected, update
   `apps/web/app/routes/privacy.tsx` and `docs/security.md` in the same PR.
7. **Schema changes go through migrations.** Never edit an existing file in
   `packages/db/migrations/`.
8. **Prices are integer cents.** Client timestamps are untrusted.

## Code style

- TypeScript strict, ESM. **Biome** is the linter and formatter (single quotes, 2 spaces,
  100 columns): `pnpm format` fixes most issues. The pre-commit hook checks staged files.
- Code, comments, commits and docs in **English**. User-facing UI copy is **Spanish (es-MX)**,
  informal _tú_.
- UI uses the shared tokens, components and icons from `@repo/brand`
  (see [`docs/brand.md`](docs/brand.md)). No emoji in UI, no raw hex colors in components.
- Prefer explicit imports from `wxt/*` subpaths over WXT auto-imports.
- Comments explain _why_, not _what_. Match the style of the surrounding code.

## Tests

- Tests live in each package's `test/` folder and run with Vitest (`pnpm test`, or
  `pnpm --filter <package> test`).
- **Parser changes need a fixture**: save the relevant, sanitised HTML of a real product page
  under `packages/amazon-parser/test/fixtures/` and assert on it. Strip personal data
  (account names, addresses, session IDs) from fixtures.
- Bug fixes should come with a test that fails without the fix.

## Using AI coding agents

AI assistants are welcome. Instructions for them live in [`AGENTS.md`](AGENTS.md) (read by
Codex, Cursor, Copilot, Gemini CLI and others; Claude Code loads it through `CLAUDE.md`, plus
project skills and hooks in `.claude/`). You remain responsible for every line you submit:
review the output, run `pnpm check`, and don't paste secrets or private data into prompts.

## Reporting security issues

Do **not** open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
