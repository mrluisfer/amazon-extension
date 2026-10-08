# Architecture

## Data flow

```
 amazon.com.mx product page
 ┌──────────────────────────────────────────────┐
 │ content script (isolated world, ~20 KB)      │
 │  parseProductPage() → toObservations()       │──┐ sendMessage('observations:report')
 │  mounts <iframe src=panel.html#m=mx&asin=…>  │  │
 │  ┌────────────────────────────────────────┐  │  │
 │  │ panel (extension origin, own process)  │──┼──┤ sendMessage('history:get' | 'tracked:add')
 │  │ React + uPlot                          │  │  │
 │  └────────────────────────────────────────┘  │  │
 └──────────────────────────────────────────────┘  ▼
                         background service worker
                         - validates every message (schema + sender kind)
                         - owns the bearer token
                         - queues observations (consent-gated), flushes every 1 min
                                     │ HTTPS, typed hono/client
                                     ▼
                         Hono API (apps/api)
                         - anonymous install tokens (hashed)
                         - rate limits per IP / per user
                         - ingest: dedupe → anti-poisoning → change-only points
                                     │
                                     ▼
                         Neon Postgres (packages/db)
```

## Key decisions

| Decision | Why |
|---|---|
| **Iframe panel** instead of injecting React into Amazon's DOM | Full CSS/JS isolation, out-of-process rendering (doesn't slow Amazon), page can't read our UI, heavy code (React, uPlot) never loads in the content script. Same approach as Keepa. |
| **Background is the only API client** | One place holds the token, validates, rate-limits and batches. Content scripts' `fetch` would also be subject to Amazon's CORS/CSP. |
| **Change-only price history** (`price_points`) | A row only when the price changes → orders of magnitude less storage than one row per observation. Raw reports are kept separately (`price_observations`) for corroboration and reprocessing, with retention. |
| **Compact wire format** (`history-codec.ts`) | Delta-encoded `[t, p, dt, p…]` integers; years of history in a few KB. |
| **Corroboration for suspicious jumps** | A single install can't crash a product's price to $1. Moves ≥2× or ≤½× need 2 distinct users within 24h. |
| **Server time for points** | Client clocks are untrusted; points stay monotonic per series. |
| **Valibot** over Zod | Tree-shakeable, smaller in the content script bundle; Standard Schema → works with `@hono/standard-validator`. |
| **uPlot** | Canvas, ~50 KB, handles hundreds of thousands of points; stepped paths fit price data. |
| **Anonymous tokens first** | Zero-friction install, no PII. `users.email` is reserved for adding optional login later (e.g. Better Auth) and linking the anonymous user. |

## Scaling path

1. **Rate limiting** — `MemoryRateLimiter` is per-process. With >1 API instance, implement `RateLimiter` over Redis/Upstash.
2. **Ingest volume** — move `ingestBatch` behind a queue (accept → enqueue → worker) and batch the per-observation queries.
3. **History reads** — data is identical for all users: add a CDN/edge cache keyed by `marketplace/asin/days`, or precompute encoded series on write.
4. **Storage** — partition `price_observations` by month and drop old partitions (retention). If `price_points` grows past ~10⁹ rows, consider TimescaleDB/ClickHouse.
5. **Alerts** — worker that, on each accepted point, checks `tracked_products` with `target_price_cents` (indexed) and sends email/Telegram/Web Push.

## Roadmap ideas (differentiators vs Keepa)

Fake-discount detection (inflated list price before sales), review authenticity (Fakespot closed in 2025), cross-store comparison (Mercado Libre, Walmart MX, Liverpool), price-per-unit, inline history on search results, Telegram/WhatsApp alerts, best-time-to-buy prediction.
