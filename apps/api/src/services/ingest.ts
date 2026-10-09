import { type Database, priceObservations, pricePoints, products } from '@repo/db';
import type { Observation, SeriesType } from '@repo/shared';
import { and, countDistinct, desc, eq, gt, ne, sql } from 'drizzle-orm';

/** A price move beyond this factor (either direction) needs corroboration. */
export const SUSPICIOUS_FACTOR = 2;
/** Distinct users (including the reporter) required to confirm a suspicious move. */
export const MIN_CORROBORATIONS = 2;
export const CORROBORATION_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Client timestamps outside this window are rejected (stale queue / bad clock). */
export const MAX_OBSERVATION_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export type Decision = 'accepted' | 'duplicate' | 'pending' | 'rejected';

export interface DecisionInput {
  /** `undefined` = product/offer has no history yet. `null` = last known state was "no offer". */
  lastPrice: number | null | undefined;
  newPrice: number | null;
  /** Lazily computed: only called for suspicious moves (saves a query on the hot path). */
  corroborations: () => Promise<number>;
}

/**
 * Anti-poisoning policy for crowdsourced prices. Pure apart from the lazy
 * corroboration lookup, so it is unit-tested in isolation.
 */
export async function decideObservation({
  lastPrice,
  newPrice,
  corroborations,
}: DecisionInput): Promise<Decision> {
  if (lastPrice === undefined) return 'accepted';
  if (lastPrice === newPrice) return 'duplicate';
  if (lastPrice === null || newPrice === null) return 'accepted'; // stock transitions

  const factor = newPrice / lastPrice;
  const suspicious = factor >= SUSPICIOUS_FACTOR || factor <= 1 / SUSPICIOUS_FACTOR;
  if (!suspicious) return 'accepted';
  return (await corroborations()) >= MIN_CORROBORATIONS ? 'accepted' : 'pending';
}

export function isObservationFresh(observedAt: Date, now: Date): boolean {
  const age = now.getTime() - observedAt.getTime();
  return age <= MAX_OBSERVATION_AGE_MS && age >= -MAX_CLOCK_SKEW_MS;
}

/** Keeps only the latest observation per (marketplace, asin, offerType) in a batch. */
export function dedupeBatch(observations: readonly Observation[]): Observation[] {
  const byKey = new Map<string, Observation>();
  for (const o of observations) byKey.set(`${o.marketplace}:${o.asin}:${o.offerType}`, o);
  return [...byKey.values()];
}

/** A unit of ingestion: an observation for one series (offer types + derived list price). */
export type IngestItem = Omit<Observation, 'offerType'> & { offerType: SeriesType };

/**
 * Dedupes the batch and derives the "Precio de lista" series: one `list` item
 * per product, taken from the buy-box (`new`) report, else the `amazon` one.
 * A missing list price is ignored rather than recorded as a gap — most products
 * don't show one, and a selector miss must not erase the line.
 */
export function expandBatch(observations: readonly Observation[]): IngestItem[] {
  const items: IngestItem[] = dedupeBatch(observations);
  const listByProduct = new Map<string, Observation>();
  for (const o of items) {
    if (o.offerType === 'list' || o.listPriceCents == null) continue;
    const key = `${o.marketplace}:${o.asin}`;
    if (o.offerType === 'new' || !listByProduct.has(key)) listByProduct.set(key, o as Observation);
  }
  for (const o of listByProduct.values()) {
    items.push({
      ...o,
      offerType: 'list',
      priceCents: o.listPriceCents ?? null,
      listPriceCents: null,
    });
  }
  return items;
}

export type IngestSummary = Record<Decision, number>;

export async function ingestBatch(
  db: Database,
  userId: string,
  batch: readonly Observation[],
  now: Date = new Date(),
): Promise<IngestSummary> {
  const summary: IngestSummary = { accepted: 0, duplicate: 0, pending: 0, rejected: 0 };

  await db.transaction(async (tx) => {
    for (const obs of expandBatch(batch)) {
      const observedAt = new Date(obs.observedAt);
      const [product] = await tx
        .insert(products)
        .values({
          marketplace: obs.marketplace,
          asin: obs.asin,
          title: obs.title ?? null,
          imageUrl: obs.imageUrl ?? null,
          lastObservedAt: now,
        })
        .onConflictDoUpdate({
          target: [products.marketplace, products.asin],
          set: {
            title: sql`coalesce(excluded.title, ${products.title})`,
            imageUrl: sql`coalesce(excluded.image_url, ${products.imageUrl})`,
            lastObservedAt: now,
          },
        })
        .returning({ id: products.id });
      if (!product) throw new Error('product upsert returned no row');

      const decision: Decision = isObservationFresh(observedAt, now)
        ? await decideObservation({
            lastPrice: await lastPrice(tx, product.id, obs.offerType),
            newPrice: obs.priceCents,
            corroborations: () => countCorroborations(tx, product.id, obs, userId, now),
          })
        : 'rejected';

      await tx.insert(priceObservations).values({
        productId: product.id,
        userId,
        offerType: obs.offerType,
        priceCents: obs.priceCents,
        listPriceCents: obs.listPriceCents ?? null,
        status: decision,
        observedAt: isObservationFresh(observedAt, now) ? observedAt : now,
        receivedAt: now,
      });

      if (decision === 'accepted') {
        // Server time, not client time: keeps each series monotonic.
        await tx
          .insert(pricePoints)
          .values({
            productId: product.id,
            offerType: obs.offerType,
            ts: now,
            priceCents: obs.priceCents,
          })
          .onConflictDoNothing();
      }
      summary[decision]++;
    }
  });

  return summary;
}

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

async function lastPrice(
  tx: Tx,
  productId: number,
  offerType: SeriesType,
): Promise<number | null | undefined> {
  const [row] = await tx
    .select({ priceCents: pricePoints.priceCents })
    .from(pricePoints)
    .where(and(eq(pricePoints.productId, productId), eq(pricePoints.offerType, offerType)))
    .orderBy(desc(pricePoints.ts))
    .limit(1);
  return row ? row.priceCents : undefined;
}

async function countCorroborations(
  tx: Tx,
  productId: number,
  obs: IngestItem,
  userId: string,
  now: Date,
): Promise<number> {
  if (obs.priceCents === null) return 1;
  const [row] = await tx
    .select({ others: countDistinct(priceObservations.userId) })
    .from(priceObservations)
    .where(
      and(
        eq(priceObservations.productId, productId),
        eq(priceObservations.offerType, obs.offerType),
        eq(priceObservations.priceCents, obs.priceCents),
        ne(priceObservations.userId, userId),
        gt(priceObservations.receivedAt, new Date(now.getTime() - CORROBORATION_WINDOW_MS)),
      ),
    );
  return (row?.others ?? 0) + 1;
}
