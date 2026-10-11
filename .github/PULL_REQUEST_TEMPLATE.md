<!-- PR title must follow Conventional Commits, e.g. "fix(parser): read deal price on lightning offers".
     It becomes the squash-merge commit message. -->

## What and why

<!-- What does this change and why? Link the issue: "Closes #123". -->

## How to test

<!-- Steps a reviewer can follow. Include product URLs/ASINs for parser or panel changes. -->

## Screenshots

<!-- For UI changes: before / after, light and dark if relevant. Remove personal data. -->

## Checklist

- [ ] `pnpm check` passes
- [ ] Tests added or updated (parser changes include a sanitised fixture)
- [ ] Data crossing content script → background → API is validated with `@repo/shared` schemas
- [ ] No new permissions — or justified in `docs/security.md`
- [ ] Data collection unchanged — or `apps/web/app/routes/privacy.tsx` and `docs/security.md` updated
- [ ] UI copy in Spanish (es-MX), uses `@repo/brand` tokens/components
- [ ] AI-assisted? I reviewed and understand every line
