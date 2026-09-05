/**
 * Canonical Bangladeshi mobile number normalization.
 *
 * Single source of truth shared by BOTH the browser bundle and the Express
 * server, so that whatever shape a phone number is stored in, order tracking,
 * customer scoping and fraud lookups all compare the exact same canonical form.
 *
 * Canonical form: +8801XXXXXXXXX (13 digits after the leading '+').
 * Returns `null` for anything that is not a plausible BD mobile number, so
 * callers can explicitly reject garbage instead of accidentally matching
 * `null === null`.
 */
export function normalizeBdMobilePhone(input?: string | null): string | null {
  if (!input) return null;

  // Strip every non-digit except a single leading '+'
  let cleaned = String(input).trim().replace(/[^\d+]/g, '');
  cleaned = cleaned.replace(/(?!^)\+/g, '');

  let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!/^\d+$/.test(digits)) return null;

  // 008801XXXXXXXXX (international dialling prefix)
  if (digits.startsWith('00880')) digits = digits.slice(2);
  // 8801XXXXXXXXX
  if (digits.startsWith('880')) digits = digits.slice(3);
  // 01XXXXXXXXX (local form)
  else if (digits.startsWith('0')) digits = digits.slice(1);

  // At this point we expect the national significant number: 1XXXXXXXXX
  if (!/^1[3-9]\d{8}$/.test(digits)) return null;

  return `+880${digits}`;
}

/**
 * True only when both sides normalize to the SAME valid BD mobile number.
 * Never true when either side is unparsable (guards `null === null`).
 */
export function isSameBdMobilePhone(a?: string | null, b?: string | null): boolean {
  const na = normalizeBdMobilePhone(a);
  const nb = normalizeBdMobilePhone(b);
  return na !== null && nb !== null && na === nb;
}

/** Digits-only view used strictly for the legacy substring fallback. */
export function phoneDigits(input?: string | null): string {
  return String(input || '').replace(/\D/g, '');
}
