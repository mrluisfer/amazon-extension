/**
 * Applies pending migrations from ./migrations using drizzle-orm's migrator.
 * Used instead of `drizzle-kit migrate`, which swallows errors with the Neon
 * serverless driver. Run via `pnpm db:migrate` (env injected by `neon-env run`).
 */
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

const url =
  process.env.DATABASE_URL_MIGRATIONS ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL;

if (!url) {
  console.error(
    'No database URL. Run through `pnpm db:migrate` (neon-env) or set DATABASE_URL_MIGRATIONS.',
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const target = new URL(url);
console.info(`Migrating ${target.hostname}${target.pathname} as ${target.username}…`);

try {
  await migrate(drizzle({ client: pool }), {
    migrationsFolder: new URL('../migrations', import.meta.url).pathname,
  });
  console.info('Migrations applied.');
} catch (err) {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
