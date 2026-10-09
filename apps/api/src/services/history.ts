import { type Database, pricePoints, products } from '@repo/db';
import {
  encodeSeries,
  type HistoryResponse,
  type MarketplaceId,
  type PricePoint,
  SERIES_TYPES,
  type SeriesType,
} from '@repo/shared';
import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';

export async function getHistory(
  db: Database,
  marketplace: MarketplaceId,
  asin: string,
  days: number,
  now: Date = new Date(),
): Promise<HistoryResponse> {
  const empty = Object.fromEntries(SERIES_TYPES.map((t) => [t, []])) as unknown as Record<
    SeriesType,
    number[]
  >;

  const [product] = await db
    .select({
      id: products.id,
      title: products.title,
      imageUrl: products.imageUrl,
      lastObservedAt: products.lastObservedAt,
    })
    .from(products)
    .where(and(eq(products.marketplace, marketplace), eq(products.asin, asin)))
    .limit(1);

  if (!product) {
    return { product: null, series: empty, generatedAt: now.toISOString() };
  }

  const since = new Date(now.getTime() - days * 86_400_000);
  const [inWindow, carriedIn] = await Promise.all([
    db
      .select({
        offerType: pricePoints.offerType,
        ts: pricePoints.ts,
        priceCents: pricePoints.priceCents,
      })
      .from(pricePoints)
      .where(and(eq(pricePoints.productId, product.id), gte(pricePoints.ts, since)))
      .orderBy(asc(pricePoints.offerType), asc(pricePoints.ts)),
    // Last known price before the window, so the chart starts at the right level.
    db
      .selectDistinctOn([pricePoints.offerType], {
        offerType: pricePoints.offerType,
        priceCents: pricePoints.priceCents,
      })
      .from(pricePoints)
      .where(and(eq(pricePoints.productId, product.id), lt(pricePoints.ts, since)))
      .orderBy(pricePoints.offerType, desc(pricePoints.ts)),
  ]);

  const grouped = new Map<SeriesType, PricePoint[]>(SERIES_TYPES.map((t) => [t, []]));
  for (const row of carriedIn) grouped.get(row.offerType)?.push([since.getTime(), row.priceCents]);
  for (const row of inWindow) grouped.get(row.offerType)?.push([row.ts.getTime(), row.priceCents]);

  const series = { ...empty };
  for (const [type, points] of grouped) series[type] = encodeSeries(points);

  return {
    product: {
      marketplace,
      asin,
      title: product.title,
      imageUrl: product.imageUrl,
      lastObservedAt: product.lastObservedAt?.toISOString() ?? null,
    },
    series,
    generatedAt: now.toISOString(),
  };
}
