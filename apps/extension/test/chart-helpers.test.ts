import { describe, expect, it } from 'vitest';
import {
  formatAxisDate,
  formatAxisDates,
  formatAxisPrice,
  formatRelative,
  layoutTooltips,
} from '../src/lib/chart-format';
import { RANGES, rangeWindow, spanDays } from '../src/lib/chart-series';

const DAY = 86_400;
const range = (key: string) => RANGES.find((r) => r.key === key) as (typeof RANGES)[number];

describe('rangeWindow', () => {
  const xs = [0, 50 * DAY, 200 * DAY];

  it('takes the last N days of data', () => {
    expect(rangeWindow(xs, range('quarter'))).toEqual({ min: 110 * DAY, max: 200 * DAY });
  });

  it('never starts before the first point (young products)', () => {
    expect(rangeWindow(xs, range('year'))).toEqual({ min: 0, max: 200 * DAY });
    expect(rangeWindow(xs, range('all'))).toEqual({ min: 0, max: 200 * DAY });
  });

  it('keeps a minimum width when all data is a few minutes old', () => {
    expect(rangeWindow([1000, 1060], range('week'))).toEqual({ min: 1060 - 3600, max: 1060 });
  });

  it('handles empty data and reports total days', () => {
    expect(rangeWindow([], range('all'))).toBeNull();
    expect(spanDays(xs)).toBe(200);
    expect(spanDays([5])).toBe(1);
  });
});

describe('es-MX formatting', () => {
  it('formats axis prices without cents and dates as "16 jul"', () => {
    expect(formatAxisPrice(125_000, 'mx')).toBe('$1,250');
    expect(formatAxisDate(Date.UTC(2026, 6, 16, 18) / 1000, 'mx')).toBe('16 jul');
  });

  it('labels sub-day ticks with the time and the date only when the day changes', () => {
    // Local-time ticks every 8h, like uPlot picks for a few days of data.
    const at = (d: number, h: number) => new Date(2026, 9, d, h).getTime() / 1000;
    const splits = [at(9, 8), at(9, 16), at(10, 0), at(10, 8), at(10, 16), at(11, 0)];
    expect(formatAxisDates(splits, 'mx')).toEqual([
      '9 oct',
      '16:00',
      '10 oct',
      '08:00',
      '16:00',
      '11 oct',
    ]);
  });

  it('labels day-or-larger ticks with dates only', () => {
    const day = (d: number) => new Date(2026, 9, d).getTime() / 1000;
    expect(formatAxisDates([day(9), day(10), day(11)], 'mx')).toEqual([
      '9 oct',
      '10 oct',
      '11 oct',
    ]);
  });

  it('formats relative times', () => {
    const now = Date.parse('2026-10-08T12:00:00Z');
    expect(formatRelative('2026-10-08T11:44:00Z', 'mx', now)).toBe('hace 16 minutos');
    expect(formatRelative('2026-10-06T12:00:00Z', 'mx', now)).toBe('anteayer');
  });
});

describe('layoutTooltips', () => {
  it('stacks tooltips for equal prices without overlapping', () => {
    const placed = layoutTooltips(
      [
        { key: 'a', y: 100 },
        { key: 'b', y: 100 },
        { key: 'c', y: 100 },
      ],
      36,
      400,
    );
    const tops = placed.map((p) => p.top);
    expect(tops[1]).toBeGreaterThanOrEqual((tops[0] as number) + 36);
    expect(tops[2]).toBeGreaterThanOrEqual((tops[1] as number) + 36);
  });

  it('keeps the stack inside the plot', () => {
    const placed = layoutTooltips(
      [
        { key: 'a', y: 240 },
        { key: 'b', y: 245 },
      ],
      36,
      250,
    );
    expect(Math.max(...placed.map((p) => p.top + 36))).toBeLessThanOrEqual(250);
  });
});
