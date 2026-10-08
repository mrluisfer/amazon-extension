/**
 * Compact price-history wire format (inspired by Keepa's CSV arrays).
 *
 * A series is a list of change points `[timestamp, priceCents | null]`. On the
 * wire it is flattened and delta-encoded into a single integer array:
 *
 *   [t0, p0, dt1, p1, dt2, p2, ...]
 *
 * - `t0` is minutes since the Unix epoch; every following `dt` is minutes since
 *   the previous point. Small integers compress extremely well with gzip/br.
 * - `p` is the price in cents, or -1 when there was no offer (out of stock).
 */

export type PricePoint = readonly [timestampMs: number, priceCents: number | null];

const MS_PER_MINUTE = 60_000;
const NO_OFFER = -1;

export function encodeSeries(points: readonly PricePoint[]): number[] {
  const out: number[] = [];
  let prevMinute = 0;
  points.forEach(([ts, price], i) => {
    const minute = Math.floor(ts / MS_PER_MINUTE);
    out.push(i === 0 ? minute : minute - prevMinute, price ?? NO_OFFER);
    prevMinute = minute;
  });
  return out;
}

export function decodeSeries(encoded: readonly number[]): PricePoint[] {
  if (encoded.length % 2 !== 0) throw new Error('Encoded series must have an even length');
  const out: PricePoint[] = [];
  let minute = 0;
  for (let i = 0; i < encoded.length; i += 2) {
    const delta = encoded[i] as number;
    const price = encoded[i + 1] as number;
    minute = i === 0 ? delta : minute + delta;
    out.push([minute * MS_PER_MINUTE, price === NO_OFFER ? null : price]);
  }
  return out;
}
