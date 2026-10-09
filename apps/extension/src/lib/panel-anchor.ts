export interface PanelAnchor {
  selector: string;
  append: 'after' | 'before' | 'last';
}

/** Keepa's injected box (same slot we use). When present, our panel goes right above it. */
export const KEEPA_CONTAINER = '#keepaContainer';

/**
 * Where the price panel is mounted, in priority order — the same slot Keepa uses,
 * so users don't have to learn a new position and both can coexist (ours on top).
 * Verified on amazon.com.mx (2026-10-08) on classic (`#ppd`) and premium (no `#ppd`)
 * layouts: Keepa inserts `#keepaContainer` as a direct child of `#dp-container`
 * immediately after Amazon's `#hover-zoom-end` spacer, which closes the
 * above-the-fold block (image, details, buy box) on every layout.
 */
export const PANEL_ANCHORS: readonly PanelAnchor[] = [
  { selector: KEEPA_CONTAINER, append: 'before' },
  { selector: '#hover-zoom-end', append: 'after' },
  { selector: '#ppd', append: 'after' },
  { selector: '#dp-container', append: 'last' },
];

export function resolvePanelAnchor(doc: ParentNode): PanelAnchor | null {
  return PANEL_ANCHORS.find((anchor) => doc.querySelector(anchor.selector) !== null) ?? null;
}

/**
 * Keepa injects ~50–100 ms after DOMContentLoaded, possibly after us, and would
 * then sit above our panel. Returns true if the panel had to move back on top.
 * We move our own node (never Keepa's) so the other extension is not disturbed.
 */
export function keepPanelAboveKeepa(panel: Element, doc: ParentNode = document): boolean {
  const keepa = doc.querySelector(KEEPA_CONTAINER);
  if (!keepa || !panel.isConnected || panel.nextElementSibling === keepa) return false;
  const panelIsBelowKeepa = !!(
    keepa.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING
  );
  if (!panelIsBelowKeepa) return false;
  keepa.before(panel);
  return true;
}
