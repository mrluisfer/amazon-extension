import * as v from 'valibot';

const EnvSchema = v.object({
  NODE_ENV: v.optional(v.picklist(['development', 'test', 'production']), 'development'),
  PORT: v.optional(
    v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1), v.maxValue(65_535)),
    '8787',
  ),
  /** Runtime connection: pooled Neon URL with the least-privileged app role. */
  DATABASE_URL: v.pipe(v.string(), v.startsWith('postgres', 'DATABASE_URL must be a postgres URL')),
  /**
   * Origins allowed to read API responses via CORS, comma-separated, e.g.
   * "chrome-extension://abcdef...,moz-extension://...". Optional: the extension's
   * background calls the API with host permissions, which are exempt from CORS, so
   * an empty list (no web origin can read responses) is the safest default.
   */
  ALLOWED_ORIGINS: v.optional(
    v.pipe(
      v.string(),
      v.transform((s) =>
        s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ),
    '',
  ),
  /** Only enable behind a proxy you control (it makes X-Forwarded-For trusted). */
  TRUST_PROXY: v.optional(
    v.pipe(
      v.picklist(['true', 'false']),
      v.transform((x) => x === 'true'),
    ),
    'false',
  ),
});

export type Env = v.InferOutput<typeof EnvSchema>;

export function loadEnv(source: Record<string, string | undefined>): Env {
  const result = v.safeParse(EnvSchema, source);
  if (!result.success) {
    const issues = result.issues.map((i) => `${v.getDotPath(i) ?? '?'}: ${i.message}`).join('\n  ');
    throw new Error(`Invalid environment:\n  ${issues}`);
  }
  const env = result.output;
  return env;
}
