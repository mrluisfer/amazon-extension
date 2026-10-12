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

/** Hide sponsored ("Patrocinado") results on Amazon search pages. On by default. */
export const hideSponsoredItem = storage.defineItem<boolean>('local:hideSponsored', {
  fallback: true,
  version: 1,
});

export type ThemePref = 'system' | 'light' | 'dark';

/** Theme of our own UI (the panel). Amazon has no dark mode; ours follows the OS by default. */
export const themeItem = storage.defineItem<ThemePref>('local:theme', {
  fallback: 'system',
  version: 1,
});

/** Pending crowdsourced observations, flushed in batches by the background. */
export const observationQueueItem = storage.defineItem<Observation[]>('local:observationQueue', {
  fallback: [],
  version: 1,
});

/**
 * Backoff after failed anonymous registrations. Session storage: survives the
 * MV3 service worker restarting (which happens every ~30s idle) but resets with
 * the browser, so a long outage never blocks a fresh session for long.
 */
export const registrationBackoffItem = storage.defineItem<{
  failures: number;
  retryAt: number;
} | null>('session:registrationBackoff', { fallback: null });
