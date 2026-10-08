import { defineConfig } from 'drizzle-kit';

// Migrations run with an owner/migrator role (DATABASE_URL_MIGRATIONS), never
// with the runtime app role. `generate` does not need a database at all.
const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL ?? '';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  casing: 'snake_case',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
