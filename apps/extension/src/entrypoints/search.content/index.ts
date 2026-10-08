import { findSponsoredContainers } from '@repo/amazon-parser';
import { marketplaceFromHostname } from '@repo/shared';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { SEARCH_PAGE_MATCHES } from '@/lib/config';
import { startSponsoredHider } from '@/lib/sponsored-hider';
import './sponsored.css';

/** Hides sponsored results on search pages (see lib/sponsored-hider.ts). */
export default defineContentScript({
  matches: SEARCH_PAGE_MATCHES,
  runAt: 'document_start',
  main(ctx) {
    const marketplace = marketplaceFromHostname(location.hostname);
    if (!marketplace) return;
    startSponsoredHider(ctx, (doc) => findSponsoredContainers(doc, marketplace.id));
  },
});
