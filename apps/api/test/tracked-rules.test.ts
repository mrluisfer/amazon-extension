import { describe, expect, it } from 'vitest';
import { authHeaders, fakeAuthDb, makeTestApp } from './helpers';

const body = (data: unknown) => JSON.stringify(data);
const track = { marketplace: 'mx', asin: 'B0CHX1W1XY', targetPriceCents: 99_900 };

describe('price alerts require an account', () => {
  const anonymous = makeTestApp(fakeAuthDb({ hasAccount: false }));

  it.each([
    ['GET', '/v1/tracked', undefined],
    ['POST', '/v1/tracked', body(track)],
    ['PATCH', '/v1/tracked/0b9c2a3e-8d1f-4a5b-9c6d-7e8f9a0b1c2d', body({ targetPriceCents: 1000 })],
    ['DELETE', '/v1/tracked/0b9c2a3e-8d1f-4a5b-9c6d-7e8f9a0b1c2d', undefined],
  ])('%s %s → 403 account_required without touching data', async (method, path, payload) => {
    const res = await anonymous.request(path, { method, headers: authHeaders(), body: payload });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: { code: 'account_required' } });
  });

  it('by-product status works without an account and reports hasAccount=false', async () => {
    const res = await anonymous.request('/v1/tracked/by-product/mx/B0CHX1W1XY', {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hasAccount: false, item: null });
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });
});

describe('price alerts need a target price', () => {
  const withAccount = makeTestApp(fakeAuthDb({ hasAccount: true }));

  it.each([
    ['missing', { marketplace: 'mx', asin: 'B0CHX1W1XY' }],
    ['null', { ...track, targetPriceCents: null }],
    ['zero', { ...track, targetPriceCents: 0 }],
    ['fractional cents', { ...track, targetPriceCents: 10.5 }],
  ])('rejects a %s target with 400 before the database', async (_label, payload) => {
    const res = await withAccount.request('/v1/tracked', {
      method: 'POST',
      headers: authHeaders(),
      body: body(payload),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: 'invalid_request' } });
  });

  it('rejects an update without a valid target', async () => {
    const res = await withAccount.request('/v1/tracked/0b9c2a3e-8d1f-4a5b-9c6d-7e8f9a0b1c2d', {
      method: 'PATCH',
      headers: authHeaders(),
      body: body({}),
    });
    expect(res.status).toBe(400);
  });
});
