---
name: add-api-endpoint
description: Add a new endpoint to the Hono API and expose it to the extension end-to-end (shared schema, route, typed client, background message, tests). Use whenever a feature needs new server data or a new write.
---

# Add an API endpoint

Follow these steps in order. Each step names the file to touch.

1. **Schema** — `packages/shared/src/schemas.ts`: add a Valibot schema for the input (params/query/body). Bound every string length, array size and number range. Response types go in `packages/shared/src/api-types.ts`.
2. **Route** — `apps/api/src/routes/<resource>.ts`:
   - `new Hono<AppEnv>()` chained style (required for RPC types).
   - Middleware order: `requireAuth` → `rateLimit('api' | 'ingest', byUser)` → `sValidator(target, Schema, validationHook)`.
   - Scope every query by `c.var.auth.userId` when touching user data (prevents IDOR).
   - Throw `ApiError`/`notFound()` from `src/lib/errors.ts`; never return raw DB errors.
   - Business logic that can be pure goes in `src/services/` so it can be unit-tested.
3. **Mount** — `apps/api/src/app.ts`: `.route('/<resource>', resourceRoute)` on the `v1` app.
4. **Client** — `apps/extension/src/lib/api-client.ts`: add a method on `api` using `authedClient` (typed via `AppType`).
5. **Message** — `apps/extension/src/lib/messaging.ts`: add an entry to `messages` (input schema + allowed `from` senders) and its output type to `MessageOutputs`. Content scripts only get `'content'` messages that carry no secrets back.
6. **Handler** — `apps/extension/src/entrypoints/background.ts`: implement the handler (TypeScript will force it).
7. **Tests** — `apps/api/test/`: at minimum 401 without token, 400 on invalid input, and the service logic. Use `createApp()` with the `noDb` proxy pattern from `app.test.ts` for paths that must not hit the DB.
8. Run `pnpm check`.

## Security checklist (answer before finishing)

- Does it leak data of other users? (query scoped by userId?)
- Is the input fully bounded? (sizes, ranges, enums)
- Is it rate-limited with the right bucket?
- Could a malicious Amazon page trigger it via the content script? If yes, is that acceptable?
