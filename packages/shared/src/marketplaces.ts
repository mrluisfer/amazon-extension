/**
 * Supported Amazon marketplaces. Adding one here is the first step of the
 * `new-marketplace` skill (.claude/skills/new-marketplace).
 */
export const MARKETPLACES = {
  mx: {
    id: 'mx',
    origin: 'https://www.amazon.com.mx',
    hostname: 'www.amazon.com.mx',
    currency: 'MXN',
    locale: 'es-MX',
  },
} as const;

export type MarketplaceId = keyof typeof MARKETPLACES;
export type Marketplace = (typeof MARKETPLACES)[MarketplaceId];

export const MARKETPLACE_IDS = Object.keys(MARKETPLACES) as [MarketplaceId, ...MarketplaceId[]];

export function marketplaceFromHostname(hostname: string): Marketplace | undefined {
  return Object.values(MARKETPLACES).find((m) => m.hostname === hostname);
}

/**
 * Offer types tracked per product, mirroring Keepa's main series:
 * - amazon: sold by Amazon itself
 * - new:    lowest new offer (any seller, includes the buy box)
 * - used:   lowest used offer
 */
export const OFFER_TYPES = ['amazon', 'new', 'used'] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

/**
 * History series = offer types + the list price ("Precio de lista"). The list
 * price is derived server-side from observations' `listPriceCents`; clients can
 * never report a `list` observation directly (ObservationSchema uses OFFER_TYPES).
 */
export const SERIES_TYPES = [...OFFER_TYPES, 'list'] as const;
export type SeriesType = (typeof SERIES_TYPES)[number];
