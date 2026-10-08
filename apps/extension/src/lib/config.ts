import { MARKETPLACES } from '@repo/shared';

export const API_URL: string = import.meta.env.WXT_API_URL || 'http://localhost:8787';

/** Product-page URL patterns per marketplace (desktop + mobile web). */
export const PRODUCT_PAGE_MATCHES = Object.values(MARKETPLACES).flatMap((m) => [
  `${m.origin}/dp/*`,
  `${m.origin}/*/dp/*`,
  `${m.origin}/gp/product/*`,
  `${m.origin}/*/gp/product/*`,
  `${m.origin}/gp/aw/d/*`,
]);

/** Search-results URL patterns per marketplace (`/s?k=…` and legacy `/s/…`). */
export const SEARCH_PAGE_MATCHES = Object.values(MARKETPLACES).flatMap((m) => [
  `${m.origin}/s?*`,
  `${m.origin}/s/*`,
]);

export const PANEL_HEIGHT_PX = 430;
export const FLUSH_ALARM = 'flush-observations';
