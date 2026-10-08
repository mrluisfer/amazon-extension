import { findSponsoredContainers, SHOW_SPONSORED_ATTR, SPONSORED_ATTR } from '@repo/amazon-parser';
import { marketplaceFromHostname } from '@repo/shared';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { SEARCH_PAGE_MATCHES } from '@/lib/config';
import { sendMessage } from '@/lib/messaging';
import { hideSponsoredItem } from '@/lib/storage';
import './sponsored.css';

/**
 * Hides sponsored results on search pages.
 *
 * Two layers:
 * 1. `sponsored.css` is injected by the manifest before the DOM is built and
 *    hides high-confidence ads with `:has()` — no flash of ads on load.
 * 2. This script tags anything the CSS can't express (text-label fallback,
 *    widgets) with `data-ph-sponsored`, and keeps doing so as Amazon re-renders
 *    results (filters, pagination, lazy widgets).
 *
 * Disabling the setting sets `data-ph-show-sponsored` on <html>, which turns
 * every rule off instantly. Read-only towards the page: we only add attributes.
 */
export default defineContentScript({
  matches: SEARCH_PAGE_MATCHES,
  runAt: 'document_start',
  main(ctx) {
    const marketplace = marketplaceFromHostname(location.hostname);
    if (!marketplace) return;

    const html = document.documentElement;
    let observer: MutationObserver | null = null;
    let scanScheduled = false;
    let lastCount = -1;

    const report = (hidden: number) => {
      if (hidden === lastCount) return;
      lastCount = hidden;
      sendMessage('sponsored:count', { hidden }).catch(() => {});
    };

    const scan = () => {
      scanScheduled = false;
      for (const el of findSponsoredContainers(document, marketplace.id)) {
        el.setAttribute(SPONSORED_ATTR, '');
      }
      report(document.querySelectorAll(`[${SPONSORED_ATTR}]`).length);
    };

    // Coalesce bursts of DOM mutations into at most one scan per frame.
    const schedule = () => {
      if (scanScheduled) return;
      scanScheduled = true;
      requestAnimationFrame(scan);
    };

    const apply = (enabled: boolean | null) => {
      const on = enabled ?? true;
      html.toggleAttribute(SHOW_SPONSORED_ATTR, !on);
      if (on && !observer) {
        observer = new MutationObserver(schedule);
        observer.observe(html, { childList: true, subtree: true });
        schedule();
      } else if (!on && observer) {
        observer.disconnect();
        observer = null;
        report(0);
      }
    };

    void hideSponsoredItem.getValue().then(apply);
    const unwatch = hideSponsoredItem.watch(apply);
    ctx.onInvalidated(() => {
      unwatch();
      observer?.disconnect();
    });
  },
});
