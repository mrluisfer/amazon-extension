import { formatPrice, type MarketplaceId, type SeriesType } from '@repo/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { stepIndex, valueExtent } from '@/lib/chart-data';
import {
  formatAxisDates,
  formatAxisPrice,
  formatCursorDate,
  layoutTooltips,
} from '@/lib/chart-format';
import { CHART_PALETTE, seriesFor } from '@/lib/chart-series';
import type { Theme } from '@/lib/theme';

export type XWindow = { min: number; max: number };

interface Props {
  data: uPlot.AlignedData;
  marketplace: MarketplaceId;
  visible: Record<SeriesType, boolean>;
  /** Controlled x window (seconds) from the range selector. */
  window: XWindow | null;
  /** Drag-to-zoom selected a window. */
  onZoom: (window: XWindow) => void;
  /** Double click: back to the selected range. */
  onResetZoom: () => void;
  /** Data index in effect under the cursor (null when the cursor leaves). */
  onHover: (idx: number | null) => void;
  /** Current y scale (cents), so the legend can flag values drawn off-scale. */
  onYRange?: (range: { min: number; max: number }) => void;
  /** Resolved theme: canvas colors can't come from CSS, so the plot is rebuilt on change. */
  theme: Theme;
  height?: number;
}

interface HoverState {
  idx: number;
  /** Cursor time (seconds) — what the date label shows. */
  x: number;
  left: number;
  plotWidth: number;
  plotHeight: number;
  items: {
    key: SeriesType;
    label: string;
    color: string;
    value: number;
    y: number;
    /** The point is inside the plot (list price can sit above the scale). */
    onScale: boolean;
  }[];
}

/** Reference series that must not stretch the y scale (see the y `range`). */
const REFERENCE_SERIES: ReadonlySet<SeriesType> = new Set(['list']);

const TOOLTIP_H = 38;
const TOOLTIP_W = 118;

/** Index of the last non-null value of a series (for the end-of-line dot). */
function lastIndex(values: ArrayLike<number | null | undefined>): number | null {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] != null) return i;
  return null;
}

/**
 * Keepa-style price chart: canvas rendering by uPlot (fast with years of
 * step data), with a React overlay for per-series hover labels.
 */
export function PriceChart({
  data,
  marketplace,
  visible,
  window,
  onZoom,
  onResetZoom,
  onHover,
  onYRange,
  theme,
  height = 282,
}: Props) {
  const series = seriesFor(theme);
  const palette = CHART_PALETTE[theme];
  const rootRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const [overEl, setOverEl] = useState<HTMLElement | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  // Latest callbacks without re-creating the plot.
  const cb = useRef({ onZoom, onResetZoom, onHover, onYRange, visible, window });
  cb.current = { onZoom, onResetZoom, onHover, onYRange, visible, window };

  // biome-ignore lint/correctness/useExhaustiveDependencies: series/palette derive from `theme`
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const opts: uPlot.Options = {
      width: el.clientWidth,
      height,
      legend: { show: false },
      scales: {
        x: { time: true },
        y: {
          // Scale to the selling prices in view. The list price is a reference that
          // is often far above them; letting it into the range squashes the lines
          // that matter (it's still drawn when in range, and shown in the legend).
          range: (u, dataMin, dataMax) => {
            const xs = u.data[0];
            const [i0, i1] = u.series[0]?.idxs ?? [0, xs.length - 1];
            const selling = series
              .map((s, i) => ({ s, ys: u.data[i + 1] ?? [], shown: u.series[i + 1]?.show }))
              .filter(({ s, shown }) => shown && !REFERENCE_SERIES.has(s.key))
              .map(({ ys }) => ys);
            const [min, max] = valueExtent(selling, i0, i1) ?? [dataMin, dataMax];
            const pad = Math.max((max - min) * 0.08, max * 0.02, 100);
            return [Math.max(0, min - pad), max + pad];
          },
        },
      },
      series: [
        {},
        ...series.map((s) => ({
          label: s.label,
          stroke: s.color,
          fill: s.fill,
          dash: s.dash,
          width: s.width ?? 2,
          spanGaps: false,
          show: cb.current.visible[s.key],
          paths: uPlot.paths.stepped?.({ align: 1 }),
          points: {
            show: true,
            size: 7,
            fill: s.color,
            filter: (u: uPlot, seriesIdx: number) => {
              const i = lastIndex(u.data[seriesIdx] ?? []);
              return i === null ? null : [i];
            },
          },
        })),
      ],
      axes: [
        {
          stroke: palette.axis,
          grid: { stroke: palette.grid },
          ticks: { stroke: palette.tick },
          values: (_u, splits) => formatAxisDates(splits, marketplace),
        },
        {
          stroke: palette.axis,
          grid: { stroke: palette.grid },
          ticks: { stroke: palette.tick },
          size: 70,
          values: (_u, splits) => splits.map((s) => formatAxisPrice(s, marketplace)),
        },
      ],
      cursor: {
        y: false,
        // We own the x scale (controlled `window`); a drag only reports the selection.
        drag: { x: true, y: false, setScale: false },
        // Hover dots are drawn by the React overlay at the cursor's x (uPlot's own
        // would snap to the nearest data point).
        points: { show: false },
        bind: {
          dblclick: () => () => {
            cb.current.onResetZoom();
            return null;
          },
        },
      },
      hooks: {
        setSelect: [
          (u) => {
            const { left, width } = u.select;
            if (width > 4) {
              cb.current.onZoom({ min: u.posToVal(left, 'x'), max: u.posToVal(left + width, 'x') });
            }
            u.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false);
          },
        ],
        setCursor: [
          (u) => {
            const left = u.cursor.left;
            const xs = u.data[0];
            const idx = left == null || left < 0 ? null : stepIndex(xs, u.posToVal(left, 'x'));
            cb.current.onHover(idx);
            if (idx == null || left == null) {
              setHover(null);
              return;
            }
            const plotHeight = u.over.clientHeight;
            const items: HoverState['items'] = [];
            series.forEach((s, i) => {
              const v = u.data[i + 1]?.[idx];
              if (v == null || !u.series[i + 1]?.show) return;
              const y = u.valToPos(v, 'y');
              items.push({
                key: s.key,
                label: s.label,
                color: s.color,
                value: v,
                y: Math.min(Math.max(y, 0), plotHeight),
                onScale: y >= 0 && y <= plotHeight,
              });
            });
            setHover({
              idx,
              x: u.posToVal(left, 'x'),
              left,
              plotWidth: u.over.clientWidth,
              plotHeight,
              items,
            });
          },
        ],
        setScale: [
          (u, key) => {
            const y = u.scales.y;
            if (key === 'y' && y?.min != null && y.max != null) {
              cb.current.onYRange?.({ min: y.min, max: y.max });
            }
          },
        ],
      },
    };

    const plot = new uPlot(opts, data, el);
    plotRef.current = plot;
    // A rebuilt plot (e.g. theme change) must keep the selected range/zoom.
    if (cb.current.window) plot.setScale('x', cb.current.window);
    setOverEl(plot.over);
    const ro = new ResizeObserver(() => plot.setSize({ width: el.clientWidth, height }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      plot.destroy();
      plotRef.current = null;
      setOverEl(null);
      setHover(null);
    };
  }, [data, marketplace, height, theme]);

  // Controlled x window (range buttons / reset).
  useEffect(() => {
    const plot = plotRef.current;
    const xs = data[0];
    if (!plot || xs.length === 0) return;
    plot.setScale('x', window ?? { min: xs[0] as number, max: xs.at(-1) as number });
  }, [window, data]);

  // Series visibility (legend toggles).
  // biome-ignore lint/correctness/useExhaustiveDependencies: series order/keys are static
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    series.forEach((s, i) => {
      if (plot.series[i + 1]?.show !== visible[s.key])
        plot.setSeries(i + 1, { show: visible[s.key] });
    });
  }, [visible]);

  return (
    <div ref={rootRef} className="relative w-full select-none text-[11px]">
      {overEl &&
        hover &&
        createPortal(<HoverLayer hover={hover} marketplace={marketplace} />, overEl)}
    </div>
  );
}

