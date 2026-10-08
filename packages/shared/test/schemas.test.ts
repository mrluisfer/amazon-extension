import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { ObservationSchema } from '../src/schemas';

const base = {
  marketplace: 'mx',
  asin: 'B0CHX1W1XY',
  offerType: 'amazon',
  priceCents: 129_900,
  observedAt: '2026-10-08T12:00:00.000Z',
};

describe('ObservationSchema', () => {
  it('accepts a valid observation and defaults availability', () => {
    const out = v.parse(ObservationSchema, base);
    expect(out.availability).toBe('unknown');
  });

  it.each([
    ['lowercase asin', { asin: 'b0chx1w1xy' }],
    ['unknown marketplace', { marketplace: 'us' }],
    ['float price', { priceCents: 12.5 }],
    ['absurd price', { priceCents: 10 ** 12 }],
    ['non-amazon image', { imageUrl: 'https://evil.example/x.png' }],
    ['http image', { imageUrl: 'http://m.media-amazon.com/x.jpg' }],
  ])('rejects %s', (_label, patch) => {
    expect(v.safeParse(ObservationSchema, { ...base, ...patch }).success).toBe(false);
  });
});
