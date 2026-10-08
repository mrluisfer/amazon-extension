import {
  type MarketplaceId,
  type Observation,
  ObservationSchema,
  type OfferType,
} from '@repo/shared';
import * as v from 'valibot';
import { parsePriceToCents } from './price';
import { MARKETPLACE_TEXT, SELECTORS } from './selectors';
import { parseAsinFromUrl } from './url';

export interface ParsedOffer {
  offerType: OfferType;
  priceCents: number | null;
  listPriceCents: number | null;
}

export interface ParsedProductPage {
  marketplace: MarketplaceId;
  asin: string;
  title: string | null;
  imageUrl: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  soldByAmazon: boolean;
  offers: ParsedOffer[];
}

function firstText(root: ParentNode, selectors: readonly string[]): string | null {
  for (const selector of selectors) {
    const text = root.querySelector(selector)?.textContent?.trim();
    if (text) return text;
  }
  return null;
}

function firstImage(root: ParentNode, selectors: readonly string[]): string | null {
  for (const selector of selectors) {
    const el = root.querySelector<HTMLImageElement>(selector);
    // data-old-hires holds the clean full-size URL; src may be a data: placeholder.
    const src = el?.getAttribute('data-old-hires') || el?.getAttribute('src');
    if (src?.startsWith('https://')) return src;
  }
  return null;
}

/**
 * Extracts product data from an Amazon product page. Pure DOM reads only —
 * never mutates the page and never evaluates page-provided strings as HTML.
 */
export function parseProductPage(
  doc: Document,
  marketplace: MarketplaceId,
  href: string = doc.location?.href ?? '',
): ParsedProductPage | null {
  const asinFromInput = doc
    .querySelector<HTMLInputElement>(SELECTORS.asinInput.join(','))
    ?.value?.trim()
    .toUpperCase();
  const asin =
    parseAsinFromUrl(href) ??
    (asinFromInput && /^[A-Z0-9]{10}$/.test(asinFromInput) ? asinFromInput : null);
  if (!asin) return null;

  const text = MARKETPLACE_TEXT[marketplace];
  const availabilityText = firstText(doc, SELECTORS.availability) ?? '';
  const availability = text.outOfStock.test(availabilityText)
    ? 'out_of_stock'
    : text.inStock.test(availabilityText)
      ? 'in_stock'
      : 'unknown';

  const buyBoxPrice = parsePriceToCents(
    firstText(doc, SELECTORS.buyBoxPrice),
    text.decimalSeparator,
  );
  const listPrice = parsePriceToCents(firstText(doc, SELECTORS.listPrice), text.decimalSeparator);
  const usedPrice = parsePriceToCents(firstText(doc, SELECTORS.usedPrice), text.decimalSeparator);
  const soldBy = firstText(doc, SELECTORS.soldBy) ?? '';
  const soldByAmazon = text.soldByAmazon.test(soldBy);

  const offers: ParsedOffer[] = [];
  const newPrice = availability === 'out_of_stock' ? null : buyBoxPrice;
  if (newPrice !== null || availability === 'out_of_stock') {
    offers.push({ offerType: 'new', priceCents: newPrice, listPriceCents: listPrice });
    if (soldByAmazon)
      offers.push({ offerType: 'amazon', priceCents: newPrice, listPriceCents: listPrice });
  }
  if (usedPrice !== null)
    offers.push({ offerType: 'used', priceCents: usedPrice, listPriceCents: null });

  return {
    marketplace,
    asin,
    title: firstText(doc, SELECTORS.title),
    imageUrl: firstImage(doc, SELECTORS.image),
    availability,
    soldByAmazon,
    offers,
  };
}

/**
 * Converts a parsed page into wire observations. Invalid fields are dropped
 * (not sent) so one bad selector never poisons a whole batch.
 */
export function toObservations(page: ParsedProductPage, now: Date = new Date()): Observation[] {
  const out: Observation[] = [];
  for (const offer of page.offers) {
    const candidate = {
      marketplace: page.marketplace,
      asin: page.asin,
      offerType: offer.offerType,
      priceCents: offer.priceCents,
      listPriceCents: offer.listPriceCents,
      availability: page.availability,
      title: page.title?.slice(0, 500) ?? undefined,
      imageUrl: page.imageUrl ?? undefined,
      observedAt: now.toISOString(),
    };
    let result = v.safeParse(ObservationSchema, candidate);
    if (!result.success) {
      // Retry without optional metadata before giving up on the price itself.
      result = v.safeParse(ObservationSchema, {
        ...candidate,
        title: undefined,
        imageUrl: undefined,
      });
    }
    if (result.success) out.push(result.output);
  }
  return out;
}
