import { type Marketplace, marketplaceFromHostname } from '@repo/shared';

// Covers /dp/ASIN, /Some-Title/dp/ASIN, /gp/product/ASIN, /gp/aw/d/ASIN (mobile)
const ASIN_PATH_RE = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?#]|$)/i;

export function parseAsinFromUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const match = ASIN_PATH_RE.exec(url.pathname);
  return match?.[1] ? match[1].toUpperCase() : null;
}

export function marketplaceFromUrl(href: string): Marketplace | undefined {
  try {
    return marketplaceFromHostname(new URL(href).hostname);
  } catch {
    return undefined;
  }
}

/** Canonical, tracking-free product URL. Never forward Amazon URLs with query params. */
export function canonicalProductUrl(marketplace: Marketplace, asin: string): string {
  return `${marketplace.origin}/dp/${asin}`;
}
