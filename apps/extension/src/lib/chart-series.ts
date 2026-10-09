import type { SeriesType } from '@repo/shared';

export interface SeriesMeta {
  key: SeriesType;
  label: string;
  color: string;
  /** Area fill under the line (Keepa fills the Amazon series). */
  fill?: string;
  /** Dashed reference lines (list price). */
  dash?: number[];
  width?: number;
}

/**
 * Order = uPlot series order (index + 1). Colors follow Keepa's conventions so
 * users switching from it read the chart instantly.
 * Note: our "new" observation is the buy-box price, hence "Caja de compra".
 */
export const SERIES: readonly SeriesMeta[] = [
  { key: 'amazon', label: 'Amazon', color: '#f39c12', fill: 'rgba(243, 156, 18, 0.14)' },
  { key: 'new', label: 'Caja de compra', color: '#e0249a' },
  { key: 'used', label: 'Usado', color: '#374151' },
  // Reference, not a selling price: thin dashed grey, like Keepa's "Lista de precio".
  { key: 'list', label: 'Precio de lista', color: '#9ca3af', dash: [6, 4], width: 1.5 },
];

export interface RangeOption {
  key: 'week' | 'month' | 'quarter' | 'year' | 'all';
  label: string;
  days: number | null;
}

export const RANGES: readonly RangeOption[] = [
  { key: 'week', label: 'Semana', days: 7 },
  { key: 'month', label: 'Mes', days: 30 },
  { key: 'quarter', label: '3 meses', days: 90 },
  { key: 'year', label: 'Año', days: 365 },
  { key: 'all', label: 'Todo', days: null },
];

const DAY_S = 86_400;
const MIN_SPAN_S = 3_600;

/**
 * X-scale window (seconds) for a range. Never starts before the first data
 * point, so young products don't render a mostly-empty chart, and never
 * collapses to zero width.
 */
export function rangeWindow(
  xs: readonly number[],
  range: RangeOption,
): { min: number; max: number } | null {
  const first = xs[0];
  const last = xs.at(-1);
  if (first === undefined || last === undefined) return null;
  const min = range.days === null ? first : Math.max(first, last - range.days * DAY_S);
  return last - min < MIN_SPAN_S ? { min: last - MIN_SPAN_S, max: last } : { min, max: last };
}

/** Whole days covered by the data, for "Todo (N días)". */
export function spanDays(xs: readonly number[]): number {
  const first = xs[0];
  const last = xs.at(-1);
  return first === undefined || last === undefined
    ? 0
    : Math.max(1, Math.round((last - first) / DAY_S));
}
