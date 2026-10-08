export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

/**
 * Abstraction so the in-memory implementation can be swapped for a shared
 * store (Redis/Upstash) once the API runs on more than one instance.
 */
export interface RateLimiter {
  consume(key: string, cost?: number): Promise<RateLimitResult>;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

/**
 * Token bucket, per process. Bounded memory: least-recently-used keys are
 * evicted beyond `maxKeys` (Map preserves insertion order).
 */
export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
    private readonly maxKeys = 50_000,
    private readonly now: () => number = Date.now,
  ) {}

  async consume(key: string, cost = 1): Promise<RateLimitResult> {
    const now = this.now();
    const existing = this.buckets.get(key);
    const bucket = existing ?? { tokens: this.capacity, updatedAt: now };
    if (existing) this.buckets.delete(key);

    const elapsedSec = (now - bucket.updatedAt) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSec * this.refillPerSec);
    bucket.updatedAt = now;

    let result: RateLimitResult;
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      result = { allowed: true, retryAfterSec: 0 };
    } else {
      result = {
        allowed: false,
        retryAfterSec: Math.ceil((cost - bucket.tokens) / this.refillPerSec),
      };
    }

    this.buckets.set(key, bucket);
    if (this.buckets.size > this.maxKeys) {
      const oldest = this.buckets.keys().next().value;
      if (oldest !== undefined) this.buckets.delete(oldest);
    }
    return result;
  }
}

export interface Limiters {
  /** Anonymous registrations, keyed by client IP. */
  installs: RateLimiter;
  /** General authenticated reads, keyed by user. */
  api: RateLimiter;
  /** Crowdsourced writes, keyed by user. */
  ingest: RateLimiter;
}

export function createDefaultLimiters(): Limiters {
  return {
    installs: new MemoryRateLimiter(5, 5 / 3600), // 5 per hour per IP
    api: new MemoryRateLimiter(120, 2), // burst 120, 2 req/s sustained
    ingest: new MemoryRateLimiter(30, 0.5), // burst 30 batches, 1 batch / 2s sustained
  };
}
