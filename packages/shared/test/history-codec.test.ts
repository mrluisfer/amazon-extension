import { describe, expect, it } from 'vitest';
import { decodeSeries, encodeSeries, type PricePoint } from '../src/history-codec';

describe('history codec', () => {
  it('round-trips points including out-of-stock gaps', () => {
    const t0 = Date.UTC(2026, 0, 1, 12, 0);
    const points: PricePoint[] = [
      [t0, 129_900],
      [t0 + 90 * 60_000, 119_900],
      [t0 + 3 * 86_400_000, null],
      [t0 + 5 * 86_400_000, 124_900],
    ];
    const encoded = encodeSeries(points);
    expect(encoded).toEqual([
      Math.floor(t0 / 60_000),
      129_900,
      90,
      119_900,
      4230,
      -1,
      2880,
      124_900,
    ]);
    expect(decodeSeries(encoded)).toEqual(points);
  });

  it('handles empty series', () => {
    expect(encodeSeries([])).toEqual([]);
    expect(decodeSeries([])).toEqual([]);
  });

  it('rejects malformed input', () => {
    expect(() => decodeSeries([1, 2, 3])).toThrow();
  });
});
