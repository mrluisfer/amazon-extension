import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { timeout } from 'hono/timeout';
import { ApiError, errorBody, handleError } from './lib/errors';
import { installsRoute } from './routes/installs';
import { meRoute } from './routes/me';
import { observationsRoute } from './routes/observations';
import { productsRoute } from './routes/products';
import { trackedRoute } from './routes/tracked';
import type { AppConfig, AppEnv, Deps } from './types';

function isAllowedOrigin(origin: string, config: AppConfig): boolean {
  if (config.allowedOrigins.includes(origin)) return true;
  // Unpacked dev builds get random extension IDs; only tolerated outside production.
  return !config.isProduction && /^(chrome|moz)-extension:\/\/[a-z0-9-]+$/i.test(origin);
}

export function createApp(deps: Deps) {
  const v1 = new Hono<AppEnv>()
    .route('/installs', installsRoute)
    .route('/me', meRoute)
    .route('/observations', observationsRoute)
    .route('/products', productsRoute)
    .route('/tracked', trackedRoute);

  const app = new Hono<AppEnv>()
    .use(requestId())
    .use(logger())
    .use(secureHeaders())
    .use(
      cors({
        origin: (origin) => (origin && isAllowedOrigin(origin, deps.config) ? origin : null),
        allowMethods: ['GET', 'POST', 'DELETE'],
        allowHeaders: ['Authorization', 'Content-Type'],
        maxAge: 600,
      }),
    )
    .use(
      bodyLimit({
        maxSize: 64 * 1024,
        onError: () => {
          throw new ApiError(413, 'payload_too_large', 'Payload too large');
        },
      }),
    )
    .use(timeout(10_000))
    .use(async (c, next) => {
      c.set('deps', deps);
      await next();
    })
    .get('/health', (c) => c.json({ ok: true }))
    .route('/v1', v1);

  app.notFound((c) => c.json(errorBody('not_found', 'Route not found'), 404));
  app.onError(handleError);

  return app;
}

export type App = ReturnType<typeof createApp>;
