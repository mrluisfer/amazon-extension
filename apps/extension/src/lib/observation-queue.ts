import { MAX_OBSERVATIONS_PER_BATCH, type Observation } from '@repo/shared';
import { api } from './api-client';
import { consentItem, observationQueueItem } from './storage';

const MAX_QUEUE = 100;
const FLUSH_THRESHOLD = 20;
/** Server rejects observations older than 24h; drop them client-side first. */
const MAX_AGE_MS = 23 * 60 * 60 * 1000;

const keyOf = (o: Observation) => `${o.marketplace}:${o.asin}:${o.offerType}`;

/** Merge keeping the newest observation per product/offer, capped to MAX_QUEUE. */
export function mergeQueue(
  queue: readonly Observation[],
  incoming: readonly Observation[],
  now = Date.now(),
) {
  const byKey = new Map<string, Observation>();
  for (const o of [...queue, ...incoming]) {
    if (now - Date.parse(o.observedAt) > MAX_AGE_MS) continue;
    byKey.delete(keyOf(o)); // re-insert so newest ends up last
    byKey.set(keyOf(o), o);
  }
  return [...byKey.values()].slice(-MAX_QUEUE);
}

export async function enqueueObservations(incoming: Observation[]): Promise<number> {
  if ((await consentItem.getValue()) !== 'granted') return 0;
  const merged = mergeQueue(await observationQueueItem.getValue(), incoming);
  await observationQueueItem.setValue(merged);
  if (merged.length >= FLUSH_THRESHOLD) void flushObservations().catch(() => {});
  return incoming.length;
}

/**
 * Flushes now if a report for this product is still queued, so the panel's
 * history request already includes what the user is looking at.
 */
export async function flushIfPending(marketplace: string, asin: string): Promise<void> {
  const queue = await observationQueueItem.getValue();
  if (queue.some((o) => o.marketplace === marketplace && o.asin === asin)) {
    await flushObservations();
  }
}

let flushing: Promise<void> | null = null;

/** Single-flight batch upload. Called by the periodic alarm and on threshold. */
export function flushObservations(): Promise<void> {
  flushing ??= doFlush().finally(() => {
    flushing = null;
  });
  return flushing;
}

async function doFlush(): Promise<void> {
  if ((await consentItem.getValue()) !== 'granted') {
    await observationQueueItem.setValue([]);
    return;
  }
  const queue = mergeQueue(await observationQueueItem.getValue(), []);
  if (queue.length === 0) return;

  const batch = queue.slice(0, MAX_OBSERVATIONS_PER_BATCH);
  await api.reportObservations(batch);

  // Re-read: new observations may have been queued while the request was in flight.
  const sent = new Set(batch.map((o) => `${keyOf(o)}@${o.observedAt}`));
  const current = await observationQueueItem.getValue();
  await observationQueueItem.setValue(
    current.filter((o) => !sent.has(`${keyOf(o)}@${o.observedAt}`)),
  );
}
