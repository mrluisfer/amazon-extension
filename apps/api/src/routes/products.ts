import { sValidator } from '@hono/standard-validator';
import { HistoryQuerySchema, ProductParamsSchema } from '@repo/shared';
import { Hono } from 'hono';
import { validationHook } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { byUser, rateLimit } from '../middleware/rate-limit';
import { getHistory } from '../services/history';
import type { AppEnv } from '../types';

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
    // Data is identical for every user; private only because the request is authenticated.
    c.header('Cache-Control', 'private, max-age=300');
    return c.json(history);
  },
);
