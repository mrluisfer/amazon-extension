/**
 * Brand mark: a descending price staircase ending on the current (lowest)
 * price, on Amazon's "squid ink" tile — familiar colors, our own shape (never
 * Amazon's smile/arrow, see docs/brand.md). Geometry mirrors
 * assets/icon.svg and assets/icon-16.svg (manifest PNGs, favicon).
 */

const INK = '#232F3E';
const ORANGE = '#FF9900';
const YELLOW = '#FFD814';

interface MarkProps {
  size?: number;
  className?: string;
  /** Accessible name; omit when the mark sits next to visible text (decorative). */
  title?: string;
}

export function LogoMark({ size = 24, className, title }: MarkProps) {
  const small = size <= 20;
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? 'Historial de Precios MX'}
      aria-hidden={title ? undefined : true}
    >
      <rect width="128" height="128" rx={small ? 24 : 28} fill={INK} />
      {small ? (
        <>
          <path
            d="M20 40H52V76H76"
            fill="none"
            stroke={ORANGE}
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="104" cy="76" r="15" fill={YELLOW} />
        </>
      ) : (
        <>
          <path
            d="M24 40H48V62H70V84H86"
            fill="none"
            stroke={ORANGE}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="100" cy="84" r="10" fill={YELLOW} />
        </>
      )}
    </svg>
  );
}

interface LogoProps {
  /** Mark size in px; the wordmark scales with the surrounding font size. */
  size?: number;
  className?: string;
}

/** Mark + wordmark lockup. Text color is inherited (white on the ink header, fg elsewhere). */
export function Logo({ size = 28, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="flex items-center gap-1.5 font-bold tracking-tight whitespace-nowrap">
        Historial de Precios
        <span className="rounded-sm bg-brand px-1 py-px text-[0.7em] leading-none text-ink">
          MX
        </span>
      </span>
    </span>
  );
}
