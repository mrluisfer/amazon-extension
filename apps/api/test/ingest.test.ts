import type { Observation } from '@repo/shared';
import { describe, expect, it, vi } from 'vitest';
import { decideObservation, dedupeBatch, isObservationFresh } from '../src/services/ingest';

const never = () => Promise.reject(new Error('should not query corroborations'));

describe('decideObservation', () => {
  it('accepts the first observation of a series', async () => {
    expect(
      await decideObservation({ lastPrice: undefined, newPrice: 1000, corroborations: never }),
    ).toBe('accepted');
  });

  it('marks unchanged prices as duplicates', async () => {
    expect(
      await decideObservation({ lastPrice: 1000, newPrice: 1000, corroborations: never }),
    ).toBe('duplicate');
  });

  it('accepts stock transitions without corroboration', async () => {
    expect(
      await decideObservation({ lastPrice: 1000, newPrice: null, corroborations: never }),
    ).toBe('accepted');
    expect(
      await decideObservation({ lastPrice: null, newPrice: 1000, corroborations: never }),
    ).toBe('accepted');
  });

  it('accepts normal price moves without extra queries', async () => {
    expect(await decideObservation({ lastPrice: 1000, newPrice: 800, corroborations: never })).toBe(
      'accepted',
    );
  });

  it('holds suspicious moves until corroborated', async () => {
    const single = vi.fn().mockResolvedValue(1);
    const double = vi.fn().mockResolvedValue(2);
    expect(
      await decideObservation({ lastPrice: 100_000, newPrice: 100, corroborations: single }),
    ).toBe('pending');
    expect(
      await decideObservation({ lastPrice: 100, newPrice: 100_000, corroborations: double }),
    ).toBe('accepted');
    expect(single).toHaveBeenCalledOnce();
  });
});

describe('isObservationFresh', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  it.each([
    ['now', 0, true],
    ['23h ago', 23 * 3600_000, true],
    ['25h ago', 25 * 3600_000, false],
    ['10 min in the future', -10 * 60_000, false],
  ])('%s', (_l, ageMs, fresh) => {
    expect(isObservationFresh(new Date(now.getTime() - ageMs), now)).toBe(fresh);
  });
});

describe('dedupeBatch', () => {
  it('keeps the last observation per product/offer', () => {
    const base = {
      marketplace: 'mx',
      asin: 'B0CHX1W1XY',
      availability: 'unknown',
      observedAt: '2026-10-08T00:00:00Z',
    } as const;
    const batch: Observation[] = [
      { ...base, offerType: 'new', priceCents: 100 },
      { ...base, offerType: 'new', priceCents: 200 },
      { ...base, offerType: 'used', priceCents: 50 },
    ];
    expect(dedupeBatch(batch).map((o) => o.priceCents)).toEqual([200, 50]);
  });
});
