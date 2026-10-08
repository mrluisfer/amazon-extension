import { useEffect, useState } from 'react';
import { HideSponsoredToggle } from '@/components/HideSponsoredToggle';
import { sendMessage } from '@/lib/messaging';
import { type Consent, consentItem } from '@/lib/storage';

/**
 * Prominent disclosure + explicit opt-in, as required by the Chrome Web Store
 * User Data Policy before collecting any data. Keep this text in sync with the
 * privacy policy and the store listing.
 */
export function OptionsApp() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [deleteState, setDeleteState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  useEffect(() => {
    void consentItem.getValue().then(setConsent);
    return consentItem.watch(setConsent);
  }, []);

  const deleteData = async () => {
    setDeleteState('working');
    try {
      await sendMessage('account:delete', {});
      await consentItem.setValue('denied');
      setDeleteState('done');
    } catch {
      setDeleteState('error');
    }
  };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8 font-sans text-sm leading-relaxed">
      <h1 className="text-xl font-semibold">Historial de Precios MX</h1>

      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-5">
        <h2 className="text-base font-semibold">Compartir precios con la comunidad</h2>
        <p>
          El historial se construye con los precios que ven los usuarios. Si aceptas, cuando abras
          una página de producto en Amazon México la extensión enviará{' '}
          <strong>de forma anónima</strong>:
        </p>
        <ul className="list-disc pl-6">
          <li>El identificador del producto (ASIN), su título e imagen.</li>
          <li>
            Los precios mostrados (nuevo, usado, vendido por Amazon), el precio de lista y la
            disponibilidad.
          </li>
          <li>La fecha y hora de la observación.</li>
        </ul>
        <p>
          <strong>Nunca</strong> enviamos tu historial de navegación, páginas fuera de los productos
          de Amazon, datos de tu cuenta de Amazon, cookies ni información personal. Los datos se
          asocian a un identificador aleatorio de esta instalación, no a tu identidad.
        </p>
        <p className="text-gray-600">
          Para mostrar la gráfica, la extensión consulta a nuestro servidor el ASIN del producto que
          estás viendo, aunque no compartas precios.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void consentItem.setValue('granted')}
            aria-pressed={consent === 'granted'}
            className="rounded bg-gray-900 px-4 py-2 font-medium text-white aria-pressed:bg-green-700"
          >
            {consent === 'granted' ? 'Compartiendo ✓' : 'Aceptar y compartir'}
          </button>
          <button
            type="button"
            onClick={() => void consentItem.setValue('denied')}
            aria-pressed={consent === 'denied'}
            className="rounded border border-gray-300 px-4 py-2 aria-pressed:bg-gray-100"
          >
            {consent === 'denied' ? 'No compartir ✓' : 'No, gracias'}
          </button>
        </div>
        <p className="text-xs text-gray-500">Puedes cambiar esta decisión en cualquier momento.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-5">
        <h2 className="text-base font-semibold">Anuncios</h2>
        <HideSponsoredToggle description />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-red-200 p-5">
        <h2 className="text-base font-semibold">Borrar mis datos</h2>
        <p>Elimina tu lista de seguimiento y tu identificador anónimo de nuestros servidores.</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void deleteData()}
            disabled={deleteState === 'working'}
            className="rounded border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Borrar mis datos
          </button>
          <span aria-live="polite" className="text-xs text-gray-600">
            {deleteState === 'done' && 'Datos eliminados.'}
            {deleteState === 'error' && 'No se pudo completar. Inténtalo más tarde.'}
          </span>
        </div>
      </section>
    </main>
  );
}
