import type { HistoryResponse } from '@repo/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaders, fakeAuthDb, makeTestApp } from './helpers';

const getHistory = vi.fn<() => Promise<HistoryResponse>>();
vi.mock('../src/services/history', () => ({ getHistory: () => getHistory() }));

const app = makeTestApp(fakeAuthDb({ hasAccount: false }));
const headers = authHeaders();
const url = '/v1/products/mx/B0CHX1W1XY/history?days=365';

const history = (series: number[], generatedAt: string): HistoryResponse => ({
  product: {
    marketplace: 'mx',
    asin: 'B0CHX1W1XY',
    title: 'x',
    imageUrl: null,
    lastObservedAt: null,
  },
  series: { amazon: [], new: series, used: [], list: [] },
  generatedAt,
});

describe('history caching', () => {
  beforeEach(() => getHistory.mockReset());

  it('forces revalidation instead of serving stale (e.g. empty) history', async () => {
    getHistory.mockResolvedValue(history([], '2026-10-08T00:00:00Z'));
    const res = await app.request(url, { headers });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-cache');
    expect(res.headers.get('etag')).toMatch(/^W\/".+"$/);
  });

  it('returns 304 when data is unchanged even if generatedAt differs', async () => {
    getHistory.mockResolvedValueOnce(history([100, 5], '2026-10-08T00:00:00Z'));
    const first = await app.request(url, { headers });
    const etag = first.headers.get('etag') ?? '';

    getHistory.mockResolvedValueOnce(history([100, 5], '2026-10-08T00:05:00Z'));
    const second = await app.request(url, { headers: { ...headers, 'if-none-match': etag } });
    expect(second.status).toBe(304);
    expect(await second.text()).toBe('');
  });

  it('returns fresh data once new prices arrive', async () => {
    getHistory.mockResolvedValueOnce(history([], '2026-10-08T00:00:00Z'));
    const etag = (await app.request(url, { headers })).headers.get('etag') ?? '';

    getHistory.mockResolvedValueOnce(history([100, 5], '2026-10-08T00:01:00Z'));
    const res = await app.request(url, { headers: { ...headers, 'if-none-match': etag } });
    expect(res.status).toBe(200);
    expect(((await res.json()) as HistoryResponse).series.new).toEqual([100, 5]);
  });
});
