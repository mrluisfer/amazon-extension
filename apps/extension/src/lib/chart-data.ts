import { decodeSeries, type PricePoint, SERIES_TYPES, type SeriesType } from '@repo/shared';

export interface SeriesStats {
  current: number | null;
  min: number | null;
  max: number | null;
}

export function decodeAll(series: Record<SeriesType, number[]>): Record<SeriesType, PricePoint[]> {
  return Object.fromEntries(SERIES_TYPES.map((t) => [t, decodeSeries(series[t] ?? [])])) as Record<
    SeriesType,
    PricePoint[]
  >;
}

/**
 * Converts change-only series into uPlot's aligned format: one shared x axis
 * (seconds) and one y array per series, carrying each price forward until it
 * changes (step function). A trailing point at `now` extends the last step.
 * `null` renders as a gap (no data yet / out of stock).
 */
export function alignSeries(
  decoded: Record<SeriesType, PricePoint[]>,
  now: number = Date.now(),
): [xs: number[], ...ys: (number | null)[][]] {
  const timestamps = new Set<number>();
  for (const t of SERIES_TYPES) for (const [ts] of decoded[t]) timestamps.add(ts);
  if (timestamps.size === 0) return [[], ...SERIES_TYPES.map(() => [])];
  timestamps.add(Math.max(now, ...timestamps));

  const xs = [...timestamps].sort((a, b) => a - b);
  const ys = SERIES_TYPES.map((t) => {
    const points = decoded[t];
    let i = 0;
    let last: number | null = null;
    return xs.map((x) => {
      while (i < points.length && (points[i] as PricePoint)[0] <= x) {
        last = (points[i] as PricePoint)[1];
        i++;
      }
      return i === 0 ? null : last;
    });
  });
  return [xs.map((x) => Math.floor(x / 1000)), ...ys];
}

export function statsFor(points: readonly PricePoint[]): SeriesStats {
  const prices = points.map(([, p]) => p).filter((p): p is number => p !== null);
  return {
    current: points.at(-1)?.[1] ?? null,
    min: prices.length ? Math.min(...prices) : null,
    max: prices.length ? Math.max(...prices) : null,
  };
}

/**
 * Index of the price in effect at time `x` (seconds): the last timestamp ≤ x.
 * Step semantics — a price holds until the next change — so hovering anywhere on
 * the chart reads the value shown there, not the nearest data point.
 */
export function stepIndex(xs: ArrayLike<number>, x: number): number | null {
  let lo = 0;
  let hi = xs.length - 1;
  if (hi < 0 || x < (xs[0] as number)) return null;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((xs[mid] as number) <= x) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Min/max over the given series between indices i0..i1 (inclusive), also
 * counting the value in effect just before i0 (it is drawn at the window's left
 * edge). Null when those series have no values there.
 */
export function valueExtent(
  ys: readonly ArrayLike<number | null | undefined>[],
  i0: number,
  i1: number,
): [min: number, max: number] | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const values of ys) {
    for (let i = Math.max(0, i0 - 1); i <= i1 && i < values.length; i++) {
      const v = values[i];
      if (v == null) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return min === Number.POSITIVE_INFINITY ? null : [min, max];
}
