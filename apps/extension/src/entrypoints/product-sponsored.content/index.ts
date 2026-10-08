import { findSponsoredOnProductPage } from '@repo/amazon-parser';
import { marketplaceFromHostname } from '@repo/shared';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { PRODUCT_PAGE_MATCHES } from '@/lib/config';
import { startSponsoredHider } from '@/lib/sponsored-hider';
import './sponsored.css';

/**
 * Hides sponsored carousels, ad placements and sponsored cards on product
 * pages (see lib/sponsored-hider.ts). Separate from amazon.content so the CSS
 * applies at document_start while the price panel still waits for document_idle.
 */
export default defineContentScript({
  matches: PRODUCT_PAGE_MATCHES,
  runAt: 'document_start',
  main(ctx) {
    const marketplace = marketplaceFromHostname(location.hostname);
    if (!marketplace) return;
    startSponsoredHider(ctx, (doc) => findSponsoredOnProductPage(doc, marketplace.id));
  },
});
