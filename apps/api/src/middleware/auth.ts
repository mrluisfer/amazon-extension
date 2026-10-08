import { apiTokens, users } from '@repo/db';
import { and, eq, isNull } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import { ApiError, unauthorized } from '../lib/errors';
import { hashToken, isWellFormedToken } from '../lib/tokens';
import type { AppEnv } from '../types';

const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!isWellFormedToken(token)) throw unauthorized();

  const { db } = c.var.deps;
  const [row] = await db
    .select({
      tokenId: apiTokens.id,
      userId: apiTokens.userId,
      lastUsedAt: apiTokens.lastUsedAt,
      email: users.email,
    })
    .from(apiTokens)
    .innerJoin(users, eq(users.id, apiTokens.userId))
    .where(and(eq(apiTokens.tokenHash, hashToken(token)), isNull(apiTokens.revokedAt)))
    .limit(1);
  if (!row) throw unauthorized();

  c.set('auth', { userId: row.userId, tokenId: row.tokenId, hasAccount: row.email !== null });

  // Throttled "last seen" bookkeeping: at most one write per token per hour.
  const now = new Date();
  if (!row.lastUsedAt || now.getTime() - row.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    Promise.all([
      db.update(apiTokens).set({ lastUsedAt: now }).where(eq(apiTokens.id, row.tokenId)),
      db.update(users).set({ lastSeenAt: now }).where(eq(users.id, row.userId)),
    ]).catch((err) => console.error('auth touch failed', err));
  }

  await next();
});

/** Features tied to a person (price alerts) need a registered account. Use after requireAuth. */
export const requireAccount = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.var.auth.hasAccount) {
    throw new ApiError(403, 'account_required', 'Sign in to use price alerts');
  }
  await next();
});
