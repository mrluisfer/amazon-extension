import { canonicalProductUrl } from '@repo/amazon-parser';
import { BellIcon, CloseIcon, InfoIcon, Logo, SlidersIcon } from '@repo/brand';
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
    <div className="font-sans text-sm text-fg">
      <header className="flex items-center justify-between bg-ink-deep px-4 py-2.5 text-white">
        <Logo size={24} />
        <button
          type="button"
          onClick={() => void browser.runtime.openOptionsPage()}
          aria-label="Ajustes"
          title="Ajustes"
          className="grid h-8 w-8 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white focus-visible:shadow-focus focus-visible:outline-none"
        >
          <SlidersIcon />
        </button>
      </header>

      <main className="flex flex-col gap-3 p-4">
        {consent === 'unknown' && (
          <p className="flex gap-2 rounded-lg border border-notice-line bg-notice p-2.5 text-xs">
            <InfoIcon size={14} className="mt-px shrink-0 text-fg-muted" />
            <span>
              Ayuda a construir el historial compartiendo precios de forma anónima.{' '}
              <button
                type="button"
                onClick={() => void browser.runtime.openOptionsPage()}
                className="link"
              >
                Más información
              </button>
            </span>
          </p>
        )}

        <section className="card p-3 text-xs">
          <HideSponsoredToggle />
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-fg-2">
            <BellIcon size={14} className="text-fg-muted" />
            Siguiendo
          </h2>
          {tracked.status === 'loading' && <p className="text-fg-muted">Cargando…</p>}
          {tracked.status === 'error' && <p className="text-danger">No se pudo cargar la lista.</p>}
          {tracked.status === 'success' && !tracked.data.hasAccount && (
            <p className="text-fg-muted">
              Inicia sesión para crear avisos de precio y verlos aquí.
            </p>
          )}
          {tracked.status === 'success' &&
            tracked.data.hasAccount &&
            tracked.data.items.length === 0 && (
              <p className="text-fg-muted">Abre un producto en Amazon y crea un aviso de precio.</p>
            )}
          {tracked.status === 'success' && tracked.data.items.length > 0 && (
            <ul className="card flex max-h-80 flex-col divide-y divide-line overflow-y-auto">
              {tracked.data.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 p-2">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded bg-white object-contain"
                    />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <a
                      href={canonicalProductUrl(MARKETPLACES[item.marketplace], item.asin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link line-clamp-2"
                    >
                      {item.title ?? item.asin}
                    </a>
                    {item.targetPriceCents != null && (
                      <span className="text-xs text-fg-muted">
                        Aviso si baja de{' '}
                        <strong className="text-fg">
                          {formatPrice(item.targetPriceCents, item.marketplace)}
                        </strong>
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    aria-label="Dejar de seguir"
                    title="Dejar de seguir"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-fg-subtle hover:bg-surface-3 hover:text-danger"
                  >
                    <CloseIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
