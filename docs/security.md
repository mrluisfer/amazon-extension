# Security & privacy

## Threat model (short)

| Threat | Mitigation |
|---|---|
| Hostile/compromised Amazon page DOM feeds the content script | Parser is read-only; output validated with Valibot (`ObservationSchema`) in the content script **and** again in the background **and** again in the API. Image URLs restricted to Amazon CDN over https. |
| Web page or other extension sends messages to our background | `messaging.ts` rejects senders whose `sender.id` isn't ours; each message type has an allow-list of sender kinds (`content` = Amazon tab, `extension` = our pages). Content scripts cannot read history/tracked data or the token. |
| Token theft | Token lives only in `chrome.storage.local`, read only by the background. Server stores SHA-256 hashes; tokens are revocable (`POST /v1/me/logout`). `pt_` prefix enables secret scanning. |
| Data poisoning (fake prices) | Per-user ingest rate limit; batch size cap; server-side freshness window; suspicious moves need corroboration from ≥2 users; raw observations retained per user for abuse analysis/rollback. |
| API abuse / scraping our dataset | Auth required on all data routes; per-user and per-IP token buckets; body size limit (64 KB); request timeout. |
| Malicious extension update (hijacked CWS account — Cyberhaven, Dec 2024) | 2FA with hardware key on the developer account; **opt into Verified CRX Uploads** and keep the signing key (`*.pem`, git-ignored) outside CI logs; publish from CI only. |
| Supply-chain (npm worms) | `minimumReleaseAge: 1440` in pnpm; dependency build scripts blocked by default (`allowBuilds`); lockfile committed; small dependency set, nothing heavy in the content script. |
| XSS in extension pages | MV3 default (no remote code) + explicit production CSP (`script-src 'self'`, `connect-src` = API only, `frame-ancestors` = Amazon). React escaping; `noDangerouslySetInnerHtml` is a lint error. |

## Manifest permissions (keep in sync with the store listing)

| Permission | Justification |
|---|---|
| `storage` | Consent choice, anonymous token, pending observation queue. |
| `alarms` | Periodic batched upload of observations (MV3 service workers are ephemeral). |
| `https://www.amazon.com.mx/*` | Read prices on product pages and show the history panel. |
| API origin | Background calls to our API. |
| `web_accessible_resources: panel.html` (Amazon only) | The history panel iframe. |

Not requested on purpose: `tabs`, `scripting`, `<all_urls>`, `cookies`, `webRequest`, `history`.

## Data collected (keep in sync with OptionsApp.tsx and the privacy policy)

- **With consent only:** ASIN, title, image URL, displayed prices (new/used/Amazon/list), availability, observation time — from Amazon product pages.
- **Always (core function):** the ASIN of the product being viewed is sent to fetch its history.
- Linked to a random install ID, not to identity. No browsing history, no Amazon account data, no cookies.
- Erasure: `DELETE /v1/me` (button in options) removes the user, tokens and watchlist; past observations are kept with `user_id = NULL`.
- **Retention (to implement):** delete `price_observations` older than 90 days (keep `price_points`).

## Database roles (Neon)

- **Local dev today:** `neon-env run` injects the branch's default `neondb_owner` credentials at runtime (nothing written to disk). Fine for development branches; **not** for the deployed API.
- `owner` / migrator → only for `pnpm db:migrate` (`DATABASE_URL_MIGRATIONS` override in CI), never deployed with the API.
- `app_runtime` → used by the API (`DATABASE_URL`): `SELECT, INSERT, UPDATE, DELETE` on app tables, `USAGE` on sequences; no DDL.

```sql
CREATE ROLE app_runtime LOGIN PASSWORD '…';
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
```

## Chrome Web Store policy notes

- **User Data Policy:** prominent disclosure + affirmative consent before collection → options page opens on install; nothing is sent until "Aceptar".
- **Affiliate policy (enforced since 2025-06-10):** if affiliate links are added, they must be disclosed in the listing and UI and applied **only after an explicit user action** with a real benefit. Never rewrite links silently.
- Single purpose: price history and alerts for Amazon. New unrelated features may need a separate extension.

## Known gaps / TODO

- [ ] Retention job for `price_observations`.
- [ ] Shared-store rate limiter before running >1 API instance.
- [ ] Evaluate `use_dynamic_url` for `web_accessible_resources` (anti-fingerprinting) once tested with the iframe flow.
- [ ] Reputation score per install (weight corroboration by account age/accuracy).
- [ ] Pin GitHub Actions to commit SHAs.
