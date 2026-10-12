import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env';
import { MemoryRateLimiter } from '../src/lib/rate-limiter';
import { generateToken, hashToken, isWellFormedToken } from '../src/lib/tokens';

describe('tokens', () => {
  it('generates unique, well-formed tokens with a stable hash', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(isWellFormedToken(a)).toBe(true);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
  });

  it.each(['', 'pt_', `xx_${'a'.repeat(43)}`, `pt_${'a'.repeat(42)}`, `pt_${'a'.repeat(42)}$`])(
    'rejects malformed token %j',
    (t) => expect(isWellFormedToken(t)).toBe(false),
  );
});

describe('MemoryRateLimiter', () => {
  it('refills over time and reports retry-after', async () => {
    let now = 0;
    const limiter = new MemoryRateLimiter(2, 1, 100, () => now);
    expect((await limiter.consume('k')).allowed).toBe(true);
    expect((await limiter.consume('k')).allowed).toBe(true);
    const denied = await limiter.consume('k');
    expect(denied).toEqual({ allowed: false, retryAfterSec: 1 });
    now += 1000;
    expect((await limiter.consume('k')).allowed).toBe(true);
  });

  it('bounds memory by evicting the oldest keys', async () => {
    const limiter = new MemoryRateLimiter(1, 0.001, 2);
    await limiter.consume('a');
    await limiter.consume('b');
    await limiter.consume('c'); // evicts "a"
    expect((await limiter.consume('a')).allowed).toBe(true);
  });
});

describe('loadEnv', () => {
  it('allows an empty ALLOWED_ORIGINS in production (CORS then admits no web origin)', () => {
    expect(loadEnv({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://x' })).toMatchObject({
      ALLOWED_ORIGINS: [],
    });
  });

  it('parses defaults and lists', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://x',
      ALLOWED_ORIGINS: 'chrome-extension://a, chrome-extension://b',
    });
    expect(env).toMatchObject({
      PORT: 8787,
      TRUST_PROXY: false,
      ALLOWED_ORIGINS: ['chrome-extension://a', 'chrome-extension://b'],
    });
  });

  it('never echoes secret values in errors', () => {
    expect(() => loadEnv({ DATABASE_URL: 'mysql://user:supersecret@host' })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('supersecret') }),
    );
  });
});
