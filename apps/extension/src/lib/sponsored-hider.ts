import { SHOW_SPONSORED_ATTR, SPONSORED_ATTR } from '@repo/amazon-parser';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { sendMessage } from './messaging';
import { hideSponsoredItem } from './storage';

/**
 * Shared runtime for hiding sponsored content (search and product pages).
 *
 * Two layers per page type:
 * 1. A manifest-injected CSS file hides high-confidence ads before the DOM is
 *    built — no flash of ads on load.
 * 2. `find` tags anything CSS can't express with `data-ph-sponsored`, and keeps
 *    doing so as Amazon re-renders or lazy-loads widgets.
 *
 * Disabling the setting sets `data-ph-show-sponsored` on <html>, which turns
 * every rule off instantly. Read-only towards the page: we only add attributes.
 */
export function startSponsoredHider(ctx: ContentScriptContext, find: (doc: Document) => Element[]) {
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
    for (const el of find(document)) el.setAttribute(SPONSORED_ATTR, '');
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
}
