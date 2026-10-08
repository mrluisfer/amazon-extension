import { createHash, randomBytes } from 'node:crypto';

const PREFIX = 'pt_';
const TOKEN_RE = /^pt_[A-Za-z0-9_-]{43}$/;

/** 256-bit random bearer token. The prefix makes leaked tokens greppable by secret scanners. */
export function generateToken(): string {
  return PREFIX + randomBytes(32).toString('base64url');
}

/** Cheap shape check so malformed tokens never reach the database. */
export function isWellFormedToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

/**
 * Tokens are high-entropy random values, so a fast unsalted hash is the
 * standard choice (same as GitHub/Stripe API keys); bcrypt/argon2 is for
 * low-entropy passwords.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
