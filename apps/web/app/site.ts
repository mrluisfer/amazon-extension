/** Site-wide constants. Public values only — everything here ships to the browser. */
export const SITE = {
  name: 'Historial de Precios MX',
  tagline: 'Historial de precios para Amazon México, construido por la comunidad.',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL as string | undefined,
  /** Empty until the extension is published: CTAs show "Próximamente". */
  chromeStoreUrl: (import.meta.env.VITE_CHROME_STORE_URL as string | undefined) || null,
  policyUpdatedAt: '11 de octubre de 2026',
} as const;
