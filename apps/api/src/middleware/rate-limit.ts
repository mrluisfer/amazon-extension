import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { ApiError } from '../lib/errors';
import type { Limiters } from '../lib/rate-limiter';
import type { AppEnv } from '../types';

export function clientIp(c: Context<AppEnv>): string {
  if (c.var.deps.config.trustProxy) {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export function rateLimit(
  name: keyof Limiters,
  key: (c: Context<AppEnv>) => string,
  cost: (c: Context<AppEnv>) => number = () => 1,
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const result = await c.var.deps.limiters[name].consume(`${name}:${key(c)}`, cost(c));
    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfterSec));
      throw new ApiError(429, 'rate_limited', 'Too many requests');
    }
    await next();
  });
}

export const byUser = (c: Context<AppEnv>) => c.var.auth.userId;
export const byIp = (c: Context<AppEnv>) => clientIp(c);
