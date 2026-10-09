import { formatPrice, type MarketplaceId, type OfferType } from '@repo/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import {
  formatAxisDate,
  formatAxisPrice,
  formatCursorDate,
  layoutTooltips,
} from '@/lib/chart-format';
import { SERIES } from '@/lib/chart-series';

export type XWindow = { min: number; max: number };

interface Props {
  data: uPlot.AlignedData;
  marketplace: MarketplaceId;
  visible: Record<OfferType, boolean>;
  /** Controlled x window (seconds) from the range selector. */
  window: XWindow | null;
  /** Drag-to-zoom selected a window. */
  onZoom: (window: XWindow) => void;
  /** Double click: back to the selected range. */
  onResetZoom: () => void;
  /** Hovered data index (null when the cursor leaves). */
  onHover: (idx: number | null) => void;
  height?: number;
}

interface HoverState {
  idx: number;
  left: number;
  plotWidth: number;
  plotHeight: number;
  items: { key: OfferType; label: string; color: string; value: number; y: number }[];
}

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
  height = 300,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const [overEl, setOverEl] = useState<HTMLElement | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  // Latest callbacks without re-creating the plot.
  const cb = useRef({ onZoom, onResetZoom, onHover, visible });
  cb.current = { onZoom, onResetZoom, onHover, visible };

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
          range: (_u, min, max) => {
            const pad = Math.max((max - min) * 0.08, max * 0.02, 100);
            return [Math.max(0, min - pad), max + pad];
          },
        },
      },
      series: [
        {},
        ...SERIES.map((s) => ({
          label: s.label,
          stroke: s.color,
          fill: s.fill,
          width: 2,
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
          stroke: '#6b7280',
          grid: { stroke: '#eef0f3' },
          ticks: { stroke: '#e5e7eb' },
          values: (_u, splits) => splits.map((s) => formatAxisDate(s, marketplace)),
        },
        {
          stroke: '#6b7280',
          grid: { stroke: '#eef0f3' },
          ticks: { stroke: '#e5e7eb' },
          size: 70,
          values: (_u, splits) => splits.map((s) => formatAxisPrice(s, marketplace)),
        },
      ],
      cursor: {
        y: false,
        // We own the x scale (controlled `window`); a drag only reports the selection.
        drag: { x: true, y: false, setScale: false },
        points: { size: 8, width: 2, fill: '#fff' },
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
            const idx = u.cursor.idx;
            cb.current.onHover(idx ?? null);
            if (idx == null || u.cursor.left == null || u.cursor.left < 0) {
              setHover(null);
              return;
            }
            const xs = u.data[0];
            const items: HoverState['items'] = [];
            SERIES.forEach((s, i) => {
              const v = u.data[i + 1]?.[idx];
              if (v == null || !u.series[i + 1]?.show) return;
              items.push({
                key: s.key,
                label: s.label,
                color: s.color,
                value: v,
                y: u.valToPos(v, 'y'),
              });
            });
            setHover({
              idx,
              left: u.valToPos(xs[idx] ?? 0, 'x'),
              plotWidth: u.over.clientWidth,
              plotHeight: u.over.clientHeight,
              items,
            });
          },
        ],
      },
    };

    const plot = new uPlot(opts, data, el);
    plotRef.current = plot;
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
  }, [data, marketplace, height]);

  // Controlled x window (range buttons / reset).
  useEffect(() => {
    const plot = plotRef.current;
    const xs = data[0];
    if (!plot || xs.length === 0) return;
    plot.setScale('x', window ?? { min: xs[0] as number, max: xs.at(-1) as number });
  }, [window, data]);

  // Series visibility (legend toggles).
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    SERIES.forEach((s, i) => {
      if (plot.series[i + 1]?.show !== visible[s.key])
        plot.setSeries(i + 1, { show: visible[s.key] });
    });
  }, [visible]);

  return (
    <div ref={rootRef} className="relative w-full select-none text-[11px]">
      {overEl &&
        hover &&
        createPortal(<HoverLayer hover={hover} data={data} marketplace={marketplace} />, overEl)}
    </div>
  );
}

function HoverLayer({
  hover,
  data,
  marketplace,
}: {
  hover: HoverState;
  data: uPlot.AlignedData;
  marketplace: MarketplaceId;
}) {
  const placed = layoutTooltips(hover.items, TOOLTIP_H, hover.plotHeight);
  const onRight = hover.left + 24 + TOOLTIP_W < hover.plotWidth;
  const boxLeft = onRight ? hover.left + 24 : hover.left - 24 - TOOLTIP_W;
  const ts = data[0][hover.idx] ?? 0;

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
            stroke="#9ca3af"
            strokeWidth={1}
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
            // Opaque: a light tint of the series color over white, so lines don't show through.
            background: `linear-gradient(${p.color}1f, ${p.color}1f), #fff`,
          }}
        >
          <div className="text-[10px] text-gray-600">{p.label}</div>
          <div className="text-[12px] font-semibold text-gray-900">
            {formatPrice(p.value, marketplace)}
          </div>
        </div>
      ))}
      <div
        className="absolute whitespace-nowrap rounded-sm border border-gray-300 bg-white px-1.5 py-0.5 text-[11px] text-gray-800 shadow-sm"
        style={{
          // Below the x-axis labels, like Keepa.
          top: hover.plotHeight + 30,
          left: Math.min(Math.max(hover.left - 60, 0), hover.plotWidth - 120),
        }}
      >
        {formatCursorDate(ts, marketplace)}
      </div>
    </div>
  );
}
