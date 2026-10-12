import { LogoMark } from '@repo/brand';
import {
  AsinSchema,
  formatPrice,
  type MarketplaceId,
  MarketplaceIdSchema,
  SERIES_TYPES,
  type SeriesType,
} from '@repo/shared';
import { useMemo, useRef, useState } from 'react';
import * as v from 'valibot';
import { ChartLegend, RangeSelector } from '@/components/ChartSidebar';
import { PriceAlert } from '@/components/PriceAlert';
import { PriceChart, type XWindow } from '@/components/PriceChart';
import { SettingsPanel } from '@/components/SettingsPanel';
import { alignSeries, decodeAll } from '@/lib/chart-data';
import { formatRelative } from '@/lib/chart-format';
import { RANGES, type RangeOption, rangeWindow, SERIES, spanDays } from '@/lib/chart-series';
import { sendMessage } from '@/lib/messaging';
import { useTheme } from '@/lib/theme';
import { useAsync } from '@/lib/use-async';

/** Full history is fetched once; ranges and zoom are instant client-side windows. */
const ALL_HISTORY_DAYS = 3650;
const DEFAULT_RANGE = RANGES.find((r) => r.key === 'quarter') as RangeOption;

const ParamsSchema = v.object({ m: MarketplaceIdSchema, asin: AsinSchema });

function readParams(): { marketplace: MarketplaceId; asin: string } | null {
  const raw = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
  const parsed = v.safeParse(ParamsSchema, raw);
  return parsed.success ? { marketplace: parsed.output.m, asin: parsed.output.asin } : null;
}

const allTrue = () =>
  Object.fromEntries(SERIES_TYPES.map((t) => [t, true])) as Record<SeriesType, boolean>;

export function PanelApp() {
  const params = useMemo(readParams, []);
  if (!params) return <p className="p-4 text-sm text-danger">Producto no válido.</p>;
  return <Panel {...params} />;
}

