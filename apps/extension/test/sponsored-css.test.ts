// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = join(import.meta.dirname, '..', '..', '..');
const read = (path: string) => readFileSync(join(repo, path), 'utf8');

/** The selector list inside `html:not(...) :is( … )`, minus the JS-tag rule. */
function cssSelectors(css: string): string {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const start = body.indexOf(':is(') + 4;
  const end = body.lastIndexOf(')', body.indexOf('{'));
  return body
    .slice(start, end)
    .replace(/,\s*\[data-ph-sponsored\]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const cases = [
  {
    name: 'search',
    css: 'apps/extension/src/entrypoints/search.content/sponsored.css',
    fixture: 'packages/amazon-parser/test/fixtures/mx-search-sponsored.html',
    hidden: [
      'rail-ad',
      'top-banner',
      'sponsored-1',
      'sponsored-2',
      'products-carousel',
      'brand-carousel',
      'brand-video',
    ],
    visible: ['organic-1', 'organic-2', 'header-widget', 'related-searches'],
  },
  {
    name: 'product',
    css: 'apps/extension/src/entrypoints/product-sponsored.content/sponsored.css',
    fixture: 'packages/amazon-parser/test/fixtures/mx-product-sponsored.html',
    // sims-simsContainer_feature_div_1 (aax-only brand creative) is left to the JS layer.
    hidden: [
      'ape_Detail_hero-quick-promo_desktop_placement',
      'sims-simsContainer_feature_div_0',
      'sims-discoveryAndInspiration_feature_div_0',
      'sponsored-card',
      'ape_Detail_customer-reviews-top_Glance_wrapper',
      'CardInstanceBrandBundle',
    ],
    visible: [
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
    ],
  },
];

describe.each(cases)(
  '$name sponsored.css (pre-render layer)',
  ({ css, fixture, hidden, visible }) => {
    const source = read(css);

    it('hides the high-confidence ads from the real-capture fixture without touching organic content', () => {
      const doc = new DOMParser().parseFromString(read(fixture), 'text/html');
      const matched = [...doc.querySelectorAll(cssSelectors(source))]
        .map((el) => el.id)
        .filter(Boolean);

      expect(matched).toEqual(expect.arrayContaining(hidden));
      for (const id of visible) expect(matched).not.toContain(id);
    });

    it('is fully disabled by the opt-out attribute on <html>', () => {
      expect(source).toMatch(/html:not\(\[data-ph-show-sponsored\]\)/);
    });
  },
);
