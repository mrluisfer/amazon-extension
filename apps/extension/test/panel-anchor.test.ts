// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { keepPanelAboveKeepa, resolvePanelAnchor } from '../src/lib/panel-anchor';

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html');

// Skeletons of the #dp-container children observed on amazon.com.mx (2026-10-08).
const CLASSIC = `<div id="dp-container">
  <div id="ppd"><div id="leftCol"></div><div id="centerCol"></div><div id="rightCol"></div></div>
  <script></script>
  <div id="hover-zoom-end"></div>
  <div id="ATFCriticalFeaturesDataContainer"></div>
</div>`;

// "premium" layout (e.g. iPhone): no #ppd, columns are direct children of #dp-container.
const PREMIUM = `<div id="dp-container">
  <div id="rightCol"></div><div id="leftCenterCol"></div><div id="leftCol"></div><div id="centerCol"></div>
  <div id="hqpWrapper"></div>
  <div id="hover-zoom-end"></div>
  <div id="ATFCriticalFeaturesDataContainer"></div>
</div>`;

const withKeepa = (html: string) =>
  html.replace(
    '<div id="hover-zoom-end"></div>',
    '<div id="hover-zoom-end"></div><div id="keepaContainer"><iframe></iframe></div><div id="keepaClear"></div>',
  );

describe('resolvePanelAnchor (same slot as Keepa)', () => {
  it.each([
    ['classic', CLASSIC],
    ['premium (no #ppd)', PREMIUM],
  ])('%s layout → right after #hover-zoom-end, below the product block', (_l, html) => {
    expect(resolvePanelAnchor(doc(html))).toEqual({ selector: '#hover-zoom-end', append: 'after' });
  });

  it.each([
    ['classic', CLASSIC],
    ['premium', PREMIUM],
  ])('%s layout with Keepa already injected → directly above Keepa', (_l, html) => {
    expect(resolvePanelAnchor(doc(withKeepa(html)))).toEqual({
      selector: '#keepaContainer',
      append: 'before',
    });
  });

  it('falls back to after #ppd, then the end of #dp-container', () => {
    expect(resolvePanelAnchor(doc('<div id="dp-container"><div id="ppd"></div></div>'))).toEqual({
      selector: '#ppd',
      append: 'after',
    });
    expect(resolvePanelAnchor(doc('<div id="dp-container"></div>'))).toEqual({
      selector: '#dp-container',
      append: 'last',
    });
  });

  it('returns null outside a product page', () => {
    expect(resolvePanelAnchor(doc('<div id="search"></div>'))).toBeNull();
  });
});

describe('keepPanelAboveKeepa', () => {
  const mountPanelAfterHoverZoomEnd = (d: Document) => {
    const panel = d.createElement('div');
    panel.id = 'ph-price-panel';
    d.getElementById('hover-zoom-end')?.after(panel);
    return panel;
  };

  it('moves our panel above Keepa when Keepa injects after us (ours on top)', () => {
    const d = doc(CLASSIC);
    const panel = mountPanelAfterHoverZoomEnd(d);
    // Keepa inserts right after #hover-zoom-end too → lands above our panel.
    d.getElementById('hover-zoom-end')?.after(
      Object.assign(d.createElement('div'), { id: 'keepaContainer' }),
    );
    expect(panel.previousElementSibling?.id).toBe('keepaContainer');

    expect(keepPanelAboveKeepa(panel, d)).toBe(true);
    expect(panel.nextElementSibling?.id).toBe('keepaContainer');
    expect(panel.previousElementSibling?.id).toBe('hover-zoom-end');
  });

  it('is a no-op when already above Keepa or when Keepa is absent', () => {
    const d = doc(withKeepa(PREMIUM));
    const panel = d.createElement('div');
    d.getElementById('keepaContainer')?.before(panel);
    expect(keepPanelAboveKeepa(panel, d)).toBe(false);
    expect(keepPanelAboveKeepa(mountPanelAfterHoverZoomEnd(doc(PREMIUM)), doc(PREMIUM))).toBe(
      false,
    );
  });
});
