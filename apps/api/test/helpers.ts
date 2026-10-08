import type { Database } from '@repo/db';
import { createApp } from '../src/app';
import { MemoryRateLimiter } from '../src/lib/rate-limiter';
import { generateToken } from '../src/lib/tokens';

/**
 * Just enough of a db for requireAuth: resolves a valid, recently-used token.
 * Any other query throws, so tests prove a code path never reaches the DB.
 */
export function fakeAuthDb({ hasAccount }: { hasAccount: boolean }): Database {
  const row = {
    tokenId: 't1',
    userId: 'u1',
    lastUsedAt: new Date(),
    email: hasAccount ? 'a@b.co' : null,
  };
  const authQuery = {
    from: () => authQuery,
    innerJoin: () => authQuery,
    where: () => authQuery,
    limit: async () => [row],
  };
  return new Proxy({} as Database, {
    get(_t, prop) {
      if (prop === 'select') return () => authQuery;
      throw new Error(`unexpected db.${String(prop)} in test`);
    },
  });
}

export function makeTestApp(db: Database) {
  return createApp({
    db,
    limiters: {
      installs: new MemoryRateLimiter(10, 1),
      api: new MemoryRateLimiter(100, 1),
      ingest: new MemoryRateLimiter(100, 1),
    },
    config: { isProduction: false, allowedOrigins: [], trustProxy: false },
  });
}

export const authHeaders = () => ({
  authorization: `Bearer ${generateToken()}`,
  'content-type': 'application/json',
});
