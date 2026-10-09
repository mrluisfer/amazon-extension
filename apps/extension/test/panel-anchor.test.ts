// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { resolvePanelAnchor } from '../src/lib/panel-anchor';

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html');

// Skeletons of the layouts observed on amazon.com.mx (2026-10-08).
const CLASSIC = `<div id="dp" class="ce"><div id="dp-container"><div id="ppd">
  <div id="leftCol"><div id="mediaBlock_feature_div"><img id="landingImage"></div></div>
  <div id="centerCol"><div id="title_feature_div"><h1 id="productTitle">x</h1></div>
    <div id="productOverview_feature_div"><table><tr><td>Marca</td></tr></table></div>
    <div id="featurebullets_feature_div"><ul><li>a</li></ul></div></div>
  <div id="rightCol"></div></div></div></div>`;

// "premium_ce_brands" (e.g. iPhone): no #ppd, columns are direct children of #dp-container.
const PREMIUM = `<div id="dp" class="premium_ce_brands"><div id="dp-container">
  <div id="leftCol"><div id="mediaBlock_feature_div"></div></div>
  <div id="centerCol"><div id="title_feature_div"></div>
    <div id="productOverview_feature_div"><table><tr><td>Marca</td></tr></table></div>
    <div id="featurebullets_feature_div"><ul><li>a</li></ul></div></div>
  <div id="rightCol"></div>
  <div id="customer-reviews_feature_div"></div></div></div>`;

describe('resolvePanelAnchor', () => {
  it.each([
    ['classic', CLASSIC],
    ['premium (no #ppd)', PREMIUM],
  ])('%s layout → right under the short specs table, never the page bottom', (_l, html) => {
    expect(resolvePanelAnchor(doc(html))).toEqual({
      selector: '#productOverview_feature_div',
      append: 'after',
    });
  });

  it('skips an empty specs block and goes above "Acerca de este artículo"', () => {
    const html = PREMIUM.replace(
      '<div id="productOverview_feature_div"><table><tr><td>Marca</td></tr></table></div>',
      '<div id="productOverview_feature_div"></div>',
    );
    expect(resolvePanelAnchor(doc(html))).toEqual({
      selector: '#featurebullets_feature_div',
      append: 'before',
    });
  });

  it('falls back to the end of the center column before anything page-wide', () => {
    expect(
      resolvePanelAnchor(doc('<div id="dp-container"><div id="centerCol"></div></div>')),
    ).toEqual({
      selector: '#centerCol',
      append: 'last',
    });
  });

  it('returns null outside a product page', () => {
    expect(resolvePanelAnchor(doc('<div id="search"></div>'))).toBeNull();
  });
});
