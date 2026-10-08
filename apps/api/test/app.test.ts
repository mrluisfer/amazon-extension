import type { Database } from '@repo/db';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { MemoryRateLimiter } from '../src/lib/rate-limiter';

/** A db that fails loudly: these tests must never reach the database. */
const noDb = new Proxy({} as Database, {
  get() {
    throw new Error('database must not be touched in this test');
  },
});

function makeApp(overrides: { installsCapacity?: number } = {}) {
  return createApp({
    db: noDb,
    limiters: {
      installs: new MemoryRateLimiter(overrides.installsCapacity ?? 5, 0.0001),
      api: new MemoryRateLimiter(100, 1),
      ingest: new MemoryRateLimiter(100, 1),
    },
    config: {
      isProduction: true,
      allowedOrigins: ['chrome-extension://allowedid'],
      trustProxy: false,
    },
  });
}

describe('api app', () => {
  it('serves /health with security headers', async () => {
    const res = await makeApp().request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await makeApp().request('/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: 'not_found' } });
  });

  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['malformed token', 'Bearer pt_short'],
  ])('rejects %s with 401 before touching the db', async (_label, authorization) => {
    const res = await makeApp().request('/v1/tracked', {
      headers: authorization ? { authorization } : {},
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { code: 'unauthorized' } });
  });

  it('only reflects allow-listed origins in production', async () => {
    const app = makeApp();
    const allowed = await app.request('/health', {
      headers: { origin: 'chrome-extension://allowedid' },
    });
    const denied = await app.request('/health', {
      headers: { origin: 'chrome-extension://otherid' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('chrome-extension://allowedid');
    expect(denied.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('rate-limits anonymous installs per IP', async () => {
    const res = await makeApp({ installsCapacity: 0 }).request('/v1/installs', { method: 'POST' });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('rejects oversized bodies', async () => {
    const res = await makeApp().request('/v1/observations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': String(1024 * 1024) },
      body: 'x'.repeat(1024 * 1024),
    });
    expect(res.status).toBe(413);
  });
});
