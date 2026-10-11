import { BellIcon, CheckIcon, CloseIcon, EyeOffIcon, ShieldIcon, TrendDownIcon } from '@repo/brand';
import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { PanelPreview } from '../components/PanelPreview';
import { StoreButton } from '../components/StoreButton';
import { SITE } from '../site';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [
  { title: `${SITE.name} — ¿De verdad es buen precio?` },
  {
    name: 'description',
    content:
      'Extensión gratuita para Amazon México: historial de precios en cada producto, sin anuncios patrocinados y con tu privacidad primero. Construida por la comunidad.',
  },
  { property: 'og:title', content: SITE.name },
  { property: 'og:description', content: SITE.tagline },
  { property: 'og:type', content: 'website' },
  { property: 'og:locale', content: 'es_MX' },
];

const FEATURES: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  body: string;
  soon?: boolean;
}[] = [
  {
    icon: TrendDownIcon,
    title: 'Historial en cada producto',
    body: 'Una gráfica justo debajo de la ficha del producto: precio de Amazon, caja de compra, usados y precio de lista. Mínimo y máximo del periodo de un vistazo.',
  },
  {
    icon: EyeOffIcon,
    title: 'Sin contenido patrocinado',
    body: 'Oculta los resultados «Patrocinado» en búsquedas y páginas de producto. Se hace en tu navegador; no se envía nada.',
  },
  {
    icon: ShieldIcon,
    title: 'Tu privacidad primero',
    body: 'Sin cuentas, sin cookies, sin historial de navegación. Compartir precios es opcional y anónimo.',
  },
  {
    icon: BellIcon,
    title: 'Avisos de precio',
    body: 'Elige un precio objetivo y te avisamos cuando el producto baje de ahí.',
    soon: true,
  },
];

const STEPS = [
  {
    title: 'Instala la extensión',
    body: 'Gratis, desde Chrome Web Store. Al instalarla te preguntamos si quieres compartir precios; puedes decir que no.',
  },
  {
    title: 'Abre cualquier producto',
    body: 'En amazon.com.mx verás el panel con el historial debajo de la ficha técnica, arriba de Keepa si también lo usas.',
  },
  {
    title: 'Decide con datos',
    body: 'Compara el precio de hoy con el de las últimas semanas antes de comprar. Cada precio compartido mejora el historial para todos.',
  },
];

const SENT = [
  'El identificador del producto (ASIN), su título e imagen',
  'Los precios mostrados y la disponibilidad',
  'La fecha y hora de la observación',
];
const NEVER = [
  'Tu historial de navegación',
  'Datos de tu cuenta de Amazon o tus compras',
  'Cookies o información personal',
];

const FAQ = [
  {
    q: '¿Es gratis?',
    a: 'Sí. La extensión es gratuita y no muestra publicidad.',
  },
  {
    q: '¿Está relacionada con Amazon?',
    a: 'No. Es un proyecto independiente de la comunidad, sin afiliación, patrocinio ni respaldo de Amazon.',
  },
  {
    q: '¿Por qué un producto no tiene historial?',
    a: 'El historial se construye con los precios que comparten los usuarios. Si nadie ha visto ese producto todavía, empezará a llenarse en cuanto alguien lo visite con la extensión.',
  },
  {
    q: '¿Tengo que compartir precios para usarla?',
    a: 'No. Puedes ver el historial sin compartir nada. Para mostrar la gráfica, la extensión solo consulta a nuestro servidor el ASIN del producto que estás viendo.',
  },
  {
    q: '¿Funciona junto a Keepa u otras extensiones?',
    a: 'Sí. El panel se coloca en el mismo lugar que Keepa, justo arriba, para que ambos se lean como un solo bloque.',
  },
  {
    q: '¿En qué países funciona?',
    a: 'Por ahora solo en Amazon México (amazon.com.mx). Otros países vendrán después.',
  },
  {
    q: '¿Cómo borro mis datos?',
    a: 'En los ajustes de la extensión, «Borrar mis datos» elimina tu identificador anónimo y tu lista de seguimiento de nuestros servidores.',
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero — continues the ink header, like Amazon's top bar into its hero banners. */}
      <section className="relative overflow-hidden bg-ink-deep text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(255,153,0,0.22),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-20 lg:grid-cols-[1fr_1.15fr] lg:pt-20 lg:pb-28">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              Para Amazon México · Gratis
            </span>
            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
              ¿De verdad es <span className="text-brand">buen precio</span>? Míralo antes de
              comprar.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/80">
              El historial de precios de cada producto, directo en la página de Amazon. Sin anuncios
              patrocinados y sin pedirte datos personales. Lo construimos entre todos.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <StoreButton />
              <a
                href="#como-funciona"
                className="btn px-5 py-3 text-base text-white hover:bg-white/10"
              >
                Cómo funciona
              </a>
            </div>
          </div>
          <div className="lg:-mr-10">
            <PanelPreview />
          </div>
        </div>
      </section>

      <section id="funciones" className="scroll-mt-16 bg-canvas">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight">
            Todo lo que necesitas para no pagar de más
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body, soon }) => (
              <li key={title} className="card flex flex-col gap-3 p-5 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-brand">
                  <Icon size={20} />
                </span>
                <h3 className="flex flex-wrap items-center gap-2 text-base font-bold">
                  {title}
                  {soon && (
                    <span className="rounded-full bg-notice px-2 py-0.5 text-[11px] font-medium text-fg-2 ring-1 ring-notice-line">
                      Próximamente
                    </span>
                  )}
                </h3>
                <p className="text-sm leading-relaxed text-fg-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Cómo funciona</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-highlight text-sm font-bold text-ink-deep">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="leading-relaxed text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Tú decides si compartes</h2>
            <p className="leading-relaxed text-fg-muted">
              El historial existe porque los usuarios comparten los precios que ven. Es opcional,
              anónimo y puedes cambiar de opinión cuando quieras. Los datos se asocian a un
              identificador aleatorio de tu instalación, nunca a tu identidad.
            </p>
            <Link to="/privacidad" className="link self-start font-medium">
              Lee el aviso de privacidad completo
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5 shadow-card">
              <h3 className="mb-3 font-bold">Si aceptas, enviamos</h3>
              <ul className="flex flex-col gap-2 text-sm">
                {SENT.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckIcon size={16} className="mt-0.5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5 shadow-card">
              <h3 className="mb-3 font-bold">Nunca enviamos</h3>
              <ul className="flex flex-col gap-2 text-sm">
                {NEVER.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CloseIcon size={16} className="mt-0.5 shrink-0 text-danger" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="preguntas" className="scroll-mt-16">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
          <div className="mt-8 flex flex-col divide-y divide-line border-y border-line">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold marker:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="text-xl leading-none text-fg-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 leading-relaxed text-fg-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tu próxima compra, con contexto.</h2>
            <p className="mt-1 text-white/75">Gratis, sin cuentas y sin anuncios.</p>
          </div>
          <StoreButton />
        </div>
      </section>
    </main>
  );
}
