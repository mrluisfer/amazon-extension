import { apiTokens, users } from '@repo/db';
import { Hono } from 'hono';
import { generateToken, hashToken } from '../lib/tokens';
import { byIp, rateLimit } from '../middleware/rate-limit';
import type { AppEnv } from '../types';

/**
 * Anonymous registration: each extension install gets an opaque bearer token
 * bound to a fresh user. No PII is collected. The raw token is returned once
 * and only its hash is stored.
 */
export const installsRoute = new Hono<AppEnv>().post(
  '/',
  rateLimit('installs', byIp),
  async (c) => {
    const { db } = c.var.deps;
    const token = generateToken();

    await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({}).returning({ id: users.id });
      if (!user) throw new Error('user insert returned no row');
      await tx
        .insert(apiTokens)
        .values({ userId: user.id, tokenHash: hashToken(token), label: 'extension' });
    });

    return c.json({ token }, 201);
  },
);
