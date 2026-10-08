import { sValidator } from '@hono/standard-validator';
import { ObservationBatchSchema } from '@repo/shared';
import { Hono } from 'hono';
import { validationHook } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { byUser, rateLimit } from '../middleware/rate-limit';
import { ingestBatch } from '../services/ingest';
import type { AppEnv } from '../types';

export const observationsRoute = new Hono<AppEnv>().post(
  '/',
  requireAuth,
  rateLimit('ingest', byUser),
  sValidator('json', ObservationBatchSchema, validationHook),
  async (c) => {
    const { observations } = c.req.valid('json');
    const summary = await ingestBatch(c.var.deps.db, c.var.auth.userId, observations);
    return c.json({ summary }, 202);
  },
);
