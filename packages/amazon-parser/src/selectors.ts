import type { MarketplaceId } from '@repo/shared';

/**
 * Selector chains, tried in order. Amazon runs constant A/B tests and layouts
 * differ by category, so every field has fallbacks. When a selector breaks,
 * follow .claude/skills/amazon-parser to update it and add a fixture.
 */
export const SELECTORS = {
  title: ['#productTitle', '#title'],
  image: ['#landingImage', '#imgBlkFront', '#main-image'],
  asinInput: ['input#ASIN', 'input[name="ASIN"]'],
  buyBoxPrice: [
    '#corePriceDisplay_desktop_feature_div .priceToPay .a-offscreen',
    '#corePrice_feature_div .a-price .a-offscreen',
    '#apex_desktop .priceToPay .a-offscreen',
    '#tp_price_block_total_price_ww .a-offscreen',
    '#price_inside_buybox',
    '#priceblock_dealprice',
    '#priceblock_ourprice',
  ],
  listPrice: [
    '#corePriceDisplay_desktop_feature_div .basisPrice .a-offscreen',
    '#corePrice_feature_div .a-price.a-text-price .a-offscreen',
    '#apex_desktop .a-text-price .a-offscreen',
  ],
  usedPrice: ['#usedAccordionRow .a-price .a-offscreen', '#usedBuySection .offer-price'],
  soldBy: [
    '#tabular-buybox .tabular-buybox-text[tabular-attribute-name="Vendido por"]',
    '#merchantInfoFeature_feature_div .offer-display-feature-text',
    '#sellerProfileTriggerId',
    '#merchant-info',
  ],
  availability: ['#availability', '#outOfStock'],
} as const;

/** Locale-dependent text patterns. */
export const MARKETPLACE_TEXT: Record<
  MarketplaceId,
  { decimalSeparator: '.' | ','; soldByAmazon: RegExp; outOfStock: RegExp; inStock: RegExp }
> = {
  mx: {
    decimalSeparator: '.',
    soldByAmazon: /^\s*amazon(\.com(\.mx)?)?(\s+m[eé]xico)?\s*\.?\s*$/i,
    outOfStock: /no disponible|agotado/i,
    inStock: /disponible|en existencia|quedan? s[oó]lo/i,
  },
};