function Panel({ marketplace, asin }: { marketplace: MarketplaceId; asin: string }) {
  const [state, reload] = useAsync(
    () => sendMessage('history:get', { marketplace, asin, days: ALL_HISTORY_DAYS }),
    [marketplace, asin],
  );
  const [range, setRange] = useState<RangeOption | null>(DEFAULT_RANGE);
  const lastRange = useRef<RangeOption>(DEFAULT_RANGE);
  const [zoom, setZoom] = useState<XWindow | null>(null);
  const [visible, setVisible] = useState(allTrue);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [yRange, setYRange] = useState<{ min: number; max: number } | null>(null);
  const [tab, setTab] = useState<'history' | 'settings'>('history');
  const theme = useTheme();

  const chart = useMemo(() => {
    if (state.status !== 'success') return null;
    const aligned = alignSeries(decodeAll(state.data.series));
    const xs = aligned[0];
    const available = Object.fromEntries(
      SERIES.map((s, i) => [s.key, (aligned[i + 1] ?? []).some((p) => p != null)]),
    ) as Record<SeriesType, boolean>;
    return { aligned, xs, available, totalDays: spanDays(xs) };
  }, [state]);

  const xWindow = useMemo(() => {
    if (!chart) return null;
    return zoom ?? rangeWindow(chart.xs, range ?? lastRange.current);
  }, [chart, zoom, range]);

  // Legend values: hovered point, else the latest known price per series.
  const values = useMemo(() => {
    const out = Object.fromEntries(SERIES_TYPES.map((t) => [t, null])) as Record<
      SeriesType,
      number | null
    >;
    if (!chart) return out;
    SERIES.forEach((s, i) => {
      const ys = chart.aligned[i + 1] ?? [];
      if (hoverIdx != null) out[s.key] = ys[hoverIdx] ?? null;
      else
        for (let j = ys.length - 1; j >= 0 && out[s.key] == null; j--) out[s.key] = ys[j] ?? null;
    });
    return out;
  }, [chart, hoverIdx]);

  // Min/max of the main visible series inside the current window.
  const stats = useMemo(() => {
    if (!chart || !xWindow) return null;
    const i = SERIES.findIndex((s) => s.key === 'new' && visible.new && chart.available.new);
    const idx = i >= 0 ? i : SERIES.findIndex((s) => visible[s.key] && chart.available[s.key]);
    if (idx < 0) return null;
    const ys = chart.aligned[idx + 1] ?? [];
    const inWindow = chart.xs
      .map((x, j) => (x >= xWindow.min && x <= xWindow.max ? ys[j] : null))
      .filter((p): p is number => p != null);
    if (inWindow.length === 0) return null;
    return { series: SERIES[idx], min: Math.min(...inWindow), max: Math.max(...inWindow) };
  }, [chart, xWindow, visible]);

  const selectRange = (r: RangeOption) => {
    lastRange.current = r;
    setRange(r);
    setZoom(null);
  };

  const hasData = (chart?.xs.length ?? 0) > 0;
  const lastObservedAt = state.status === 'success' ? state.data.product?.lastObservedAt : null;

  return (
    <div className="flex h-screen flex-col gap-1.5 rounded-lg border border-line p-3 font-sans text-xs">
      <header className="flex items-end justify-between border-b border-line">
        <div role="tablist" aria-label="Historial de Precios MX" className="-mb-px flex items-end">
          <LogoMark size={18} className="mr-1 mb-1.5 shrink-0" />
          {(
            [
              ['history', 'Historial de precios'],
              ['settings', 'Ajustes'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`tabpanel-${key}`}
              onClick={() => setTab(key)}
              className="border-b-2 border-transparent px-2.5 pb-1 text-sm text-fg-muted hover:text-fg aria-selected:border-brand aria-selected:font-semibold aria-selected:text-fg"
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'history' && lastObservedAt && (
          <span className="pb-1 text-fg-muted">
            (última actualización: {formatRelative(lastObservedAt, marketplace)})
          </span>
        )}
      </header>

      <section
        role="tabpanel"
        id="tabpanel-settings"
        aria-labelledby="tab-settings"
        hidden={tab !== 'settings'}
        className="overflow-y-auto"
      >
        <SettingsPanel pref={theme.pref} resolved={theme.resolved} onChange={theme.setPref} />
      </section>

      {/* Kept mounted while hidden so range/zoom/toggles survive switching tabs. */}
      <section
        role="tabpanel"
        id="tabpanel-history"
        aria-labelledby="tab-history"
        hidden={tab !== 'history'}
        className="flex min-h-0 flex-1 flex-col gap-1.5"
      >
        {state.status === 'loading' && (
          <div className="h-[330px] animate-pulse rounded bg-surface-3" />
        )}

        {state.status === 'error' && (
          <div className="flex h-[330px] flex-col items-center justify-center gap-2 text-sm text-fg-muted">
            <p>No pudimos cargar el historial.</p>
            <button type="button" onClick={reload} className="btn btn-secondary px-3 py-1 text-xs">
              Reintentar
            </button>
          </div>
        )}

        {state.status === 'success' && !hasData && (
          <div className="flex h-[330px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-fg-muted">
            <LogoMark size={40} />
            Aún no hay historial para este producto. Se construye con los precios que la comunidad
            comparte.
          </div>
        )}

        {state.status === 'success' && chart && hasData && (
          <div className="flex min-h-0 gap-4">
            <div className="min-w-0 flex-1">
              <PriceChart
                data={chart.aligned}
                marketplace={marketplace}
                visible={visible}
                window={xWindow}
                onZoom={(w) => {
                  setZoom(w);
                  setRange(null);
                }}
                onResetZoom={() => selectRange(lastRange.current)}
                onHover={setHoverIdx}
                onYRange={setYRange}
                theme={theme.resolved}
              />
              <p className="mt-6 text-[10px] leading-snug text-fg-muted">
                Selecciona un área para acercar · doble clic para restablecer · haz clic en la
                leyenda para mostrar u ocultar datos
              </p>
            </div>
            <aside className="flex w-52 shrink-0 flex-col gap-3 pt-1">
              <ChartLegend
                marketplace={marketplace}
                visible={visible}
                available={chart.available}
                values={values}
                onToggle={(key) => setVisible((prev) => ({ ...prev, [key]: !prev[key] }))}
                theme={theme.resolved}
                yRange={yRange}
              />
              <RangeSelector
                active={range?.key ?? null}
                totalDays={chart.totalDays}
                onSelect={selectRange}
              />
              {stats?.series && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-fg-muted">
                  <dt>Mínimo</dt>
                  <dd className="tabular-nums text-fg">{formatPrice(stats.min, marketplace)}</dd>
                  <dt>Máximo</dt>
                  <dd className="tabular-nums text-fg">{formatPrice(stats.max, marketplace)}</dd>
                  <dd className="col-span-2 text-[10px] text-fg-subtle">
                    {stats.series.label}, rango visible
                  </dd>
                </dl>
              )}
            </aside>
          </div>
        )}

        <PriceAlert marketplace={marketplace} asin={asin} />
      </section>
    </div>
  );
}
