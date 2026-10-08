import { apiTokens, trackedProducts, users } from '@repo/db';
import { count, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { byUser, rateLimit } from '../middleware/rate-limit';
import type { AppEnv } from '../types';

export const meRoute = new Hono<AppEnv>()
  .use(requireAuth, rateLimit('api', byUser))
  .get('/', async (c) => {
    const { db } = c.var.deps;
    const [row] = await db
      .select({ tracked: count() })
      .from(trackedProducts)
      .where(eq(trackedProducts.userId, c.var.auth.userId));
    return c.json({ userId: c.var.auth.userId, trackedCount: row?.tracked ?? 0 });
  })
  /** Revokes only the calling token (e.g. on uninstall/sign-out). */
  .post('/logout', async (c) => {
    await c.var.deps.db
      .update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(eq(apiTokens.id, c.var.auth.tokenId));
    return c.body(null, 204);
  })
  /**
   * Right to erasure (LFPDPPP "cancelación" / GDPR art. 17). Cascades to tokens
   * and watchlist; past observations are kept anonymised (user_id → NULL).
   */
  .delete('/', async (c) => {
    await c.var.deps.db.delete(users).where(eq(users.id, c.var.auth.userId));
    return c.body(null, 204);
  });
