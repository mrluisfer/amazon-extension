import { canonicalProductUrl } from '@repo/amazon-parser';
import { formatPrice, MARKETPLACES } from '@repo/shared';
import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { HideSponsoredToggle } from '@/components/HideSponsoredToggle';
import { sendMessage } from '@/lib/messaging';
import { type Consent, consentItem } from '@/lib/storage';
import { useAsync } from '@/lib/use-async';

export function PopupApp() {
  const [consent, setConsent] = useState<Consent | null>(null);
  // Alerts are tied to a registered account: only load the list when there is one.
  const [tracked, reload] = useAsync(async () => {
    const { hasAccount } = await sendMessage('account:status', {});
    return hasAccount
      ? { hasAccount, items: await sendMessage('tracked:list', {}) }
      : { hasAccount, items: [] };
  }, []);

  useEffect(() => {
    void consentItem.getValue().then(setConsent);
    return consentItem.watch(setConsent);
  }, []);

  const remove = async (id: string) => {
    await sendMessage('tracked:remove', { id });
    reload();
  };

  return (
    <main className="flex flex-col gap-3 p-4 font-sans text-sm">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold">Historial de Precios MX</h1>
        <button
          type="button"
          onClick={() => void browser.runtime.openOptionsPage()}
          className="text-xs text-gray-600 underline"
        >
          Ajustes
        </button>
      </header>

      {consent === 'unknown' && (
        <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">
          Ayuda a construir el historial compartiendo precios de forma anónima.{' '}
          <button
            type="button"
            onClick={() => void browser.runtime.openOptionsPage()}
            className="underline"
          >
            Más información
          </button>
        </p>
      )}

      <section className="rounded border border-gray-200 p-2 text-xs">
        <HideSponsoredToggle />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Siguiendo
        </h2>
        {tracked.status === 'loading' && <p className="text-gray-500">Cargando…</p>}
        {tracked.status === 'error' && <p className="text-red-700">No se pudo cargar la lista.</p>}
        {tracked.status === 'success' && !tracked.data.hasAccount && (
          <p className="text-gray-500">Inicia sesión para crear avisos de precio y verlos aquí.</p>
        )}
        {tracked.status === 'success' &&
          tracked.data.hasAccount &&
          tracked.data.items.length === 0 && (
            <p className="text-gray-500">Abre un producto en Amazon y crea un aviso de precio.</p>
          )}
        {tracked.status === 'success' && tracked.data.items.length > 0 && (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {tracked.data.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-10 w-10 object-contain" />
                )}
                <a
                  href={canonicalProductUrl(MARKETPLACES[item.marketplace], item.asin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 flex-1 hover:underline"
                >
                  {item.title ?? item.asin}
                </a>
                {item.targetPriceCents != null && (
                  <span className="text-xs text-gray-600">
                    {formatPrice(item.targetPriceCents, item.marketplace)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void remove(item.id)}
                  aria-label="Dejar de seguir"
                  className="text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
