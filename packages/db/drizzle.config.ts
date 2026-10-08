import { defineConfig } from 'drizzle-kit';

// `pnpm db:migrate` runs through `neon-env run`, which injects the linked Neon
// branch's env (see .neon / `neon checkout`). Migrations use the direct
// (unpooled) connection. DATABASE_URL_MIGRATIONS is an explicit override, e.g. a
// dedicated migrator role in CI. `generate` does not need a database at all.
const url =
  process.env.DATABASE_URL_MIGRATIONS ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  '';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  casing: 'snake_case',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
