import { SITE } from '../site';

interface Props {
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * "Agregar a Chrome" once the listing exists; a non-interactive "Próximamente"
 * pill until then. Only placed on the dark ink surfaces (header, hero, CTA band).
 */
export function StoreButton({ size = 'lg', className = '' }: Props) {
  const sizing = size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-1.5 text-sm';
  if (!SITE.chromeStoreUrl) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/35 bg-white/5 font-medium text-white ${sizing} ${className}`}
        title="La extensión estará disponible pronto en Chrome Web Store"
      >
        <ChromeGlyph />
        Próximamente en Chrome
      </span>
    );
  }
  return (
    <a
      href={SITE.chromeStoreUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-primary ${sizing} ${className}`}
    >
      <ChromeGlyph />
      Agregar a Chrome — es gratis
    </a>
  );
}

/** Generic browser glyph (not Google's logo, which we may not use without permission). */
function ChromeGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8h9M8.5 14 4 6.5M15.5 14 11 22" strokeLinecap="round" />
    </svg>
  );
}
