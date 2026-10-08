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

/**
 * Sponsored content on search pages. Verified on amazon.com.mx 2026-10-08
 * (4 result pages, 12/60 sponsored results each, 0 false positives per signal).
 * Keep in sync with apps/extension/src/entrypoints/search.content/sponsored.css.
 */
export const SPONSORED_SELECTORS = {
  /** Units we hide: direct children of the results list, plus rail ad blocks. */
  containers: [
    '.s-main-slot > .s-result-item',
    '.s-main-slot > [data-component-type="s-search-result"]',
    '.AdHolder',
  ],
  /** Locale-agnostic markers on or inside a sponsored container, strongest first. */
  markers: [
    '.AdHolder', // results + most widgets + rail
    '.puis-sponsored-label-text', // single results, sponsored-brand video
    '.s-widget-sponsored-label-text', // sponsored products carousel
    '.sponsored-brand-label-info-desktop', // sponsored-brand widgets
    'a[href*="/sspa/click"]', // sponsored click redirect
    '[class*="ctaSponsored"]', // hashed class on brand carousels — last resort
  ],
  /** Leaf elements checked for the localized "Patrocinado" text (fallback). */
  labelCandidates: 'span, a',
  /** Never hide these (guards against a selector ever matching the whole list). */
  neverHide: ['.s-main-slot', '#search', '.s-search-results'],
} as const;

/**
 * Sponsored content on product pages (/dp/ASIN). Verified on amazon.com.mx
 * 2026-10-08 (4 products, 0 false positives; all ad widgets present at load).
 * Keep in sync with apps/extension/src/entrypoints/product-sponsored.content/sponsored.css.
 */
export const PRODUCT_SPONSORED_SELECTORS = {
  /** Ad placements; hide the OUTERMOST match (nested _iframe/_Feedback ids live inside). */
  adPlacement: '[id^="ape_Detail_"]',
  /** Whole widgets that are always sponsored ("Compra por marca", brand video). */
  sponsoredWidgets: ['[id^="sims-discoveryAndInspiration"]'],
  /** Markers whose nearest feature widget is sponsored (carousels, brand creatives). */
  widgetMarkers: ['[id^="sp_detail"]', 'a[href*="aax-"]'],
  /** A feature widget = the unit to hide for widget markers / label fallback. */
  widget: '.celwidget[id$="_feature_div"], .celwidget[id*="_feature_div_"]',
  /**
   * Single-card sponsored widgets that reuse organic ids (e.g. "Productos de <marca>
   * que los clientes compraron juntos" inside a sims-productBundle widget). Hide the
   * card, keep the widget; skip cards that hold a carousel (handled per item).
   */
  sponsoredCard: '[id^="CardInstance"]',
  sponsoredCardMarker: '.dynamicSponsoredLabelClass',
  /** Sponsored card inside an otherwise organic carousel — hide only the card. */
  card: 'li.a-carousel-card',
  cardMarker: 'a[href*="/sspa/click"]',
  /** Never hide, nor anything that contains them (ads can live inside #ppd/reviews). */
  core: [
    '#a-page',
    '#dp',
    '#dp-container',
    '#ppd',
    '#centerCol',
    '#rightCol',
    '#buybox',
    '#desktop_buybox',
    '#productTitle',
    '#corePrice_feature_div',
    '#add-to-cart-button',
  ],
  /** Organic widgets that may CONTAIN an ad: hide the ad inside, never the widget. */
  protectedWidgets: ['#customer-reviews_feature_div', '[id^="sims-productBundle"]'],
  labelCandidates: 'span, a',
} as const;

interface MarketplaceText {
  decimalSeparator: '.' | ',';
  soldByAmazon: RegExp;
  outOfStock: RegExp;
  inStock: RegExp;
  /** Exact text of the sponsored label (leaf node). */
  sponsoredLabel: RegExp;
  /** aria-label prefix on sponsored widgets that have no AdHolder class. */
  sponsoredAriaPrefix: string;
}

/** Locale-dependent text patterns. */
export const MARKETPLACE_TEXT: Record<MarketplaceId, MarketplaceText> = {
  mx: {
    decimalSeparator: '.',
    soldByAmazon: /^\s*amazon(\.com(\.mx)?)?(\s+m[eé]xico)?\s*\.?\s*$/i,
    outOfStock: /no disponible|agotado/i,
    inStock: /disponible|en existencia|quedan? s[oó]lo/i,
    // Product pages also render the English "Sponsored Ad" label on some placements.
    sponsoredLabel: /^\s*(patrocinad[oa]s?|sponsored(\s+ad)?)\s*$/i,
    sponsoredAriaPrefix: 'Anuncio patrocinado',
  },
};
