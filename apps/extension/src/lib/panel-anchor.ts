export interface PanelAnchor {
  selector: string;
  append: 'after' | 'before' | 'last';
}

/**
 * Where the price panel is mounted, in priority order. Verified on amazon.com.mx
 * (2026-10-08) across the classic layout (`#ppd` wrapping the columns) and the
 * "premium" layout (`#dp.premium_ce_brands`, no `#ppd`):
 *
 * - Preferred: right under the short specs table in the center column. The image
 *   column (`#leftCol`) is `position: sticky` on most layouts, so mounting there
 *   would make the panel scroll-stick with the image.
 * - Fallbacks keep the panel near the top of the page; the last resort is the old
 *   full-width placement below the product block.
 */
export const PANEL_ANCHORS: readonly PanelAnchor[] = [
  { selector: '#productOverview_feature_div', append: 'after' }, // "Marca / Modelo / …" table
  { selector: '#featurebullets_feature_div', append: 'before' }, // above "Acerca de este artículo"
  { selector: '#bookDescription_feature_div', append: 'after' }, // books
  { selector: '#centerCol', append: 'last' },
  { selector: '#ppd', append: 'after' },
  { selector: '#dp-container', append: 'last' },
];

/** First anchor that exists and has content (Amazon leaves some feature divs empty). */
export function resolvePanelAnchor(doc: ParentNode): PanelAnchor | null {
  for (const anchor of PANEL_ANCHORS) {
    const el = doc.querySelector(anchor.selector);
    if (el && (el.childElementCount > 0 || anchor.append === 'last')) return anchor;
  }
  return null;
}
