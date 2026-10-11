import { CheckIcon, EyeOffIcon, Logo, TrashIcon, UsersIcon } from '@repo/brand';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import { HideSponsoredToggle } from '@/components/HideSponsoredToggle';
import { sendMessage } from '@/lib/messaging';
import { type Consent, consentItem } from '@/lib/storage';

const CONSENT_BADGE: Record<Consent, { label: string; className: string }> = {
  granted: { label: 'Activado', className: 'bg-success/10 text-success' },
  denied: { label: 'Desactivado', className: 'bg-surface-3 text-fg-muted' },
  unknown: { label: 'Pendiente', className: 'bg-notice text-fg-2 ring-1 ring-notice-line' },
};

function Section({
  icon: Icon,
  title,
  badge,
  tone = 'default',
  children,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  badge?: ReactNode;
  tone?: 'default' | 'danger';
  children: ReactNode;
}) {
  return (
    <section
      className={`card flex flex-col gap-3 p-5 shadow-card ${tone === 'danger' ? 'border-danger/30' : ''}`}
    >
      <header className="flex items-center gap-2.5">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
            tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-surface-3 text-fg-2'
          }`}
        >
          <Icon size={16} />
        </span>
        <h2 className="text-base font-bold">{title}</h2>
        {badge && <span className="ml-auto">{badge}</span>}
      </header>
      {children}
    </section>
  );
}

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

  const badge = consent && CONSENT_BADGE[consent];

  return (
    <div className="min-h-screen bg-canvas font-sans text-sm leading-relaxed text-fg">
      <header className="bg-ink-deep text-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-6 text-base">
          <Logo size={30} />
        </div>
        <div className="bg-ink">
          <p className="mx-auto max-w-2xl px-6 py-1.5 text-xs text-white/80">
            Ajustes · Privacidad y datos
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-6">
        <Section
          icon={UsersIcon}
          title="Compartir precios con la comunidad"
          badge={
            badge && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            )
          }
        >
          <p>
            El historial se construye con los precios que ven los usuarios. Si aceptas, cuando abras
            una página de producto en Amazon México la extensión enviará{' '}
            <strong>de forma anónima</strong>:
          </p>
          <ul className="list-disc pl-6 marker:text-brand">
            <li>El identificador del producto (ASIN), su título e imagen.</li>
            <li>
              Los precios mostrados (nuevo, usado, vendido por Amazon), el precio de lista y la
              disponibilidad.
            </li>
            <li>La fecha y hora de la observación.</li>
          </ul>
          <p>
            <strong>Nunca</strong> enviamos tu historial de navegación, páginas fuera de los
            productos de Amazon, datos de tu cuenta de Amazon, cookies ni información personal. Los
            datos se asocian a un identificador aleatorio de esta instalación, no a tu identidad.
          </p>
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-fg-muted">
            Para mostrar la gráfica, la extensión consulta a nuestro servidor el ASIN del producto
            que estás viendo, aunque no compartas precios.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => void consentItem.setValue('granted')}
              aria-pressed={consent === 'granted'}
              className={
                consent === 'granted'
                  ? 'btn btn-secondary border-success text-success'
                  : 'btn btn-primary'
              }
            >
              {consent === 'granted' && <CheckIcon />}
              {consent === 'granted' ? 'Compartiendo' : 'Aceptar y compartir'}
            </button>
            <button
              type="button"
              onClick={() => void consentItem.setValue('denied')}
              aria-pressed={consent === 'denied'}
              className="btn btn-secondary"
            >
              {consent === 'denied' && <CheckIcon />}
              {consent === 'denied' ? 'No compartir' : 'No, gracias'}
            </button>
          </div>
          <p className="text-xs text-fg-muted">
            Puedes cambiar esta decisión en cualquier momento.
          </p>
        </Section>

        <Section icon={EyeOffIcon} title="Anuncios">
          <HideSponsoredToggle description />
        </Section>

        <Section icon={TrashIcon} title="Borrar mis datos" tone="danger">
          <p>Elimina tu lista de seguimiento y tu identificador anónimo de nuestros servidores.</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void deleteData()}
              disabled={deleteState === 'working'}
              className="btn btn-danger"
            >
              Borrar mis datos
            </button>
            <span aria-live="polite" className="text-xs text-fg-muted">
              {deleteState === 'done' && 'Datos eliminados.'}
              {deleteState === 'error' && 'No se pudo completar. Inténtalo más tarde.'}
            </span>
          </div>
        </Section>

        <footer className="px-1 pt-2 text-xs text-fg-subtle">
          Historial de Precios MX es un proyecto independiente de la comunidad. No está afiliado,
          patrocinado ni respaldado por Amazon. Amazon es una marca registrada de Amazon.com, Inc.
        </footer>
      </main>
    </div>
  );
}
