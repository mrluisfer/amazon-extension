import { formatPrice, type MarketplaceId } from '@repo/shared';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

export const SERIES_META = [
  { key: 'amazon', label: 'Amazon', color: '#e8710a' },
  { key: 'new', label: 'Nuevo', color: '#2563eb' },
  { key: 'used', label: 'Usado', color: '#6b7280' },
] as const;

interface Props {
  data: uPlot.AlignedData;
  marketplace: MarketplaceId;
  height?: number;
}

/**
 * uPlot on canvas: handles years of points cheaply. Step paths because a price
 * holds until it changes. Re-created only when data/marketplace change.
 */
export function PriceChart({ data, marketplace, height = 240 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (v: number | null | undefined) => (v == null ? '—' : formatPrice(v, marketplace));

    const opts: uPlot.Options = {
      width: el.clientWidth,
      height,
      scales: { x: { time: true } },
      series: [
        {},
        ...SERIES_META.map((s) => ({
          label: s.label,
          stroke: s.color,
          width: 2,
          spanGaps: false,
          paths: uPlot.paths.stepped?.({ align: 1 }),
          value: (_u: uPlot, v: number | null) => fmt(v),
        })),
      ],
      axes: [
        { stroke: '#6b7280', grid: { stroke: '#f3f4f6' } },
        {
          stroke: '#6b7280',
          grid: { stroke: '#f3f4f6' },
          size: 84,
          values: (_u, ticks) => ticks.map((t) => fmt(t)),
        },
      ],
      cursor: { drag: { x: true, y: false } },
      legend: { live: true },
    };

    const plot = new uPlot(opts, data, el);
    const ro = new ResizeObserver(() => plot.setSize({ width: el.clientWidth, height }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      plot.destroy();
    };
  }, [data, marketplace, height]);

  return <div ref={ref} className="w-full text-xs" />;
}
