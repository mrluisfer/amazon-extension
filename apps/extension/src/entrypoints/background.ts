import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { api } from '@/lib/api-client';
import { FLUSH_ALARM } from '@/lib/config';
import { registerMessageHandlers } from '@/lib/messaging';
import { enqueueObservations, flushIfPending, flushObservations } from '@/lib/observation-queue';
import { authTokenItem, consentItem, observationQueueItem } from '@/lib/storage';

/**
 * MV3 service worker: ephemeral, so no in-memory state is relied upon and
 * every listener is registered synchronously on startup.
 */
export default defineBackground(() => {
  registerMessageHandlers({
    'observations:report': async ({ observations }) => ({
      queued: await enqueueObservations(observations),
    }),
    'history:get': async ({ marketplace, asin, days }) => {
      // Best effort: a failed flush must not block showing the chart.
      await flushIfPending(marketplace, asin).catch(() => {});
      return api.history(marketplace, asin, days);
    },
    'tracked:list': async () => (await api.listTracked()).items,
    'tracked:add': (input) => api.track(input),
    'tracked:remove': async ({ id }) => api.untrack(id),
    'account:delete': async () => {
      await api.deleteAccount();
      await Promise.all([authTokenItem.setValue(null), observationQueueItem.setValue([])]);
      return null;
    },
  });

  browser.runtime.onInstalled.addListener(({ reason }) => {
    // Consent must be asked up front, before any data is collected.
    if (reason === 'install') void browser.runtime.openOptionsPage();
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === FLUSH_ALARM) {
      flushObservations().catch((err) => console.warn('[queue] flush failed, will retry', err));
    }
  });
  void browser.alarms.get(FLUSH_ALARM).then((existing) => {
    if (!existing) void browser.alarms.create(FLUSH_ALARM, { periodInMinutes: 1 });
  });

  // Revoking consent immediately discards anything not yet sent.
  consentItem.watch((consent) => {
    if (consent !== 'granted') void observationQueueItem.setValue([]);
  });
});
