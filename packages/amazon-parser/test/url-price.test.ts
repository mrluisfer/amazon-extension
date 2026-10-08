import { describe, expect, it } from 'vitest';
import { parsePriceToCents } from '../src/price';
import { parseAsinFromUrl } from '../src/url';

describe('parseAsinFromUrl', () => {
  it.each([
    ['https://www.amazon.com.mx/dp/B0CHX1W1XY', 'B0CHX1W1XY'],
    ['https://www.amazon.com.mx/Audifonos-Bluetooth/dp/B0CHX1W1XY/ref=sr_1_1?k=x', 'B0CHX1W1XY'],
    ['https://www.amazon.com.mx/gp/product/b0chx1w1xy', 'B0CHX1W1XY'],
    ['https://www.amazon.com.mx/gp/aw/d/6073183766', '6073183766'],
  ])('%s → %s', (url, asin) => {
    expect(parseAsinFromUrl(url)).toBe(asin);
  });

  it.each([
    'https://www.amazon.com.mx/s?k=laptop',
    'https://www.amazon.com.mx/dp/SHORT',
    'not a url',
  ])('returns null for %s', (url) => {
    expect(parseAsinFromUrl(url)).toBeNull();
  });
});

describe('parsePriceToCents', () => {
  it.each([
    ['$1,299.00', '.', 129_900],
    ['$ 99.50', '.', 9_950],
    ['$1,299', '.', 129_900],
    ['MXN 12,345.6', '.', 1_234_560],
    ['1.299,00 €', ',', 129_900],
  ] as const)('%s → %d', (raw, sep, cents) => {
    expect(parsePriceToCents(raw, sep)).toBe(cents);
  });

  it.each(['', 'Gratis', '$0.00', '$1.2.3', '$12.345'])('rejects %s', (raw) => {
    expect(parsePriceToCents(raw, '.')).toBeNull();
  });
});
