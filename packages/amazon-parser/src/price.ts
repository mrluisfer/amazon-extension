/**
 * Parses a displayed price like "$1,299.00", "$ 99.50" or "1.299,00 €" into
 * integer cents. Returns null for anything that is not a plausible price.
 */
export function parsePriceToCents(
  raw: string | null | undefined,
  decimalSeparator: '.' | ',',
): number | null {
  if (!raw) return null;
  const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
  const cleaned = raw
    .replace(/\s/g, '')
    .replace(/[^\d.,]/g, '')
    .split(thousandsSeparator)
    .join('');
  if (!cleaned) return null;

  const parts = cleaned.split(decimalSeparator);
  if (parts.length > 2) return null;
  const [whole, fraction = ''] = parts;
  if (!whole || !/^\d+$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return null;

  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
