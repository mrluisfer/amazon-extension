import { BellIcon, LogoMark } from '@repo/brand';

/**
 * Static replica of the extension's in-page panel (apps/extension PanelApp) with
 * sample data. Series colors match lib/chart-series.ts (Keepa conventions); the
 * grey ones use theme tokens so they stay readable in dark mode.
 */

const W = 520;
const H = 210;
const PAD = { top: 10, right: 8, bottom: 22, left: 44 };
const Y_MIN = 900;
const Y_MAX = 1700;

const SERIES = [
  {
    key: 'amazon',
    label: 'Amazon',
    color: '#f39c12',
    fill: 'rgba(243, 156, 18, 0.14)',
    values: [1399, 1399, 1349, 1349, 1299, 1349, 1249, 1249, 1299, 1199, 1249, 1249],
  },
  {
    key: 'new',
    label: 'Caja de compra',
    color: '#e0249a',
    values: [1379, 1349, 1349, 1299, 1279, 1299, 1229, 1199, 1249, 1179, 1199, 1199],
  },
  {
    key: 'used',
    label: 'Usado',
    color: 'var(--color-fg-2)',
    values: [1099, 1099, 1050, 1050, 999, 999, 980, 980, 1020, 960, 980, 975],
  },
  {
    key: 'list',
    label: 'Precio de lista',
    color: 'var(--color-fg-subtle)',
    dash: '6 4',
    values: Array(12).fill(1599) as number[],
  },
] as const;

const x = (i: number, n: number) => PAD.left + (i / (n - 1)) * (W - PAD.left - PAD.right);
const y = (v: number) => PAD.top + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.top - PAD.bottom);

/** Stepped path, like the real chart: a price holds until the next change. */
function stepPath(values: readonly number[]) {
  return values
    .map((v, i) => {
      if (i === 0) return `M${x(0, values.length)} ${y(v)}`;
      return `H${x(i, values.length)} V${y(v)}`;
    })
    .join(' ');
}

const money = (v: number) =>
  v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const RANGES = ['Semana', 'Mes', '3 meses', 'Año', 'Todo'];

export function PanelPreview() {
  const amazon = SERIES[0].values;
  const areaPath = `${stepPath(amazon)} V${y(Y_MIN)} H${x(0, amazon.length)} Z`;
  const buyBox = SERIES[1].values;
  const min = Math.min(...buyBox);
  const max = Math.max(...buyBox);

  return (
    <figure
      className="card overflow-hidden text-left text-xs text-fg shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
      aria-label={`Ejemplo del panel: historial de 3 meses, precio mínimo ${money(min)}, máximo ${money(max)}`}
    >
      <div className="flex flex-col gap-2 p-3" aria-hidden="true">
        <div className="flex items-end border-b border-line">
          <LogoMark size={18} className="mr-1 mb-1.5" />
          <span className="border-b-2 border-brand px-2.5 pb-1 text-sm font-semibold">
            Historial de precios
          </span>
          <span className="px-2.5 pb-1 text-sm text-fg-muted">Ajustes</span>
          <span className="ml-auto hidden pb-1 text-fg-muted sm:inline">
            (última actualización: hace 2 horas)
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-0 flex-1" role="presentation">
            {[1000, 1200, 1400, 1600].map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  style={{ stroke: 'var(--color-line)' }}
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <text
                  x={PAD.left - 6}
                  y={y(v) + 3}
                  textAnchor="end"
                  fontSize="10"
                  style={{ fill: 'var(--color-fg-muted)' }}
                >
                  {money(v)}
                </text>
              </g>
            ))}
            {['ago', 'sep', 'oct'].map((m, i) => (
              <text
                key={m}
                x={PAD.left + 30 + i * 170}
                y={H - 6}
                fontSize="10"
                style={{ fill: 'var(--color-fg-muted)' }}
              >
                {m}
              </text>
            ))}
            <path d={areaPath} fill={SERIES[0].fill} />
            {SERIES.map((s) => (
              <path
                key={s.key}
                d={stepPath(s.values)}
                fill="none"
                style={{ stroke: s.color }}
                strokeWidth={s.key === 'list' ? 1.5 : 2}
                strokeDasharray={'dash' in s ? s.dash : undefined}
                strokeLinejoin="round"
              />
            ))}
            <circle
              cx={x(buyBox.length - 1, buyBox.length)}
              cy={y(buyBox.at(-1) as number)}
              r="4"
              fill="#e0249a"
              style={{ stroke: 'var(--color-surface)' }}
              strokeWidth="2"
            />
          </svg>

          <div className="flex shrink-0 flex-col gap-3 sm:w-44">
            <ul className="flex flex-col gap-1">
              {SERIES.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border-2"
                    style={{ borderColor: s.color, backgroundColor: s.color }}
                  />
                  <span>{s.label}</span>
                  <span className="ml-auto tabular-nums text-fg-2">
                    {money(s.values.at(-1) as number)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="hidden gap-2 sm:flex">
              <span className="pt-0.5 text-fg-muted">Rango</span>
              <ul>
                {RANGES.map((r) => (
                  <li
                    key={r}
                    className={
                      r === '3 meses'
                        ? 'border-l-2 border-brand pl-1.5 font-semibold'
                        : 'border-l-2 border-transparent pl-1.5 text-fg-2'
                    }
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-fg-muted">
              <dt>Mínimo</dt>
              <dd className="tabular-nums text-success">{money(min)}</dd>
              <dt>Máximo</dt>
              <dd className="tabular-nums text-fg">{money(max)}</dd>
            </dl>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-2">
          <BellIcon size={14} className="text-fg-muted" />
          <span className="text-fg-2">Avísame si baja de</span>
          <span className="input w-20 px-2 py-1 text-fg-subtle">$ precio</span>
          <span className="btn btn-primary px-3.5 py-1">Seguir</span>
        </div>
      </div>
    </figure>
  );
}
