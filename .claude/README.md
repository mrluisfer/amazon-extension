# Claude Code setup

| Path | What goes there |
|---|---|
| `../CLAUDE.md` | Project memory loaded every session: layout, commands, hard rules. Keep it short. |
| `settings.json` | Shared permissions + hooks (committed). Personal overrides → `settings.local.json` (git-ignored). |
| `hooks/` | Scripts run by hooks. `protect-files.mjs` blocks edits to secrets/lockfile/migrations; `format.mjs` runs Biome after each edit. |
| `skills/<name>/SKILL.md` | Repeatable workflows Claude loads on demand (invoke with `/<name>` or automatically by description). |
| `agents/<name>.md` | Subagents with their own prompt/tools (e.g. `security-reviewer`). |
| `../.mcp.json` | Project-scoped MCP servers (shared with the team). |
| `../plugins/` | Local plugins (bundles of skills/agents/hooks/MCP) — see `plugins/README.md`. |

## Current skills

- `add-api-endpoint` — schema → route → client → message → tests, with the security checklist.
- `amazon-parser` — fix a broken selector / add a real-page fixture.
- `db-migration` — schema change → generated SQL review → migrate.
- `new-marketplace` — add another Amazon country (e.g. amazon.com).

## Current agents

- `security-reviewer` — reviews a diff against `docs/security.md`.
- `amazon-dom-researcher` — inspects live Amazon pages (via Claude in Chrome) to propose selector updates.
