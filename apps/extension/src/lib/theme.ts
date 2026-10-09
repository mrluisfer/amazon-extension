import { useCallback, useEffect, useState } from 'react';
import { type ThemePref, themeItem } from './storage';

export type Theme = 'light' | 'dark';

const CACHE_KEY = 'ph:theme';
const PREFS: readonly ThemePref[] = ['system', 'light', 'dark'];
const darkQuery = () =>
  typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

/** Sync read of the last known preference (extension-origin localStorage) — no async gap. */
export function readCachedThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(CACHE_KEY);
    return PREFS.includes(v as ThemePref) ? (v as ThemePref) : 'system';
  } catch {
    return 'system';
  }
}

/** Applies a preference to <html>; CSS (`color-scheme` + `light-dark()`) does the rest. */
export function applyThemePref(pref: ThemePref, root: HTMLElement = document.documentElement) {
  root.dataset.theme = pref;
  try {
    localStorage.setItem(CACHE_KEY, pref);
  } catch {
    // storage disabled: the chrome.storage value still applies after load
  }
}

/**
 * Call before the first React render of a themed page: applies the cached
 * preference synchronously (no flash), then reconciles with chrome.storage,
 * the source of truth shared by every tab.
 */
export function bootTheme() {
  applyThemePref(readCachedThemePref());
  void themeItem.getValue().then((pref) => applyThemePref(pref));
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme {
  return pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
}

/**
 * Preference + resolved theme for components that need actual colors in JS
 * (the chart canvas). Subscribes to storage changes and, only while the
 * preference is "system", to the OS color-scheme media query.
 */
export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(readCachedThemePref);
  const [systemDark, setSystemDark] = useState(() => darkQuery()?.matches ?? false);

  useEffect(() => {
    void themeItem.getValue().then(setPrefState);
    return themeItem.watch((next) => {
      setPrefState(next);
      applyThemePref(next);
    });
  }, []);

  useEffect(() => {
    if (pref !== 'system') return;
    const mq = darkQuery();
    if (!mq) return;
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  const setPref = useCallback((next: ThemePref) => {
    applyThemePref(next); // instant, before the storage round-trip
    setPrefState(next);
    void themeItem.setValue(next);
  }, []);

  return { pref, resolved: resolveTheme(pref, systemDark), setPref };
}
