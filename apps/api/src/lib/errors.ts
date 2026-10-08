import type { ApiErrorBody } from '@repo/shared';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class ApiError extends HTTPException {
  constructor(
    status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(status, { message });
  }
}

export const unauthorized = () => new ApiError(401, 'unauthorized', 'Missing or invalid token');
export const notFound = (what = 'Resource') => new ApiError(404, 'not_found', `${what} not found`);

export function errorBody(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

export function handleError(err: Error, c: Context) {
  if (err instanceof ApiError) {
    return c.json(errorBody(err.code, err.message), err.status);
  }
  if (err instanceof HTTPException) {
    return c.json(errorBody('http_error', err.message || 'Request failed'), err.status);
  }
  // Never leak internals (stack traces, SQL) to clients.
  console.error(`[${c.get('requestId') ?? '-'}]`, err);
  return c.json(errorBody('internal_error', 'Internal server error'), 500);
}

/** Shared hook for @hono/standard-validator so every 400 has the same shape. */
export function validationHook(
  result: { success: boolean; error?: ReadonlyArray<{ message: string }> },
  c: Context,
) {
  if (!result.success) {
    const message = result.error?.[0]?.message ?? 'Invalid request';
    return c.json(errorBody('invalid_request', message), 400);
  }
}
