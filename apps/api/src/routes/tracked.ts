import { sValidator } from '@hono/standard-validator';
import { products, trackedProducts } from '@repo/db';
import { type TrackedProduct, TrackProductSchema, UuidParamSchema } from '@repo/shared';
import { and, count, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { ApiError, notFound, validationHook } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { byUser, rateLimit } from '../middleware/rate-limit';
import type { AppEnv } from '../types';

export const MAX_TRACKED_PER_USER = 500;

export const trackedRoute = new Hono<AppEnv>()
  .use(requireAuth, rateLimit('api', byUser))
  .get('/', async (c) => {
    const rows = await c.var.deps.db
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
      .where(eq(trackedProducts.userId, c.var.auth.userId))
      .orderBy(desc(trackedProducts.createdAt))
      .limit(MAX_TRACKED_PER_USER);

    const items: TrackedProduct[] = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
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

      const [row] = await tx
        .insert(trackedProducts)
        .values({ userId, productId: product.id, targetPriceCents: targetPriceCents ?? null })
        .onConflictDoUpdate({
          target: [trackedProducts.userId, trackedProducts.productId],
          set: { targetPriceCents: targetPriceCents ?? null },
        })
        .returning({ id: trackedProducts.id });
      return row?.id;
    });

    return c.json({ id }, 201);
  })
  .delete('/:id', sValidator('param', UuidParamSchema, validationHook), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await c.var.deps.db
      .delete(trackedProducts)
      .where(and(eq(trackedProducts.id, id), eq(trackedProducts.userId, c.var.auth.userId)))
      .returning({ id: trackedProducts.id });
    if (deleted.length === 0) throw notFound('Tracked product');
    return c.body(null, 204);
  });
