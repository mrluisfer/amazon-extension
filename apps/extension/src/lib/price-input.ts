/** Upper bound for a target price typed by the user (MXN 1,000,000). */
const MAX_CENTS = 100_000_000;

/**
 * Parses a user-typed amount ("1299", "1,299.50", "$ 1299.5") into integer
 * cents. Returns null unless it is a positive amount with at most 2 decimals.
 */
export function parseTargetPrice(input: string): number | null {
  const cleaned = input.replace(/[\s$,]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole = '0', fraction = ''] = cleaned.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}

/** Cents → plain editable string ("1299.5" → "1299.50"). */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
