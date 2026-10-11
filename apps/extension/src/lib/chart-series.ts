import type { SeriesType } from '@repo/shared';

import type { Theme } from './theme';

type Themed<T> = Record<Theme, T>;

interface SeriesDef {
  key: SeriesType;
  label: string;
  color: Themed<string>;
  /** Area fill under the line (Keepa fills the Amazon series). */
  fill?: Themed<string>;
  /** Dashed reference lines (list price). */
  dash?: number[];
  width?: number;
}

export interface SeriesMeta extends Omit<SeriesDef, 'color' | 'fill'> {
  color: string;
  fill?: string;
}

/**
 * Order = uPlot series order (index + 1). Light colors follow Keepa's
 * conventions so users switching from it read the chart instantly; dark
 * variants are brighter so they keep contrast on the dark surface.
 * Note: our "new" observation is the buy-box price, hence "Caja de compra".
 */
const SERIES_DEFS: readonly SeriesDef[] = [
  {
    key: 'amazon',
    label: 'Amazon',
    color: { light: '#f39c12', dark: '#f5a524' },
    fill: { light: 'rgba(243, 156, 18, 0.14)', dark: 'rgba(245, 165, 36, 0.16)' },
  },
  { key: 'new', label: 'Caja de compra', color: { light: '#e0249a', dark: '#f0479f' } },
  { key: 'used', label: 'Usado', color: { light: '#333838', dark: '#d5d9d9' } },
  // Reference, not a selling price: thin dashed grey, like Keepa's "Lista de precio".
  {
    key: 'list',
    label: 'Precio de lista',
    color: { light: '#8a8f8f', dark: '#6f7e8c' },
    dash: [6, 4],
    width: 1.5,
  },
];

const resolve = (theme: Theme): SeriesMeta[] =>
  SERIES_DEFS.map((d) => ({ ...d, color: d.color[theme], fill: d.fill?.[theme] }));
const RESOLVED: Themed<SeriesMeta[]> = { light: resolve('light'), dark: resolve('dark') };

/** Series with colors for the given theme (stable references per theme). */
export function seriesFor(theme: Theme): readonly SeriesMeta[] {
  return RESOLVED[theme];
}

/** Light series — for code that only needs keys/labels/order. */
export const SERIES: readonly SeriesMeta[] = RESOLVED.light;

/** Canvas colors (uPlot draws axes/grid itself; CSS can't reach them). */
export const CHART_PALETTE: Themed<{ axis: string; grid: string; tick: string; point: string }> = {
  light: { axis: '#565959', grid: '#eef0f0', tick: '#d5d9d9', point: '#ffffff' },
  dark: { axis: '#a7b1bc', grid: '#1f2a37', tick: '#37475a', point: '#131921' },
};

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
