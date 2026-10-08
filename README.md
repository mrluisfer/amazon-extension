# Historial de Precios MX

Extensión de navegador (Chrome/Firefox/Edge) con historial de precios y alertas para Amazon México, construida con datos de la comunidad (crowdsourcing).

**Stack:** pnpm + Turborepo · WXT (MV3) + React 19 + Tailwind v4 + uPlot · Hono · Drizzle + Neon Postgres · Valibot · Biome · Vitest.

## Requisitos

- Node ≥ 22 (`.nvmrc`), pnpm 12 (`corepack enable`)
- Un proyecto en Neon con dos roles (ver `docs/security.md`)

## Primeros pasos

```bash
pnpm install

# 1. Base de datos
cp packages/db/.env.example packages/db/.env   # DATABASE_URL_MIGRATIONS (rol owner)
pnpm db:migrate

# 2. API
cp apps/api/.env.example apps/api/.env          # DATABASE_URL (rol app_runtime, pooled)
pnpm dev:api                                     # http://localhost:8787/health

# 3. Extensión
cp apps/extension/.env.example apps/extension/.env
pnpm dev:extension                               # abre Chrome con la extensión cargada
```

Abre cualquier producto en `https://www.amazon.com.mx/dp/...`: el panel aparece debajo del bloque principal del producto.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm check` | lint + typecheck + tests |
| `pnpm build` | build de la API (`apps/api/dist`) y de la extensión (`apps/extension/.output`) |
| `pnpm --filter @repo/extension zip` | genera el .zip para la Chrome Web Store |
| `pnpm db:generate` | genera una migración desde `packages/db/src/schema.ts` |
| `pnpm db:studio` | Drizzle Studio |

## Documentación

- [`docs/architecture.md`](docs/architecture.md) — flujo de datos, decisiones y cómo escalar
- [`docs/security.md`](docs/security.md) — modelo de amenazas, permisos, privacidad, roles de BD
- [`CLAUDE.md`](CLAUDE.md) y [`.claude/README.md`](.claude/README.md) — configuración para Claude Code
