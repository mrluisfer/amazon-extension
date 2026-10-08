# Historial de Precios MX

Extensión de navegador (Chrome/Firefox/Edge) con historial de precios y alertas para Amazon México, construida con datos de la comunidad (crowdsourcing).

**Stack:** pnpm + Turborepo · WXT (MV3) + React 19 + Tailwind v4 + uPlot · Hono · Drizzle + Neon Postgres · Valibot · Biome · Vitest.

## Requisitos

- Node ≥ 22 (`.nvmrc`), pnpm 12 (`corepack enable`)
- Neon CLI: `npm i -g neon && neon login` (proyecto `lingering-wildflower-57049207`)

## Primeros pasos

```bash
pnpm install

# 1. Vincular Neon (escribe .neon, ignorado por git). No baja secretos a disco:
neon link --project-id lingering-wildflower-57049207 --branch production --no-env-pull -y

# 2. Base de datos — neon-env inyecta DATABASE_URL_UNPOOLED de la rama vinculada
pnpm db:migrate

# 3. API — neon-env inyecta DATABASE_URL; apps/api/.env solo para PORT, ALLOWED_ORIGINS…
cp apps/api/.env.example apps/api/.env
pnpm dev:api                                     # http://localhost:8787/health

# 3. Extensión
cp apps/extension/.env.example apps/extension/.env
pnpm dev:extension                               # abre Chrome con la extensión cargada
```

Abre cualquier producto en `https://www.amazon.com.mx/dp/...`: el panel aparece debajo del bloque principal del producto.

### Flujo por ramas (Neon branch-first)

Crea una rama de Neon por cada rama de git que toque la base de datos; `pnpm db:migrate` y `pnpm dev:api` usan automáticamente la rama activa en `.neon`:

```bash
neon checkout feat-alerts --create --no-env-pull   # rama aislada copy-on-write
pnpm db:migrate && pnpm dev:api
neon diff                                          # cambios de esquema vs. la rama padre
neon checkout production --no-env-pull             # volver
```

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
