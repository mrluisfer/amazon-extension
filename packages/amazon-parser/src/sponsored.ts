import type { MarketplaceId } from '@repo/shared';
import { MARKETPLACE_TEXT, PRODUCT_SPONSORED_SELECTORS, SPONSORED_SELECTORS } from './selectors';

/** Attribute the content script adds to containers it decided to hide. */
export const SPONSORED_ATTR = 'data-ph-sponsored';
/** Attribute on <html> that disables hiding (user turned the feature off). */
export const SHOW_SPONSORED_ATTR = 'data-ph-show-sponsored';

const CONTAINERS = SPONSORED_SELECTORS.containers.join(',');
const NEVER_HIDE = SPONSORED_SELECTORS.neverHide.join(',');

const markersFor = (marketplace: MarketplaceId) =>
  [
    ...SPONSORED_SELECTORS.markers,
    `a[aria-label^="${MARKETPLACE_TEXT[marketplace].sponsoredAriaPrefix}" i]`,
  ].join(',');

function isSafeContainer(el: Element): boolean {
  // Guard against selector drift ever hiding the whole results list.
  return !el.matches(NEVER_HIDE) && !el.querySelector(NEVER_HIDE);
}

/** The element's own text (direct text nodes only), so wrapped labels still match. */
function ownText(el: Element): string {
  let text = '';
  for (const node of el.childNodes) if (node.nodeType === 3) text += node.textContent;
  return text;
}

function isLabel(el: Element, label: RegExp): boolean {
  return label.test(ownText(el));
}

function hasSponsoredLabel(container: Element, label: RegExp): boolean {
  for (const el of container.querySelectorAll(SPONSORED_SELECTORS.labelCandidates)) {
    if (isLabel(el, label)) return true;
  }
  return false;
}

/**
 * Returns the containers on a search page that are sponsored: single results,
 * sponsored widgets (carousels, brand banners/videos) and rail ad blocks.
 * Pure DOM reads; the caller decides how to hide them. Already-tagged
 * containers are skipped so repeated scans stay cheap.
 */
export function findSponsoredContainers(root: ParentNode, marketplace: MarketplaceId): Element[] {
  const markers = markersFor(marketplace);
  const label = MARKETPLACE_TEXT[marketplace].sponsoredLabel;
  const found: Element[] = [];

  for (const container of root.querySelectorAll(CONTAINERS)) {
    if (container.hasAttribute(SPONSORED_ATTR)) continue;
    const sponsored =
      container.matches(markers) ||
      container.querySelector(markers) !== null ||
      hasSponsoredLabel(container, label);
    if (sponsored && isSafeContainer(container)) found.push(container);
  }
  return found;
}

const P = PRODUCT_SPONSORED_SELECTORS;
const CORE = P.core.join(',');
const PROTECTED = P.protectedWidgets.join(',');
const WIDGET_MARKERS = P.widgetMarkers.join(',');

function isSafeOnProductPage(el: Element): boolean {
  // Ads can live inside #ppd or the reviews widget: hide the ad, never what contains it.
  return (
    !el.matches(CORE) &&
    !el.querySelector(CORE) &&
    !el.matches(PROTECTED) &&
    !el.querySelector(PROTECTED)
  );
}

/** The enclosing CardInstance, unless it holds a carousel (those are hidden per item). */
function singleSponsoredCard(el: Element): Element | null {
  const card = el.closest(P.sponsoredCard);
  return card && !card.querySelector(P.card) ? card : null;
}

function outermostAdPlacement(el: Element): Element | null {
  let top = el.closest(P.adPlacement);
  while (top?.parentElement) {
    const up = top.parentElement.closest(P.adPlacement);
    if (!up) break;
    top = up;
  }
  return top;
}

/**
 * Returns the sponsored units on a product page: ad placements, sponsored
 * carousels/brand widgets, and single sponsored cards inside organic carousels.
 * Most specific unit wins, and nothing that contains product content is ever
 * returned. Pure DOM reads; already-tagged units are skipped.
 */
export function findSponsoredOnProductPage(
  root: ParentNode,
  marketplace: MarketplaceId,
): Element[] {
  const label = MARKETPLACE_TEXT[marketplace].sponsoredLabel;
  const found = new Set<Element>();
  const covered = (el: Element) =>
    el.closest(`[${SPONSORED_ATTR}]`) !== null || [...found].some((f) => f.contains(el));
  const add = (el: Element | null) => {
    // closest() includes the element itself: skips tagged units and anything inside them.
    if (el && el.closest(`[${SPONSORED_ATTR}]`) === null && isSafeOnProductPage(el)) found.add(el);
  };

  // 1. Ad placements (outermost only).
  for (const el of root.querySelectorAll(P.adPlacement)) {
    if (outermostAdPlacement(el) === el) add(el);
  }
  // 2. Always-sponsored widgets.
  for (const el of root.querySelectorAll(P.sponsoredWidgets.join(','))) add(el);
  // 3. Markers → their feature widget (unless the marker belongs to an ad placement).
  for (const marker of root.querySelectorAll(WIDGET_MARKERS)) {
    if (!marker.closest(P.adPlacement)) add(marker.closest(P.widget));
  }
  // 4a. Single-card sponsored widgets reusing organic ids (hide the card, not the widget).
  for (const card of root.querySelectorAll(P.sponsoredCard)) {
    if (card.querySelector(P.sponsoredCardMarker) && !card.querySelector(P.card)) add(card);
  }
  // 4b. Sponsored cards inside carousels.
  for (const card of root.querySelectorAll(P.card)) {
    if (card.querySelector(P.cardMarker) && !card.closest(P.adPlacement)) add(card);
  }
  // 5. Fallback for unknown placements: localized "Patrocinado" label → most specific unit.
  for (const leaf of root.querySelectorAll(P.labelCandidates)) {
    if (!isLabel(leaf, label) || covered(leaf)) continue;
    add(
      outermostAdPlacement(leaf) ??
        leaf.closest(P.card) ??
        singleSponsoredCard(leaf) ??
        leaf.closest(P.widget),
    );
  }

  // Drop units nested inside other units (keeps the count meaningful).
  const units = [...found];
  return units.filter((el) => !units.some((other) => other !== el && other.contains(el)));
}
