import type { Observation } from '@repo/shared';
import { storage } from 'wxt/utils/storage';

export type Consent = 'unknown' | 'granted' | 'denied';

/**
 * Opt-in for contributing prices (Chrome Web Store "prominent disclosure"
 * requirement). Nothing is queued or sent unless this is "granted".
 */
export const consentItem = storage.defineItem<Consent>('local:crowdsourcingConsent', {
  fallback: 'unknown',
  version: 1,
});

/** Opaque anonymous bearer token. Never exposed to content scripts or pages. */
export const authTokenItem = storage.defineItem<string | null>('local:authToken', {
  fallback: null,
  version: 1,
});

/** Pending crowdsourced observations, flushed in batches by the background. */
export const observationQueueItem = storage.defineItem<Observation[]>('local:observationQueue', {
  fallback: [],
  version: 1,
});
