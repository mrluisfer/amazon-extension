import { describe, expect, it } from 'vitest';
import { alignSeries, statsFor } from '../src/lib/chart-data';
import { mergeQueue } from '../src/lib/observation-queue';

const H = 3600_000;

describe('alignSeries', () => {
  it('aligns change-only series as carried-forward steps with a trailing "now" point', () => {
    const [xs, amazon, fresh, used, list] = alignSeries(
      {
        amazon: [
          [0, 1000],
          [2 * H, null],
        ],
        new: [[H, 900]],
        used: [],
        list: [[0, 1500]],
      },
      3 * H,
    );
    expect(xs).toEqual([0, 3600, 7200, 10800]);
    expect(amazon).toEqual([1000, 1000, null, null]);
    expect(fresh).toEqual([null, 900, 900, 900]);
    expect(used).toEqual([null, null, null, null]);
    expect(list).toEqual([1500, 1500, 1500, 1500]);
  });

  it('returns empty arrays when there is no data', () => {
    expect(alignSeries({ amazon: [], new: [], used: [], list: [] })).toEqual([[], [], [], [], []]);
  });
});

describe('statsFor', () => {
  it('ignores out-of-stock gaps for min/max', () => {
    expect(
      statsFor([
        [0, 500],
        [1, null],
        [2, 300],
      ]),
    ).toEqual({ current: 300, min: 300, max: 500 });
  });
});

describe('mergeQueue', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');
  const obs = (asin: string, priceCents: number, hoursAgo = 0) => ({
    marketplace: 'mx' as const,
    asin,
    offerType: 'new' as const,
    priceCents,
    availability: 'unknown' as const,
    observedAt: new Date(now - hoursAgo * H).toISOString(),
  });

  it('keeps the newest observation per product and drops stale ones', () => {
    const merged = mergeQueue(
      [obs('A000000001', 100, 1), obs('A000000002', 50, 30)],
      [obs('A000000001', 90)],
      now,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.priceCents).toBe(90);
  });
});
