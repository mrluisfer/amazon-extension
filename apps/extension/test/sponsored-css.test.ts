// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..', '..');
const css = readFileSync(
  join(import.meta.dirname, '../src/entrypoints/search.content/sponsored.css'),
  'utf8',
);
const fixture = readFileSync(
  join(root, 'packages/amazon-parser/test/fixtures/mx-search-sponsored.html'),
  'utf8',
);

/** The selector list inside `html:not(...) :is( … )`, minus the JS-tag rule. */
function cssSelectors(): string {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const start = body.indexOf(':is(') + 4;
  const end = body.lastIndexOf(')', body.indexOf('{'));
  return body
    .slice(start, end)
    .replace(/,\s*\[data-ph-sponsored\]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('sponsored.css (pre-render layer)', () => {
  it('hides the high-confidence ads from the real-capture fixture without touching organic items', () => {
    const doc = new DOMParser().parseFromString(fixture, 'text/html');
    const hidden = [...doc.querySelectorAll(cssSelectors())].map((el) => el.id).filter(Boolean);

    expect(hidden).toEqual(
      expect.arrayContaining([
        'rail-ad',
        'top-banner',
        'sponsored-1',
        'sponsored-2',
        'products-carousel',
        'brand-carousel',
        'brand-video',
      ]),
    );
    for (const id of ['organic-1', 'organic-2', 'header-widget', 'related-searches']) {
      expect(hidden).not.toContain(id);
    }
  });

  it('is fully disabled by the opt-out attribute on <html>', () => {
    expect(css).toMatch(/html:not\(\[data-ph-show-sponsored\]\)/);
  });
});
