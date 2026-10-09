import { parseProductPage, toObservations } from '@repo/amazon-parser';
import { marketplaceFromHostname } from '@repo/shared';
import { browser } from 'wxt/browser';
import { createIframeUi, type IframeContentScriptUi } from 'wxt/utils/content-script-ui/iframe';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { PANEL_HEIGHT_PX, PRODUCT_PAGE_MATCHES } from '@/lib/config';
import { sendMessage } from '@/lib/messaging';
import { keepPanelAboveKeepa, resolvePanelAnchor } from '@/lib/panel-anchor';

/**
 * Runs in Chrome's isolated world on product pages only. Kept deliberately
 * tiny: it reads the DOM, reports prices (if the user opted in — enforced in
 * the background) and mounts the panel iframe. All UI and heavy code live in
 * the iframe, which runs on the extension origin in its own process, isolated
 * from Amazon's CSS/JS.
 */
export default defineContentScript({
  matches: PRODUCT_PAGE_MATCHES,
  runAt: 'document_idle',
  main(ctx) {
    const marketplace = marketplaceFromHostname(location.hostname);
    if (!marketplace) return;

    let ui: IframeContentScriptUi<void> | undefined;
    let currentAsin: string | null = null;

    // Watches only the direct children of #dp-container (cheap): keeps our panel
    // above Keepa's box when Keepa injects after us, and re-mounts if Amazon drops it.
    const container = document.getElementById('dp-container');
    if (container) {
      const observer = new MutationObserver(() => {
        if (!ui) return;
        if (!ui.wrapper.isConnected) ui.mount();
        else keepPanelAboveKeepa(ui.wrapper);
      });
      observer.observe(container, { childList: true });
      ctx.onInvalidated(() => observer.disconnect());
    }

    const render = () => {
      const page = parseProductPage(document, marketplace.id, location.href);
      if (!page || page.asin === currentAsin) return;
      currentAsin = page.asin;

      const observations = toObservations(page);
      if (observations.length > 0) {
        sendMessage('observations:report', { observations }).catch(() => {
          // Background asleep/updating — losing one observation is acceptable.
        });
      }

      ui?.remove();
      // Same slot as Keepa — right above it when present (see lib/panel-anchor.ts).
      const anchor = resolvePanelAnchor(document);
      if (!anchor) return;

      ui = createIframeUi(ctx, {
        page: '/panel.html',
        position: 'inline',
        anchor: anchor.selector,
        append: anchor.append,
        onBeforeMount: (wrapper, iframe) => {
          // Fragment never leaves the browser and doesn't affect resource matching.
          const params = new URLSearchParams({ m: marketplace.id, asin: page.asin });
          iframe.src = `${browser.runtime.getURL('/panel.html')}#${params}`;
          iframe.title = 'Historial de precios';
          iframe.loading = 'lazy'; // below the fold: load when scrolled near
          iframe.referrerPolicy = 'no-referrer';
          Object.assign(iframe.style, {
            width: '100%',
            height: `${PANEL_HEIGHT_PX}px`,
            border: '0',
            colorScheme: 'normal',
          });
          // Match Keepa's box so both read as one stacked block (left-aligned, ≤960px).
          Object.assign(wrapper.style, { clear: 'both', maxWidth: '960px', margin: '10px 0 0' });
          wrapper.id = 'ph-price-panel';
        },
      });
      ui.mount();
      keepPanelAboveKeepa(ui.wrapper);
    };

    render();
    // Variant changes (color/size) swap the ASIN via history.pushState; the
    // DOM updates shortly after the URL does.
    ctx.addEventListener(window, 'wxt:locationchange', () => {
      ctx.setTimeout(render, 600);
    });
  },
});
