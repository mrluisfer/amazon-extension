import type { MarketplaceId } from '@repo/shared';
import { MARKETPLACE_TEXT, SPONSORED_SELECTORS } from './selectors';

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

function hasSponsoredLabel(container: Element, label: RegExp): boolean {
  for (const el of container.querySelectorAll(SPONSORED_SELECTORS.labelCandidates)) {
    if (el.childElementCount === 0 && label.test(el.textContent ?? '')) return true;
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
