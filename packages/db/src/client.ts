import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

/**
 * Neon over WebSockets (Pool) — supports interactive transactions, which the
 * ingest pipeline needs. Node >= 22 ships a global WebSocket, so no `ws` shim.
 *
 * Use the *pooled* Neon connection string (host contains `-pooler`) in
 * production, connecting as a least-privileged app role (see docs/security.md).
 */
export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString, max: 10 });
  const db = drizzle({ client: pool, schema, casing: 'snake_case' });
  return { db, close: () => pool.end() };
}

export type Database = ReturnType<typeof createDb>['db'];
