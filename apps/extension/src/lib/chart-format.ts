import { MARKETPLACES, type MarketplaceId } from '@repo/shared';

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>();
function memo<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  key: string,
  make: () => T,
): T {
  let fmt = cache.get(key) as T | undefined;
  if (!fmt) {
    fmt = make();
    cache.set(key, fmt);
  }
  return fmt;
}

/** Axis ticks: whole currency units ("$1,250"). */
export function formatAxisPrice(cents: number, marketplace: MarketplaceId): string {
  const { locale, currency } = MARKETPLACES[marketplace];
  return memo(
    `axis:${marketplace}`,
    () => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }),
  ).format(cents / 100);
}

/** Axis dates: "16 jul". */
export function formatAxisDate(seconds: number, marketplace: MarketplaceId): string {
  const { locale } = MARKETPLACES[marketplace];
  return memo(
    `axisDate:${marketplace}`,
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
  )
    .format(seconds * 1000)
    .replace('.', '');
}

/** Crosshair label: "mié, 23 sep, 6:55". */
export function formatCursorDate(seconds: number, marketplace: MarketplaceId): string {
  const { locale } = MARKETPLACES[marketplace];
  return memo(
    `cursor:${marketplace}`,
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }),
  ).format(seconds * 1000);
}

/** "hace 16 minutos", "hace 2 días". */
export function formatRelative(iso: string, marketplace: MarketplaceId, now = Date.now()): string {
  const { locale } = MARKETPLACES[marketplace];
  const rtf = memo(
    `rel:${marketplace}`,
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
  );
  const diffS = Math.round((Date.parse(iso) - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(diffS) >= size) return rtf.format(Math.round(diffS / size), unit);
  }
  return rtf.format(0, 'minute');
}

export interface TooltipItem {
  key: string;
  /** Desired vertical position (px, top of plot area) — the point's y. */
  y: number;
}

/**
 * Spreads hover tooltips vertically so they never overlap (Keepa-style labels
 * pointing at each series). Keeps order by value, pushes down on collision,
 * then shifts the whole stack up if it overflows the plot height.
 */
export function layoutTooltips<T extends TooltipItem>(
  items: readonly T[],
  boxHeight: number,
  plotHeight: number,
): (T & { top: number })[] {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  const placed: (T & { top: number })[] = [];
  for (const item of sorted) {
    const prev = placed.at(-1);
    const top = Math.max(item.y - boxHeight / 2, prev ? prev.top + boxHeight + 4 : 0);
    placed.push({ ...item, top });
  }
  const last = placed.at(-1);
  const overflow = last ? last.top + boxHeight - plotHeight : 0;
  if (overflow > 0) for (const p of placed) p.top = Math.max(0, p.top - overflow);
  return placed;
}
