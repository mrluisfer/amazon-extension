import { formatPrice, type MarketplaceId, type SeriesType } from '@repo/shared';
import { RANGES, type RangeOption, seriesFor } from '@/lib/chart-series';
import type { Theme } from '@/lib/theme';

interface LegendProps {
  marketplace: MarketplaceId;
  visible: Record<SeriesType, boolean>;
  /** Series with at least one point; the others render greyed out (like Keepa). */
  available: Record<SeriesType, boolean>;
  /** Value shown next to each series: hovered value, else the current price. */
  values: Record<SeriesType, number | null>;
  onToggle: (key: SeriesType) => void;
  theme: Theme;
}

export function ChartLegend({
  marketplace,
  visible,
  available,
  values,
  onToggle,
  theme,
}: LegendProps) {
  return (
    <ul className="flex flex-col gap-0.5" aria-label="Series">
      {seriesFor(theme).map((s) => {
        const enabled = available[s.key];
        const on = enabled && visible[s.key];
        return (
          <li key={s.key}>
            <button
              type="button"
              disabled={!enabled}
              aria-pressed={on}
              onClick={() => onToggle(s.key)}
              title={enabled ? 'Mostrar u ocultar' : 'Sin datos todavía'}
              className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-surface-2 disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border-2"
                style={{
                  borderColor: enabled ? s.color : 'var(--color-line-strong)',
                  backgroundColor: on ? s.color : 'transparent',
                }}
              />
              <span className={on ? 'text-fg' : 'text-fg-subtle'}>{s.label}</span>
              <span className="ml-auto tabular-nums text-fg-2">
                {on && values[s.key] != null
                  ? formatPrice(values[s.key] as number, marketplace)
                  : ''}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface RangeProps {
  active: RangeOption['key'] | null;
  totalDays: number;
  onSelect: (range: RangeOption) => void;
}

export function RangeSelector({ active, totalDays, onSelect }: RangeProps) {
  return (
    <div className="flex gap-2">
      <span className="pt-0.5 text-fg-muted">Rango</span>
      <ul className="flex flex-col">
        {RANGES.map((r) => (
          <li key={r.key}>
            <button
              type="button"
              aria-pressed={active === r.key}
              onClick={() => onSelect(r)}
              className="border-l-2 border-transparent py-px pl-1.5 text-left text-fg-2 hover:text-fg aria-pressed:border-brand aria-pressed:font-semibold aria-pressed:text-fg"
            >
              {r.days === null
                ? `Todo (${totalDays} ${totalDays === 1 ? 'día' : 'días'})`
                : r.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
