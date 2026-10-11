# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Project skills in `.claude/skills/` (`add-api-endpoint`, `amazon-parser`, `db-migration`,
  `new-marketplace`, `neon*`), subagents in `.claude/agents/` (`security-reviewer`,
  `amazon-dom-researcher`), hooks in `.claude/hooks/` (Biome on edit, protected files), local
  plugins in `plugins/`. See `.claude/README.md`.
- Use the `security-reviewer` agent before finishing changes that touch messaging, the manifest,
  API routes, auth or data collection.

## Neon

- Linked via `.neon` (git-ignored); infra config in `neon.ts` (`neon config plan` → `neon deploy`).
- `scripts/neon-env-run.mjs` wraps `neon-env` (refreshes an expired OAuth session via `neon me`
  and retries) for `db:migrate`, `db:studio`, `dev:api`. Use `--no-env-pull` with
  `neon link` / `neon checkout`.
- Branch-first: `neon checkout <feature> --create --no-env-pull` before schema work; `neon diff`
  before committing.
