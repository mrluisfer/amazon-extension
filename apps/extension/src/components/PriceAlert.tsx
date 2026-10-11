import { BellIcon } from '@repo/brand';
import { formatPrice, type MarketplaceId } from '@repo/shared';
import { useState } from 'react';
import { sendMessage } from '@/lib/messaging';
import { centsToInput, parseTargetPrice } from '@/lib/price-input';
import { useAsync } from '@/lib/use-async';

interface Props {
  marketplace: MarketplaceId;
  asin: string;
}

/**
 * "Avísame si baja de…" for the current product. States:
 * - no account → invitation to sign in (alerts are tied to a person)
 * - no alert   → form; submitting requires a valid target price
 * - has alert  → shows it, with "Cambiar" / "Dejar de seguir" (never a duplicate)
 */
export function PriceAlert({ marketplace, asin }: Props) {
  const [status, reload] = useAsync(
    () => sendMessage('tracked:status', { marketplace, asin }),
    [marketplace, asin],
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      setEditing(false);
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      reload(); // always re-sync: e.g. another tab created the alert meanwhile
    }
  };

  let content: React.ReactNode = null;
  if (status.status === 'loading') {
    content = <div className="h-6 w-56 animate-pulse rounded bg-surface-3" />;
  } else if (status.status === 'error') {
    content = <span className="text-fg-muted">Avisos de precio no disponibles por ahora.</span>;
  } else if (!status.data.hasAccount) {
    content = (
      <span className="flex items-center gap-1.5 text-fg-muted">
        <BellIcon size={14} className="shrink-0" />
        Inicia sesión para recibir un aviso cuando este producto baje de precio.
      </span>
    );
  } else if (status.data.item && !editing) {
    const item = status.data.item;
    content = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 text-fg-2">
          <BellIcon size={14} className="shrink-0 text-brand" />
          Te avisaremos si baja de{' '}
          <strong>
            {item.targetPriceCents != null ? formatPrice(item.targetPriceCents, marketplace) : '—'}
          </strong>
        </span>
        <button type="button" onClick={() => setEditing(true)} className="link">
          Cambiar
        </button>
        <button
          type="button"
          onClick={() => void run(() => sendMessage('tracked:remove', { id: item.id }))}
          className="text-fg-muted hover:text-danger"
        >
          Dejar de seguir
        </button>
      </div>
    );
  } else {
    const item = status.data.item;
    content = (
      <PriceForm
        initialCents={item?.targetPriceCents ?? null}
        submitLabel={item ? 'Guardar' : 'Seguir'}
        onCancel={item ? () => setEditing(false) : undefined}
        onSubmit={(targetPriceCents) =>
          run(() =>
            item
              ? sendMessage('tracked:update', { id: item.id, targetPriceCents })
              : sendMessage('tracked:add', { marketplace, asin, targetPriceCents }),
          )
        }
      />
    );
  }

  return (
    <div className="mt-auto flex min-h-9 flex-wrap items-center gap-2 border-t border-line pt-2 text-xs">
      {content}
      <span aria-live="polite" className="text-danger">
        {error}
      </span>
    </div>
  );
}

function PriceForm({
  initialCents,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialCents: number | null;
  submitLabel: string;
  onSubmit: (cents: number) => Promise<void>;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initialCents != null ? centsToInput(initialCents) : '');
  const [saving, setSaving] = useState(false);
  const cents = parseTargetPrice(value);
  const invalid = value.trim() !== '' && cents === null;

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (cents === null || saving) return;
        setSaving(true);
        await onSubmit(cents);
        setSaving(false);
      }}
    >
      <label htmlFor="target" className="flex items-center gap-1.5 text-fg-2">
        <BellIcon size={14} className="shrink-0 text-fg-muted" />
        Avísame si baja de
      </label>
      <input
        id="target"
        inputMode="decimal"
        placeholder="$ precio"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d.,$\s]/g, ''))}
        aria-invalid={invalid}
        className="input w-24 px-2 py-1"
      />
      <button
        type="submit"
        disabled={cents === null || saving}
        title={cents === null ? 'Escribe el precio al que quieres que te avisemos' : undefined}
        className="btn btn-primary px-3.5 py-1"
      >
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="link">
          Cancelar
        </button>
      )}
      {invalid && <span className="text-danger">Precio no válido</span>}
    </form>
  );
}
