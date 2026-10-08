import type { Database } from '@repo/db';
import type { RequestIdVariables } from 'hono/request-id';
import type { Limiters } from './lib/rate-limiter';

export interface AppConfig {
  isProduction: boolean;
  allowedOrigins: string[];
  trustProxy: boolean;
}

export interface Deps {
  db: Database;
  limiters: Limiters;
  config: AppConfig;
}

export interface AuthContext {
  userId: string;
  tokenId: string;
}

export interface AppEnv {
  Variables: RequestIdVariables & {
    deps: Deps;
    auth: AuthContext;
  };
}
