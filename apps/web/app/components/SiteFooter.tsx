import { LogoMark } from '@repo/brand';
import { Link } from 'react-router';
import { SITE } from '../site';

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm md:grid-cols-[1fr_auto]">
        <div className="flex max-w-xl flex-col gap-3">
          <span className="flex items-center gap-2 font-bold text-white">
            <LogoMark size={24} />
            {SITE.name}
          </span>
          <p className="text-xs leading-relaxed text-white/65">
            Proyecto independiente de la comunidad. No está afiliado, patrocinado ni respaldado por
            Amazon. Amazon y todas las marcas relacionadas son propiedad de Amazon.com, Inc. o sus
            filiales. Los precios mostrados son observaciones de usuarios y pueden no coincidir con
            el precio actual en Amazon.
          </p>
        </div>
        <nav aria-label="Legal" className="flex flex-col gap-2 md:items-end">
          <Link to="/privacidad" className="hover:text-white hover:underline">
            Aviso de privacidad
          </Link>
          <Link to="/terminos" className="hover:text-white hover:underline">
            Términos de uso
          </Link>
          {SITE.contactEmail && (
            <a href={`mailto:${SITE.contactEmail}`} className="hover:text-white hover:underline">
              Contacto
            </a>
          )}
        </nav>
      </div>
      <div className="bg-ink-deep py-3 text-center text-xs text-white/55">
        © {new Date().getFullYear()} {SITE.name}
      </div>
    </footer>
  );
}
