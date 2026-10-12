import { describe, expect, it } from 'vitest';
import { parseRetryAfter, registrationDelayMs } from '../src/lib/backoff';

describe('registration backoff', () => {
  it('doubles from 30s and caps at 30 minutes', () => {
    expect(registrationDelayMs(1)).toBe(30_000);
    expect(registrationDelayMs(2)).toBe(60_000);
    expect(registrationDelayMs(3)).toBe(120_000);
    expect(registrationDelayMs(20)).toBe(30 * 60_000);
  });

  it('honours a longer Retry-After, still capped', () => {
    expect(registrationDelayMs(1, 3600)).toBe(30 * 60_000);
    expect(registrationDelayMs(1, 120)).toBe(120_000);
    expect(registrationDelayMs(3, 10)).toBe(120_000); // exponential is longer
  });

  it('parses Retry-After seconds and ignores anything else', () => {
    expect(parseRetryAfter('720')).toBe(720);
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('Wed, 21 Oct 2026 07:28:00 GMT')).toBeNull();
    expect(parseRetryAfter('-5')).toBeNull();
  });
});
