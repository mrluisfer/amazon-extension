import { AsinSchema, formatPrice, type MarketplaceId, MarketplaceIdSchema } from '@repo/shared';
import { useMemo, useState } from 'react';
import * as v from 'valibot';
import { PriceAlert } from '@/components/PriceAlert';
import { PriceChart, SERIES_META } from '@/components/PriceChart';
import { alignSeries, decodeAll, statsFor } from '@/lib/chart-data';
import { sendMessage } from '@/lib/messaging';
import { useAsync } from '@/lib/use-async';

const RANGES = [
  { days: 30, label: '1M' },
  { days: 90, label: '3M' },
  { days: 365, label: '1A' },
  { days: 3650, label: 'Todo' },
] as const;

const ParamsSchema = v.object({ m: MarketplaceIdSchema, asin: AsinSchema });

function readParams(): { marketplace: MarketplaceId; asin: string } | null {
  const raw = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
  const parsed = v.safeParse(ParamsSchema, raw);
  return parsed.success ? { marketplace: parsed.output.m, asin: parsed.output.asin } : null;
}

export function PanelApp() {
  const params = useMemo(readParams, []);
  if (!params) return <p className="p-4 text-sm text-red-700">Producto no válido.</p>;
  return <Panel {...params} />;
}

function Panel({ marketplace, asin }: { marketplace: MarketplaceId; asin: string }) {
  const [days, setDays] = useState<number>(365);
  const [state, reload] = useAsync(
    () => sendMessage('history:get', { marketplace, asin, days }),
    [marketplace, asin, days],
  );

  const view = useMemo(() => {
    if (state.status !== 'success') return null;
    const decoded = decodeAll(state.data.series);
    return {
      aligned: alignSeries(decoded),
      stats: SERIES_META.map((s) => ({ ...s, ...statsFor(decoded[s.key]) })),
    };
  }, [state]);

  const hasData = (view?.aligned[0].length ?? 0) > 0;

  return (
    <div className="flex h-screen flex-col gap-2 rounded-lg border border-gray-200 p-3 font-sans">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Historial de precios</h2>
        <fieldset className="m-0 flex gap-1 border-0 p-0">
          <legend className="sr-only">Rango</legend>
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className="rounded px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100 aria-pressed:bg-gray-900 aria-pressed:text-white"
            >
              {r.label}
            </button>
          ))}
        </fieldset>
      </header>

      {state.status === 'loading' && <Skeleton />}

      {state.status === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-gray-600">
          <p>No pudimos cargar el historial.</p>
          <button
            type="button"
            onClick={reload}
            className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === 'success' && view && !hasData && (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-gray-600">
          Aún no hay historial para este producto. Se construye con los precios que la comunidad
          comparte.
        </div>
      )}

      {state.status === 'success' && view && hasData && (
        <>
          <PriceChart data={view.aligned} marketplace={marketplace} />
          <dl className="grid grid-cols-3 gap-2 text-xs">
            {view.stats.map((s) => (
              <div key={s.key} className="rounded bg-gray-50 p-2">
                <dt className="font-medium" style={{ color: s.color }}>
                  {s.label}
                </dt>
                <dd className="text-gray-700">
                  Actual: {s.current == null ? '—' : formatPrice(s.current, marketplace)}
                  <br />
                  Mín: {s.min == null ? '—' : formatPrice(s.min, marketplace)} · Máx:{' '}
                  {s.max == null ? '—' : formatPrice(s.max, marketplace)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <PriceAlert marketplace={marketplace} asin={asin} />
    </div>
  );
}

function Skeleton() {
  return <div className="h-60 w-full animate-pulse rounded bg-gray-100" />;
}
