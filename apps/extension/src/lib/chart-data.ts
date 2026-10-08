import { decodeSeries, OFFER_TYPES, type OfferType, type PricePoint } from '@repo/shared';

export interface SeriesStats {
  current: number | null;
  min: number | null;
  max: number | null;
}

export function decodeAll(series: Record<OfferType, number[]>): Record<OfferType, PricePoint[]> {
  return Object.fromEntries(OFFER_TYPES.map((t) => [t, decodeSeries(series[t] ?? [])])) as Record<
    OfferType,
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
  decoded: Record<OfferType, PricePoint[]>,
  now: number = Date.now(),
): [xs: number[], ...ys: (number | null)[][]] {
  const timestamps = new Set<number>();
  for (const t of OFFER_TYPES) for (const [ts] of decoded[t]) timestamps.add(ts);
  if (timestamps.size === 0) return [[], ...OFFER_TYPES.map(() => [])];
  timestamps.add(Math.max(now, ...timestamps));

  const xs = [...timestamps].sort((a, b) => a - b);
  const ys = OFFER_TYPES.map((t) => {
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