function HoverLayer({ hover, marketplace }: { hover: HoverState; marketplace: MarketplaceId }) {
  const placed = layoutTooltips(hover.items, TOOLTIP_H, hover.plotHeight);
  const onRight = hover.left + 24 + TOOLTIP_W < hover.plotWidth;
  const boxLeft = onRight ? hover.left + 24 : hover.left - 24 - TOOLTIP_W;

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {placed.map((p) => (
          <line
            key={p.key}
            x1={hover.left}
            y1={p.y}
            x2={onRight ? boxLeft : boxLeft + TOOLTIP_W}
            y2={p.top + TOOLTIP_H / 2}
            // CSS variables only resolve in `style`, not in SVG presentation attributes.
            style={{ stroke: 'var(--color-fg-subtle)' }}
            strokeWidth={1}
          />
        ))}
        {placed
          .filter((p) => p.onScale)
          .map((p) => (
            <circle
              key={`dot-${p.key}`}
              cx={hover.left}
              cy={p.y}
              r={4}
              strokeWidth={2}
              style={{ fill: 'var(--color-surface)', stroke: p.color }}
            />
          ))}
      </svg>
      {placed.map((p) => (
        <div
          key={p.key}
          className="absolute rounded-sm border px-1.5 py-1 leading-tight shadow-sm"
          style={{
            top: p.top,
            left: boxLeft,
            width: TOOLTIP_W,
            height: TOOLTIP_H,
            borderColor: p.color,
            // Opaque: a tint of the series color over the surface, so lines don't show through.
            background: `linear-gradient(${p.color}26, ${p.color}26), var(--color-surface)`,
          }}
        >
          <div className="text-[10px] text-fg-muted">{p.label}</div>
          <div className="text-[12px] font-semibold text-fg">
            {formatPrice(p.value, marketplace)}
          </div>
        </div>
      ))}
      <div
        className="absolute whitespace-nowrap rounded-sm border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] text-fg-2 shadow-sm"
        style={{
          // Below the x-axis labels, like Keepa.
          top: hover.plotHeight + 30,
          left: Math.min(Math.max(hover.left - 60, 0), hover.plotWidth - 120),
        }}
      >
        {formatCursorDate(hover.x, marketplace)}
      </div>
    </div>
  );
}
