// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { seriesFor } from '../src/lib/chart-series';
import { applyThemePref, readCachedThemePref, resolveTheme } from '../src/lib/theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('defaults to "system" and ignores garbage in the cache', () => {
    expect(readCachedThemePref()).toBe('system');
    localStorage.setItem('ph:theme', 'neon-green');
    expect(readCachedThemePref()).toBe('system');
  });

  it('applies the preference to <html> and caches it for the next synchronous boot', () => {
    applyThemePref('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(readCachedThemePref()).toBe('dark');
  });

  it.each([
    ['system', true, 'dark'],
    ['system', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)('resolveTheme(%s, systemDark=%s) → %s', (pref, systemDark, expected) => {
    expect(resolveTheme(pref, systemDark)).toBe(expected);
  });

  it('has a distinct, readable palette per theme with stable references', () => {
    const light = seriesFor('light');
    const dark = seriesFor('dark');
    expect(light.map((s) => s.key)).toEqual(dark.map((s) => s.key));
    expect(dark.find((s) => s.key === 'used')?.color).not.toBe(
      light.find((s) => s.key === 'used')?.color,
    );
    expect(seriesFor('dark')).toBe(dark); // no re-allocation per render
  });
});
