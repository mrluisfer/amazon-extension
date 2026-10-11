# Brand & UI guidelines

Goal: our UI should feel like **part of Amazon's page** (same palette, type and
component shapes) while being clearly **our own product** (own mark, own name,
explicit non-affiliation). Everything lives in `packages/brand` (`@repo/brand`), shared by
the extension and the website: import components from `@repo/brand` and the
Tailwind theme with `@import "@repo/brand/theme.css";`. Use tokens, never raw hex.

## Logo

| Asset | Where |
|---|---|
| Master mark (≥32px) | `packages/brand/assets/icon.svg` (also the website favicon) |
| Small mark (16–20px) | `packages/brand/assets/icon-16.svg` |
| React | `LogoMark` / `Logo` (mark + wordmark) from `@repo/brand` |
| Manifest PNGs | `apps/extension/public/icon/{16,32,48,128}.png` — generated, don't edit |

- **Concept:** a descending price staircase (price history going down) ending on
  a yellow dot (today's price), on a squid-ink rounded tile.
- **Wordmark:** "Historial de Precios" bold + orange `MX` tag. Text color is inherited.
- After editing a brand SVG, regenerate PNGs: `pnpm --filter @repo/extension icons`
  (keep `Logo.tsx` geometry and `apps/web/public/favicon.svg` in sync).
- Minimum clear space: ¼ of the tile size. Don't recolor, rotate, outline or
  place the mark on orange/yellow backgrounds.

## Amazon trademarks — hard rules

Required by the Chrome Web Store impersonation policy and Amazon's trademark terms:

- Never use Amazon's logo, the smile/arrow, "Prime" or the Amazon Ember font files.
- Never put "Amazon" in our name or icon. Referring to "Amazon México" in copy is fine.
- Every full page (options, website, store listing) shows the non-affiliation
  notice (see `OptionsApp.tsx` and `apps/web/app/components/SiteFooter.tsx`).

## Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `ink-deep` / `ink` | `#131921` / `#232F3E` | same | Header bar / sub-header, logo tile |
| `brand` | `#FF9900` | same | Marks, active tab/range, bullets. **Not text on white** |
| `highlight` | `#FFD814` | same | Primary button (Amazon "Agregar al carrito"), logo dot |
| `link` | `#007185` | `#5EC8DB` | Links, inline actions, focus ring |
| `link-hover` | `#C7511F` | `#FFB84D` | Link hover |
| `success` / `danger` | `#067D62` / `#CC0C39` | `#3ECFA4` / `#FF6B81` | States, switch on, destructive |
| `fg` / `fg-muted` | `#0F1111` / `#565959` | `#F2F4F5` / `#A7B1BC` | Text |
| `line` | `#D5D9D9` | `#37475A` | Borders |
| `surface` / `canvas` | `#FFF` / `#F7FAFA` | `#131921` / `#0C1117` | Cards / page background |

Light values are Amazon's own UI colors. Amazon has no dark mode; ours is built
on its header navy. Chart series colors (`lib/chart-series.ts`) follow Keepa's
conventions, not the brand palette, so Keepa users read the chart instantly.

## Type

`"Amazon Ember", Arial, sans-serif` — the same stack Amazon falls back to (we
don't bundle Ember). Headings bold, body 13–14px, panel 12px.

## Components (CSS utilities in `packages/brand/src/theme.css`)

- `btn btn-primary` — yellow pill; one per section. `btn btn-secondary` — white pill
  with Amazon's soft shadow. `btn btn-danger` — outlined red, destructive only.
  Size with utilities: `btn btn-primary px-3 py-1`.
- `link` — teal inline action (replaces underlined grey text buttons).
- `card` — white, 1px `line` border, 8px radius.
- `input` — 8px radius, inset shadow, teal focus halo.
- `switch` — on `<input type="checkbox" role="switch" aria-checked>`; green when on.
- Icons: `packages/brand/src/icons.tsx` (24px grid, 2px strokes, `currentColor`).
  No emoji in UI — they render differently per OS.

## Voice

Spanish (es-MX), tú, short and concrete ("Avísame si baja de", "Dejar de seguir").
Privacy copy states what we send and what we never send.
