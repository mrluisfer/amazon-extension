---
name: new-marketplace
description: Add support for another Amazon country/marketplace (e.g. amazon.com, amazon.es). Use when the user wants the extension to work on a new Amazon domain.
---

# Add a marketplace

1. `packages/shared/src/marketplaces.ts` — add an entry to `MARKETPLACES` (`id`, `origin`, `hostname`, `currency`, `locale`). This automatically extends content-script matches, host permissions, WAR matches and CSP frame-ancestors in `apps/extension/wxt.config.ts`.
2. `packages/amazon-parser/src/selectors.ts` — add `MARKETPLACE_TEXT[<id>]`: decimal separator, "sold by Amazon" regex, in-stock / out-of-stock phrases in that language.
3. Fixtures + tests for the new locale (see the `amazon-parser` skill). At least: sold-by-Amazon page and out-of-stock page.
4. Database enum: `pnpm db:generate -- --name add_marketplace_<id>` (the `marketplace` pg enum gets a new value) → review → migrate (see `db-migration` skill).
5. `docs/security.md` — the new host permission must be listed with its justification. **Adding a host permission triggers a permission warning and re-review for existing users**; consider `optional_host_permissions` + runtime request if the marketplace is opt-in.
6. Update the extension name/description if it says "MX".
7. `pnpm check` and `pnpm build`, then inspect `.output/chrome-mv3/manifest.json`.
