import { serve } from '@hono/node-server';
import { createDb } from '@repo/db';
import { createApp } from './app';
import { loadEnv } from './env';
import { createDefaultLimiters } from './lib/rate-limiter';

const env = loadEnv(process.env);
const { db, close } = createDb(env.DATABASE_URL);

const app = createApp({
  db,
  limiters: createDefaultLimiters(),
  config: {
    isProduction: env.NODE_ENV === 'production',
    allowedOrigins: env.ALLOWED_ORIGINS,
    trustProxy: env.TRUST_PROXY,
  },
});

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.info(`API listening on http://localhost:${info.port}`);
});

function shutdown(signal: string) {
  console.info(`${signal} received, shutting down`);
  server.close(() => {
    close().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
