import { browser } from 'wxt/browser';
import { HideSponsoredToggle } from '@/components/HideSponsoredToggle';
import type { ThemePref } from '@/lib/storage';
import type { Theme } from '@/lib/theme';

const OPTIONS: { value: ThemePref; label: string; hint: string }[] = [
  { value: 'system', label: 'Sistema', hint: 'Igual que tu computadora' },
  { value: 'light', label: 'Claro', hint: 'Siempre claro' },
  { value: 'dark', label: 'Oscuro', hint: 'Siempre oscuro' },
];

/** Mini preview of the chart in each theme (static colors on purpose). */
function Preview({ value }: { value: ThemePref }) {
  const light = { bg: '#ffffff', line: '#e0249a', grid: '#eef0f0' };
  const dark = { bg: '#131921', line: '#f0479f', grid: '#1f2a37' };
  const chart = (c: typeof light, clip?: string) => (
    <svg
      viewBox="0 0 64 36"
      className="absolute inset-0 h-full w-full"
      style={{ clipPath: clip }}
      aria-hidden="true"
    >
      <rect width="64" height="36" fill={c.bg} />
      <path d="M0 12H64M0 24H64" stroke={c.grid} strokeWidth="1" />
      <path d="M4 26H14V20H26V24H36V12H48V16H60" fill="none" stroke={c.line} strokeWidth="2" />
    </svg>
  );
  return (
    <span className="relative block h-9 w-16 overflow-hidden rounded border border-line">
      {value === 'dark' ? chart(dark) : chart(light)}
      {value === 'system' && chart(dark, 'polygon(100% 0, 100% 100%, 0 100%)')}
    </span>
  );
}

interface Props {
  pref: ThemePref;
  resolved: Theme;
  onChange: (pref: ThemePref) => void;
}

export function SettingsPanel({ pref, resolved, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4 py-1">
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 text-sm font-semibold text-fg">Tema</legend>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 hover:bg-surface-2 has-checked:border-brand has-checked:bg-surface-2"
            >
              <input
                type="radio"
                name="theme"
                value={o.value}
                checked={pref === o.value}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <Preview value={o.value} />
              <span className="flex flex-col">
                <span className="font-medium text-fg">{o.label}</span>
                <span className="text-[11px] text-fg-muted">
                  {o.value === 'system'
                    ? `Ahora: ${resolved === 'dark' ? 'oscuro' : 'claro'}`
                    : o.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-fg-muted">
          Amazon no tiene modo oscuro; esto solo cambia el panel y las ventanas de la extensión.
        </p>
      </fieldset>

      <div className="card max-w-md p-3">
        <HideSponsoredToggle description />
      </div>

      <button
        type="button"
        onClick={() => void browser.runtime.openOptionsPage()}
        className="link self-start"
      >
        Más ajustes (privacidad y datos)
      </button>
    </div>
  );
}
