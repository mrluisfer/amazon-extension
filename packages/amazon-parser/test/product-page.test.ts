import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseProductPage, toObservations } from '../src/product-page';

function loadFixture(name: string): Document {
  const html = readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('parseProductPage (mx)', () => {
  it('parses a product sold by Amazon with list and used prices', () => {
    const doc = loadFixture('mx-sold-by-amazon.html');
    const page = parseProductPage(
      doc,
      'mx',
      'https://www.amazon.com.mx/Audifonos/dp/B0CHX1W1XY?ref=x',
    );

    expect(page).toMatchObject({
      asin: 'B0CHX1W1XY',
      title: 'Audífonos Inalámbricos con Cancelación de Ruido',
      imageUrl: 'https://m.media-amazon.com/images/I/61abcDEF.jpg',
      availability: 'in_stock',
      soldByAmazon: true,
    });
    expect(page?.offers).toEqual([
      { offerType: 'new', priceCents: 129_900, listPriceCents: 189_900 },
      { offerType: 'amazon', priceCents: 129_900, listPriceCents: 189_900 },
      { offerType: 'used', priceCents: 99_950, listPriceCents: null },
    ]);
  });

  it('falls back to the hidden ASIN input when the URL has none', () => {
    const doc = loadFixture('mx-sold-by-amazon.html');
    expect(parseProductPage(doc, 'mx', 'https://www.amazon.com.mx/some/other/path')?.asin).toBe(
      'B0CHX1W1XY',
    );
  });

  it('reports out-of-stock third-party listings as a null "new" price', () => {
    const doc = loadFixture('mx-third-party-out-of-stock.html');
    const page = parseProductPage(doc, 'mx', 'https://www.amazon.com.mx/dp/B0TESTTEST');

    expect(page?.availability).toBe('out_of_stock');
    expect(page?.soldByAmazon).toBe(false);
    expect(page?.offers).toEqual([{ offerType: 'new', priceCents: null, listPriceCents: null }]);
  });

  it('returns null when no ASIN can be found', () => {
    const doc = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
    expect(parseProductPage(doc, 'mx', 'https://www.amazon.com.mx/s?k=laptop')).toBeNull();
  });
});

describe('toObservations', () => {
  it('drops untrusted image URLs but keeps the price data', () => {
    const doc = loadFixture('mx-third-party-out-of-stock.html');
    const page = parseProductPage(doc, 'mx', 'https://www.amazon.com.mx/dp/B0TESTTEST');
    if (!page) throw new Error('expected page');
    // Simulate a hostile page swapping in a non-Amazon image.
    const obs = toObservations(
      { ...page, imageUrl: 'https://evil.example/x.png' },
      new Date('2026-10-08T00:00:00Z'),
    );

    expect(obs).toHaveLength(1);
    expect(obs[0]).toMatchObject({ asin: 'B0TESTTEST', priceCents: null, offerType: 'new' });
    expect(obs[0]?.imageUrl).toBeUndefined();
  });
});
