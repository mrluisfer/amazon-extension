import { MARKETPLACES, type MarketplaceId } from './marketplaces';

const formatters = new Map<MarketplaceId, Intl.NumberFormat>();

export function formatPrice(cents: number, marketplace: MarketplaceId): string {
  let fmt = formatters.get(marketplace);
  if (!fmt) {
    const m = MARKETPLACES[marketplace];
    fmt = new Intl.NumberFormat(m.locale, { style: 'currency', currency: m.currency });
    formatters.set(marketplace, fmt);
  }
  return fmt.format(cents / 100);
}
