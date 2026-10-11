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
| **Panel placement**: same slot as Keepa — after `#hover-zoom-end` (end of the above-the-fold block on every layout), directly above `#keepaContainer` when Keepa is installed (`lib/panel-anchor.ts`) | Users already know that position; both extensions coexist stacked, ours on top. Keepa injects ~50–100 ms after DCL, so a childList-only observer on `#dp-container` moves *our* node back above Keepa (never Keepa's). Box matches Keepa's: left-aligned, ≤960px, 10px top margin. |
| **Iframe panel** instead of injecting React into Amazon's DOM | Full CSS/JS isolation, out-of-process rendering (doesn't slow Amazon), page can't read our UI, heavy code (React, uPlot) never loads in the content script. Same approach as Keepa. |
| **Background is the only API client** | One place holds the token, validates, rate-limits and batches. Content scripts' `fetch` would also be subject to Amazon's CORS/CSP. |
| **Change-only price history** (`price_points`) | A row only when the price changes → orders of magnitude less storage than one row per observation. Raw reports are kept separately (`price_observations`) for corroboration and reprocessing, with retention. |
| **Compact wire format** (`history-codec.ts`) | Delta-encoded `[t, p, dt, p…]` integers; years of history in a few KB. |
| **List price as a derived series** (`offer_type = 'list'`) | Clients report `listPriceCents` on offers; the API derives one `list` item per product (buy-box report first, else Amazon) and runs it through the same change-only + anti-poisoning pipeline. Clients can't send `list` directly. A missing list price is ignored (not a gap) so a selector miss can't erase the line. |
| **Theming** (Sistema / Claro / Oscuro, panel only) | Semantic colors are `light-dark()` CSS tokens resolved by `color-scheme` on `<html data-theme>`: "Sistema" is pure CSS (no listeners). The preference lives in `chrome.storage` (synced across tabs) and is mirrored to extension-origin `localStorage` for a synchronous first paint (no flash). Only the uPlot canvas needs JS colors (`CHART_PALETTE`/`seriesFor`), rebuilt once per actual theme change, keeping range/zoom. |
| **Corroboration for suspicious jumps** | A single install can't crash a product's price to $1. Moves ≥2× or ≤½× need 2 distinct users within 24h. |
| **Server time for points** | Client clocks are untrusted; points stay monotonic per series. |
| **Valibot** over Zod | Tree-shakeable, smaller in the content script bundle; Standard Schema → works with `@hono/standard-validator`. |
| **Biome** over Oxc (oxlint + oxfmt), reviewed 2026-10 | One tool for lint, format, import sorting, JSON and CSS (incl. Tailwind directives); `oxfmt` was still 0.x (0.72). Vite 8 using Oxc internally doesn't matter here: linting/formatting share nothing with the build. Speed is a non-issue (~30 ms for the whole repo). Oxlint's one real edge is stable **type-aware** rules (`no-floating-promises`, `no-misused-promises`, via TypeScript 7). Revisit if unawaited-promise bugs show up (add oxlint for just those rules, keep Biome), or when oxfmt hits 1.0 / we adopt Vite+ (`vp lint`/`vp fmt`), migrating both at once. |
| **uPlot** (+ React overlay) over TanStack Charts / ECharts | Canvas, ~50 KB, hundreds of thousands of points, built-in drag-zoom and series toggling; stepped paths fit price data. TanStack Charts (first release 2026-07, 1.0 on 2026-10-03, SVG by default) was too young; ECharts is heavy. Keepa-style per-series hover labels are custom in any library, so they live in a React layer portaled into uPlot's plot area (`components/PriceChart.tsx`). Full history is fetched once; ranges/zoom are client-side windows. |
| **Anonymous tokens first** | Zero-friction install, no PII. `users.email` is reserved for adding optional login later (e.g. Better Auth) and linking the anonymous user. |

## Scaling path

1. **Rate limiting** — `MemoryRateLimiter` is per-process. With >1 API instance, implement `RateLimiter` over Redis/Upstash.
2. **Ingest volume** — move `ingestBatch` behind a queue (accept → enqueue → worker) and batch the per-observation queries.
3. **History reads** — data is identical for all users: add a CDN/edge cache keyed by `marketplace/asin/days`, or precompute encoded series on write.
4. **Storage** — partition `price_observations` by month and drop old partitions (retention). If `price_points` grows past ~10⁹ rows, consider TimescaleDB/ClickHouse.
5. **Alerts** — worker that, on each accepted point, checks `tracked_products` with `target_price_cents` (indexed) and sends email/Telegram/Web Push.

## Features beyond Keepa

### Hide sponsored content (search + product pages)

`search.content` runs on `/s?…` pages at `document_start` with two layers:

1. **`sponsored.css`** (manifest-injected before the DOM exists → no flash of ads) hides high-confidence ads with `:has()`: `.AdHolder`, results containing `.puis-sponsored-label-text`, `/sspa/click` links, sponsored-widget labels or the `aria-label="Anuncio patrocinado…"`.
2. **JS** (`findSponsoredContainers` in `@repo/amazon-parser`) tags whatever CSS can't express (localized "Patrocinado" leaf-text fallback, hashed `ctaSponsored` classes) with `data-ph-sponsored`, re-scanning on DOM mutations (coalesced to one scan per frame).

Turning the setting off sets `data-ph-show-sponsored` on `<html>`, which disables every rule instantly. A guard never hides `.s-main-slot`/`#search`. Selectors were verified on live amazon.com.mx pages (2026-10-08) and are covered by a real-capture fixture; the per-tab badge shows how many items were hidden.

**Product pages** (`product-sponsored.content`, separate from the price-panel script so its CSS lands at `document_start`) use `findSponsoredOnProductPage`, which picks the *most specific* unit: the outermost `[id^="ape_Detail_"]` ad placement, sponsored carousels (`[id^="sp_detail"]` → nearest `.celwidget[id*="_feature_div"]`), brand widgets (`sims-discoveryAndInspiration`, `aax-` links), and single sponsored `li.a-carousel-card`s inside organic carousels. Ads can live *inside* `#ppd` or the reviews widget, so a core/protected stop list (`#ppd`, `#centerCol`, `#rightCol`, buy box, price, reviews, "Comprados juntos") is never hidden nor anything containing it. Both page types share `lib/sponsored-hider.ts` (setting, observer, badge).

### Price alerts ("Avísame si baja de…")

- **Account required.** Anonymous installs can browse history and contribute prices, but alerts are tied to a person: `requireAccount` (users.email set) guards every `/v1/tracked` write/list → `403 account_required`. The panel asks to sign in instead of showing the form. *Sign-in itself is not implemented yet* — see `users.email` / Neon Auth.
- **Target price is mandatory** (schema-level, API and UI: the button stays disabled until `parseTargetPrice` accepts the input).
- **One alert per product.** The `(user_id, product_id)` unique constraint is the source of truth: `POST` uses `ON CONFLICT DO NOTHING` and returns `409 already_tracked`; changing the target is an explicit `PATCH` (which resets `last_notified_at`). The panel loads `GET /v1/tracked/by-product/:m/:asin` (account flag + existing alert in one request) and shows "Cambiar / Dejar de seguir" instead of the form.

## Roadmap ideas (differentiators vs Keepa)

Fake-discount detection (inflated list price before sales), review authenticity (Fakespot closed in 2025), cross-store comparison (Mercado Libre, Walmart MX, Liverpool), price-per-unit, inline history on search results, Telegram/WhatsApp alerts, best-time-to-buy prediction.
