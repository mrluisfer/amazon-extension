import { describe, expect, it } from 'vitest';
import { stepIndex, valueExtent } from '../src/lib/chart-data';

describe('stepIndex', () => {
  const xs = [100, 200, 300];
  it('returns the price in effect (last timestamp ≤ x)', () => {
    expect(stepIndex(xs, 100)).toBe(0);
    expect(stepIndex(xs, 250)).toBe(1);
    expect(stepIndex(xs, 300)).toBe(2);
    expect(stepIndex(xs, 10_000)).toBe(2);
  });
  it('is null before the first point or without data', () => {
    expect(stepIndex(xs, 99)).toBeNull();
    expect(stepIndex([], 100)).toBeNull();
  });
});

describe('valueExtent', () => {
  const amazon = [null, 2000, 1900, 1950];
  const used = [1800, 1800, null, 1700];
  it('covers the window plus the value in effect at its left edge', () => {
    expect(valueExtent([amazon, used], 2, 3)).toEqual([1700, 2000]);
    expect(valueExtent([amazon], 0, 0)).toBeNull();
  });
  it('ignores series that are not passed in (e.g. list price)', () => {
    const list = [2899, 2899, 2899, 2899];
    expect(valueExtent([amazon], 1, 3)).toEqual([1900, 2000]);
    expect(valueExtent([amazon, list], 1, 3)).toEqual([1900, 2899]);
  });
});
