import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findSponsoredContainers,
  findSponsoredOnProductPage,
  SPONSORED_ATTR,
} from '../src/sponsored';

function loadFixture(name: string): Document {
  const html = readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');
  return new DOMParser().parseFromString(html, 'text/html');
}

const ids = (els: Element[]) => els.map((el) => el.id).sort();

describe('findSponsoredContainers (mx search)', () => {
  it('finds every sponsored result, widget and rail block — and nothing organic', () => {
    const doc = loadFixture('mx-search-sponsored.html');
    expect(ids(findSponsoredContainers(doc, 'mx'))).toEqual(
      [
        'rail-ad',
        'top-banner',
        'sponsored-1',
        'products-carousel',
        'brand-carousel',
        'sponsored-2',
        'brand-video',
      ].sort(),
    );
  });

  it('never returns organic results or organic widgets', () => {
    const doc = loadFixture('mx-search-sponsored.html');
    const found = new Set(ids(findSponsoredContainers(doc, 'mx')));
    for (const id of ['organic-1', 'organic-2', 'header-widget', 'related-searches']) {
      expect(found.has(id)).toBe(false);
    }
  });

  it('skips containers already tagged (cheap re-scans)', () => {
    const doc = loadFixture('mx-search-sponsored.html');
    for (const el of findSponsoredContainers(doc, 'mx')) el.setAttribute(SPONSORED_ATTR, '');
    expect(findSponsoredContainers(doc, 'mx')).toEqual([]);
  });

  it('falls back to the localized "Patrocinado" leaf label when classes change', () => {
    const doc = new DOMParser().parseFromString(
      `<div class="s-main-slot">
         <div class="s-result-item" id="relabelled"><div><span class="new-class">Patrocinado</span></div></div>
         <div class="s-result-item" id="organic"><span>Patrocinado por la comunidad de fans</span></div>
       </div>`,
      'text/html',
    );
    expect(ids(findSponsoredContainers(doc, 'mx'))).toEqual(['relabelled']);
  });

  it('never hides the results list itself, even if Amazon tags it oddly', () => {
    const doc = new DOMParser().parseFromString(
      `<div id="search"><div class="s-main-slot AdHolder" id="slot">
         <div class="s-result-item" id="organic"><span>Producto</span></div>
       </div></div>`,
      'text/html',
    );
    expect(ids(findSponsoredContainers(doc, 'mx'))).toEqual([]);
  });
});

describe('findSponsoredOnProductPage (mx)', () => {
  const unitIds = (doc: Document) => ids(findSponsoredOnProductPage(doc, 'mx'));

  it('finds every sponsored unit at its most specific level', () => {
    const doc = loadFixture('mx-product-sponsored.html');
    expect(unitIds(doc)).toEqual(
      [
        'ape_Detail_hero-quick-promo_desktop_placement', // ad inside #ppd
        'sims-simsContainer_feature_div_0', // sponsored carousel
        'sims-simsContainer_feature_div_1', // brand creative (aax- links)
        'sims-discoveryAndInspiration_feature_div_0', // "Compra por marca"
        'sponsored-card', // single card in an organic carousel
        'ape_Detail_customer-reviews-top_Glance_wrapper', // ad inside reviews
        'CardInstanceBrandBundle', // sponsored card inside a protected bundle widget
      ].sort(),
    );
  });

  it('never hides product content or organic widgets that merely contain an ad', () => {
    const doc = loadFixture('mx-product-sponsored.html');
    const found = new Set(unitIds(doc));
    for (const id of [
      'a-page',
      'dp',
      'dp-container',
      'ppd',
      'centerCol',
      'rightCol',
      'corePrice_feature_div',
      'sims-simsContainer_feature_div_2',
      'organic-card',
      'sims-productBundle_feature_div_0',
      'sims-productBundle_feature_div_1',
      'customer-reviews_feature_div',
    ]) {
      expect(found.has(id)).toBe(false);
    }
  });

  it('skips already-tagged units and nested duplicates', () => {
    const doc = loadFixture('mx-product-sponsored.html');
    for (const el of findSponsoredOnProductPage(doc, 'mx')) el.setAttribute(SPONSORED_ATTR, '');
    expect(findSponsoredOnProductPage(doc, 'mx')).toEqual([]);
  });

  it('label fallback picks the closest widget for unknown placements, but never a core block', () => {
    const doc = new DOMParser().parseFromString(
      `<div id="dp-container">
         <div id="ppd"><div id="centerCol"><span>Patrocinado</span></div></div>
         <div id="new-ad_feature_div" class="celwidget"><div><span>Sponsored Ad</span></div></div>
       </div>`,
      'text/html',
    );
    expect(unitIds(doc)).toEqual(['new-ad_feature_div']);
  });

  it('matches labels by their own text, even when the label element has children', () => {
    const doc = new DOMParser().parseFromString(
      `<div id="dp-container">
         <div id="x_feature_div" class="celwidget"><span>Patrocinado <i class="info"></i></span></div>
         <div id="y_feature_div" class="celwidget"><span>Patrocinado por fans <i></i></span></div>
       </div>`,
      'text/html',
    );
    expect(unitIds(doc)).toEqual(['x_feature_div']);
  });
});
