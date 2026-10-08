import { describe, expect, it } from 'vitest';
import { centsToInput, parseTargetPrice } from '../src/lib/price-input';

describe('parseTargetPrice', () => {
  it.each([
    ['1299', 129_900],
    ['1,299.50', 129_950],
    ['$ 1299.5', 129_950],
    ['0.99', 99],
  ])('%s → %d cents', (input, cents) => {
    expect(parseTargetPrice(input)).toBe(cents);
  });

  it.each(['', '   ', '0', '0.00', 'abc', '12.345', '1.2.3', '-5', '2000000'])(
    'rejects %j (button stays disabled)',
    (input) => {
      expect(parseTargetPrice(input)).toBeNull();
    },
  );

  it('round-trips with centsToInput for editing an existing alert', () => {
    expect(parseTargetPrice(centsToInput(129_950))).toBe(129_950);
  });
});
