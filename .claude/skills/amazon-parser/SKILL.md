---
name: amazon-parser
description: Fix or extend the Amazon product-page parser (price, title, availability, seller selectors) and add regression fixtures. Use when prices are missing/wrong on some pages, Amazon changed its layout, or a new field must be extracted.
---

# Amazon parser maintenance

Code: `packages/amazon-parser/src/` — `selectors.ts` (selector chains + locale text), `product-page.ts` (extraction), `price.ts`, `url.ts`.
Tests: `packages/amazon-parser/test/` with HTML fixtures in `test/fixtures/`.

## Workflow

1. **Reproduce with a fixture first.** Get the page HTML:
   - Ask the user to save it (Chrome: right-click → "Save as… → Webpage, HTML only"), or
   - Use the `amazon-dom-researcher` agent (Claude in Chrome) to extract the relevant DOM fragment.
2. **Minimise and sanitise** the fixture: keep only the elements the parser reads (`#ppd`, price blocks, `#availability`, buy box, `#ASIN`). Strip scripts, tracking params, session IDs, any personal data (name, address, "Deliver to …", cart). Name it `<marketplace>-<scenario>.html` and add a comment saying whether it's real or synthetic and the capture date.
3. **Write the failing test** in `test/product-page.test.ts`.
4. **Fix** by adding a selector to the *front* of the relevant chain in `selectors.ts` (keep old ones as fallbacks — Amazon A/B tests layouts for months). Locale-specific text (Spanish strings) goes in `MARKETPLACE_TEXT`.
5. `pnpm --filter @repo/amazon-parser test` and `typecheck`.

## Rules

- Parser is **read-only**: no DOM mutation, no `innerHTML`, no network.
- Unknown is better than wrong: return `null`/`'unknown'` instead of guessing. The API's corroboration logic handles missing data; it can't detect a silently wrong price.
- Prices are integer cents via `parsePriceToCents`; never `parseFloat` money.
- Keep the content-script bundle small: no new runtime dependencies here.
