import { sValidator } from '@hono/standard-validator';
import { type Database, products, trackedProducts } from '@repo/db';
import {
  ProductParamsSchema,
  type TrackedProduct,
  type TrackingStatus,
  TrackProductSchema,
  UpdateTrackedSchema,
  UuidParamSchema,
} from '@repo/shared';
import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { Hono } from 'hono';
import { ApiError, notFound, validationHook } from '../lib/errors';
import { requireAccount, requireAuth } from '../middleware/auth';
import { byUser, rateLimit } from '../middleware/rate-limit';
import type { AppEnv } from '../types';

export const MAX_TRACKED_PER_USER = 500;

async function selectTracked(db: Database, where: SQL | undefined, limit: number) {
  const rows = await db
    .select({
      id: trackedProducts.id,
      marketplace: products.marketplace,
      asin: products.asin,
      title: products.title,
      imageUrl: products.imageUrl,
      targetPriceCents: trackedProducts.targetPriceCents,
      createdAt: trackedProducts.createdAt,
    })
    .from(trackedProducts)
    .innerJoin(products, eq(products.id, trackedProducts.productId))
    .where(where)
    .orderBy(desc(trackedProducts.createdAt))
    .limit(limit);
  return rows.map((r): TrackedProduct => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/**
 * Price alerts ("avísame si baja de…"). One alert per user and product: the
 * unique (user_id, product_id) constraint is the source of truth, creating a
 * second one returns 409 and changing the target is an explicit PATCH.
 */
export const trackedRoute = new Hono<AppEnv>()
  .use(requireAuth, rateLimit('api', byUser))
  /** Panel bootstrap: account status + this product's alert, in one request. Works without account. */
  .get(
    '/by-product/:marketplace/:asin',
    sValidator('param', ProductParamsSchema, validationHook),
    async (c) => {
      const { marketplace, asin } = c.req.valid('param');
      const { userId, hasAccount } = c.var.auth;
      const [item] = hasAccount
        ? await selectTracked(
            c.var.deps.db,
            and(
              eq(trackedProducts.userId, userId),
              eq(products.marketplace, marketplace),
              eq(products.asin, asin),
            ),
            1,
          )
        : [];
      const status: TrackingStatus = { hasAccount, item: item ?? null };
      c.header('Cache-Control', 'private, no-store');
      return c.json(status);
    },
  )
  .use(requireAccount)
  .get('/', async (c) => {
    const items = await selectTracked(
      c.var.deps.db,
      eq(trackedProducts.userId, c.var.auth.userId),
      MAX_TRACKED_PER_USER,
    );
    return c.json({ items });
  })
  .post('/', sValidator('json', TrackProductSchema, validationHook), async (c) => {
    const { marketplace, asin, targetPriceCents } = c.req.valid('json');
    const { db } = c.var.deps;
    const { userId } = c.var.auth;

    const id = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ n: count() })
        .from(trackedProducts)
        .where(eq(trackedProducts.userId, userId));
      if ((current?.n ?? 0) >= MAX_TRACKED_PER_USER) {
        throw new ApiError(
          409,
          'limit_reached',
          `You can track up to ${MAX_TRACKED_PER_USER} products`,
        );
      }

      const [product] = await tx
        .insert(products)
        .values({ marketplace, asin })
        .onConflictDoUpdate({ target: [products.marketplace, products.asin], set: { marketplace } })
        .returning({ id: products.id });
      if (!product) throw new Error('product upsert returned no row');

      // DO NOTHING + RETURNING: no row back means the alert already exists (race-safe).
      const [row] = await tx
        .insert(trackedProducts)
        .values({ userId, productId: product.id, targetPriceCents })
        .onConflictDoNothing({ target: [trackedProducts.userId, trackedProducts.productId] })
        .returning({ id: trackedProducts.id });
      if (!row)
        throw new ApiError(409, 'already_tracked', 'You already have an alert for this product');
      return row.id;
    });

    return c.json({ id }, 201);
  })
  .patch(
    '/:id',
    sValidator('param', UuidParamSchema, validationHook),
    sValidator('json', UpdateTrackedSchema, validationHook),
    async (c) => {
      const { id } = c.req.valid('param');
      const { targetPriceCents } = c.req.valid('json');
      const updated = await c.var.deps.db
        .update(trackedProducts)
        // Reset so the next drop below the new target notifies again.
        .set({ targetPriceCents, lastNotifiedAt: null })
        .where(and(eq(trackedProducts.id, id), eq(trackedProducts.userId, c.var.auth.userId)))
        .returning({ id: trackedProducts.id });
      if (updated.length === 0) throw notFound('Tracked product');
      return c.json({ id });
    },
  )
  .delete('/:id', sValidator('param', UuidParamSchema, validationHook), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await c.var.deps.db
      .delete(trackedProducts)
      .where(and(eq(trackedProducts.id, id), eq(trackedProducts.userId, c.var.auth.userId)))
      .returning({ id: trackedProducts.id });
    if (deleted.length === 0) throw notFound('Tracked product');
    return c.body(null, 204);
  });
