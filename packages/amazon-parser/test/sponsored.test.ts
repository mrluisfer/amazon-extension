import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findSponsoredContainers, SPONSORED_ATTR } from '../src/sponsored';

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
