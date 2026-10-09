---
name: db-migration
description: Change the Postgres (Neon) schema safely with Drizzle — edit schema, generate and review SQL, apply. Use for any new table, column, index or enum value.
---

# Database migration

1. Edit `packages/db/src/schema.ts` only. Columns are camelCase in TS; `casing: 'snake_case'` maps them.
2. Generate: `pnpm db:generate --name <short_snake_name>`. This needs no database.
3. **Review the SQL** in `packages/db/migrations/NNNN_<name>.sql` and flag to the user:
   - Locks on big tables (`price_observations`, `price_points`): adding a column with a volatile default, `ALTER TYPE`, non-concurrent index creation. Prefer nullable columns, and for large tables hand-write `CREATE INDEX CONCURRENTLY` in a separate migration.
   - Destructive ops (drop/rename) → require a two-step expand/contract rollout.
   - New enum values (`ALTER TYPE ... ADD VALUE`) can't run inside a transaction on older PG; check.
4. **Ask the user before** `pnpm db:migrate` against `production` — it targets the branch pinned in `.neon` (env injected by `scripts/neon-env-run.mjs`, unpooled URL). Test first on a throwaway branch: `neon branch create --name <x> --expires-at <iso>` then `DATABASE_URL_MIGRATIONS="$(neon connection-string <x>)" pnpm db:migrate` (shell env wins over the injected one).
5. Never edit a migration that is already committed (a hook blocks it). Fix forward with a new migration.
6. If the runtime role needs new grants, note it in `docs/security.md`.
