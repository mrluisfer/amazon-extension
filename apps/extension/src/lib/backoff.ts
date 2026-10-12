const BASE_MS = 30_000;
const MAX_MS = 30 * 60_000;

/**
 * Delay before the next registration attempt: 30s, 1m, 2m… capped at 30m.
 * A server `Retry-After` (seconds, e.g. on 429) wins when it is longer.
 */
export function registrationDelayMs(failures: number, retryAfterS?: number | null): number {
  const exponential = Math.min(BASE_MS * 2 ** Math.max(0, failures - 1), MAX_MS);
  const server = retryAfterS != null && retryAfterS > 0 ? retryAfterS * 1000 : 0;
  return Math.min(Math.max(exponential, server), MAX_MS);
}

/** Parses a `Retry-After` header given in seconds (the HTTP-date form is ignored). */
export function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const s = Number(header);
  return Number.isFinite(s) && s >= 0 ? s : null;
}
