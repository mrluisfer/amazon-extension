import type { AppType } from '@repo/api/app-type';
import type {
  ApiErrorBody,
  HistoryResponse,
  MarketplaceId,
  Observation,
  TrackedProduct,
  TrackingStatus,
  TrackProductInput,
} from '@repo/shared';
import { hc } from 'hono/client';
import { parseRetryAfter, registrationDelayMs } from './backoff';
import { API_URL } from './config';
import { authTokenItem, registrationBackoffItem } from './storage';

/** Background-only. Requests are typed end-to-end against the Hono app. */

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const publicClient = hc<AppType>(API_URL);
const authedClient = hc<AppType>(API_URL, {
  headers: async (): Promise<Record<string, string>> => ({
    Authorization: `Bearer ${await getToken()}`,
  }),
});

let registering: Promise<string> | null = null;

async function getToken(): Promise<string> {
  const existing = await authTokenItem.getValue();
  if (existing) return existing;
  // Single-flight: concurrent callers share one registration.
  registering ??= (async () => {
    // After a failure, don't hammer the API on every message: that burns the per-IP
    // install quota and trips Chrome's extension throttling on repeated 5xx.
    const backoff = await registrationBackoffItem.getValue();
    if (backoff && Date.now() < backoff.retryAt) {
      throw new ApiRequestError(503, 'registration_backoff', 'Registration temporarily paused');
    }
    let res: Response;
    try {
      res = await publicClient.v1.installs.$post();
    } catch (err) {
      await recordRegistrationFailure(backoff?.failures ?? 0, null);
      throw err;
    }
    if (!res.ok) {
      await recordRegistrationFailure(
        backoff?.failures ?? 0,
        parseRetryAfter(res.headers.get('retry-after')),
      );
      throw await toError(res);
    }
    const { token } = (await res.json()) as { token: string };
    await Promise.all([authTokenItem.setValue(token), registrationBackoffItem.setValue(null)]);
    return token;
  })().finally(() => {
    registering = null;
  });
  return registering;
}

async function recordRegistrationFailure(previous: number, retryAfterS: number | null) {
  const failures = previous + 1;
  await registrationBackoffItem.setValue({
    failures,
    retryAt: Date.now() + registrationDelayMs(failures, retryAfterS),
  });
}

async function toError(res: Response): Promise<ApiRequestError> {
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiRequestError(
    res.status,
    body?.error.code ?? 'http_error',
    body?.error.message ?? res.statusText,
  );
}

async function call<T>(request: () => Promise<Response>): Promise<T> {
  let res = await request();
  if (res.status === 401) {
    // Token revoked or DB reset: re-register once and retry.
    await authTokenItem.setValue(null);
    res = await request();
  }
  if (!res.ok) throw await toError(res);
  return (res.status === 204 ? null : await res.json()) as T;
}

export const api = {
  reportObservations: (observations: Observation[]) =>
    call<{ summary: Record<string, number> }>(() =>
      authedClient.v1.observations.$post({ json: { observations } }),
    ),

  history: (marketplace: MarketplaceId, asin: string, days: number) =>
    call<HistoryResponse>(() =>
      authedClient.v1.products[':marketplace'][':asin'].history.$get({
        param: { marketplace, asin },
        query: { days: String(days) },
      }),
    ),

  listTracked: () => call<{ items: TrackedProduct[] }>(() => authedClient.v1.tracked.$get()),

  track: (input: TrackProductInput) =>
    call<{ id: string }>(() => authedClient.v1.tracked.$post({ json: input })),

  trackingStatus: (marketplace: MarketplaceId, asin: string) =>
    call<TrackingStatus>(() =>
      authedClient.v1.tracked['by-product'][':marketplace'][':asin'].$get({
        param: { marketplace, asin },
      }),
    ),

  updateTracked: (id: string, targetPriceCents: number) =>
    call<{ id: string }>(() =>
      authedClient.v1.tracked[':id'].$patch({ param: { id }, json: { targetPriceCents } }),
    ),

  me: () =>
    call<{ userId: string; hasAccount: boolean; trackedCount: number }>(() =>
      authedClient.v1.me.$get(),
    ),

  untrack: (id: string) =>
    call<null>(() => authedClient.v1.tracked[':id'].$delete({ param: { id } })),

  deleteAccount: () => call<null>(() => authedClient.v1.me.$delete()),
};
