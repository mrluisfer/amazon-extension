import { Logo } from '@repo/brand';
import { Link, NavLink } from 'react-router';
import { StoreButton } from './StoreButton';

const NAV = [
  { to: '/#funciones', label: 'Funciones' },
  { to: '/#como-funciona', label: 'Cómo funciona' },
  { to: '/#preguntas', label: 'Preguntas' },
  { to: '/privacidad', label: 'Privacidad' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-ink-deep text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/" aria-label="Historial de Precios MX, inicio" className="text-[17px]">
          <Logo size={32} />
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="rounded px-3 py-1.5 text-sm text-white/85 outline-offset-2 hover:text-white hover:outline hover:outline-1 hover:outline-white/70"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <span className="hidden sm:ml-auto sm:block md:ml-2">
          <StoreButton size="sm" />
        </span>

        {/* Mobile: native <details> menu — works before (and without) hydration. */}
        <details className="group relative ml-auto md:hidden sm:ml-0">
          <summary
            aria-label="Menú"
            className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full hover:bg-white/10 marker:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
              <path d="M6 6l12 12M18 6 6 18" className="hidden group-open:block" />
            </svg>
          </summary>
          <nav
            aria-label="Principal"
            className="absolute right-0 mt-2 flex w-56 flex-col rounded-lg bg-ink py-2 shadow-xl ring-1 ring-ink-line"
          >
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="px-4 py-2.5 text-sm hover:bg-white/10">
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
