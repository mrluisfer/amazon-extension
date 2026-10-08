import { createHash } from 'node:crypto';
import { sValidator } from '@hono/standard-validator';
import { HistoryQuerySchema, ProductParamsSchema } from '@repo/shared';
import { Hono } from 'hono';
import { validationHook } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { byUser, rateLimit } from '../middleware/rate-limit';
import { getHistory } from '../services/history';
import type { AppEnv } from '../types';

/**
 * Crowdsourced history changes at any moment (including from "empty" to
 * "has data"), so responses must never be served stale from the browser cache.
 * `no-cache` forces revalidation; the ETag lets unchanged data come back as a
 * bodyless 304. It hashes only the data (`generatedAt` changes every request).
 */
export const HISTORY_CACHE_CONTROL = 'private, no-cache';

export function historyEtag(data: unknown): string {
  return `W/"${createHash('sha1').update(JSON.stringify(data)).digest('base64url')}"`;
}

export const productsRoute = new Hono<AppEnv>().get(
  '/:marketplace/:asin/history',
  requireAuth,
  rateLimit('api', byUser),
  sValidator('param', ProductParamsSchema, validationHook),
  sValidator('query', HistoryQuerySchema, validationHook),
  async (c) => {
    const { marketplace, asin } = c.req.valid('param');
    const { days } = c.req.valid('query');
    const history = await getHistory(c.var.deps.db, marketplace, asin, days);

    const etag = historyEtag({ product: history.product, series: history.series });
    c.header('Cache-Control', HISTORY_CACHE_CONTROL);
    c.header('ETag', etag);
    if (c.req.header('if-none-match') === etag) return c.body(null, 304);
    return c.json(history);
  },
);
