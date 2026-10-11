import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import './app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#131921" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col font-sans text-fg antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-3xl font-bold">{notFound ? 'Página no encontrada' : 'Algo salió mal'}</h1>
      <p className="text-fg-muted">
        {notFound
          ? 'La página que buscas no existe o cambió de dirección.'
          : 'Ocurrió un error inesperado. Intenta recargar la página.'}
      </p>
      <a href="/" className="btn btn-primary">
        Ir al inicio
      </a>
    </main>
  );
}
