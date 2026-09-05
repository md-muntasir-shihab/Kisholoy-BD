/**
 * Supplier portal password hashing.
 *
 * The portal used to compare a plaintext password stored on the supplier
 * record, with `'kisholoy2026'` as both the seed value and an unconditional
 * fallback. Three separate defects came out of that:
 *
 *   1. Every supplier shared one publicly-known password, printed in the admin
 *      UI and pre-filled in the login form.
 *   2. The comparison accepted `'kisholoy2026'` even when a supplier had set
 *      their own password, so the shared password was a permanent backdoor
 *      that no supplier could close.
 *   3. An empty password skipped the check entirely (`if (pass && ...)`), so
 *      posting no password at all authenticated as any enabled supplier.
 *
 * Passwords are now salted and hashed with scrypt, compared in constant time,
 * and never returned to any client.
 */
import crypto from 'node:crypto';

const KEYLEN = 64;
// scrypt cost. N=16384 is the usual interactive default and keeps a single
// login well under ~100ms on this hardware.
const COST = 16384;

export interface SupplierPasswordHash {
  /** `scrypt$<N>$<saltHex>$<keyHex>` */
  hash: string;
  updatedAt: string;
  /** True while the supplier is still on an admin-issued temporary password. */
  mustChange?: boolean;
}

export function hashSupplierPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(plain, salt, KEYLEN, { N: COST });
  return `scrypt$${COST}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export function verifySupplierPassword(plain: string, stored: string | undefined): boolean {
  // No credential on file means no way to authenticate — never fall back to a
  // shared default.
  if (!stored || !plain) return false;

  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;

  const cost = Number(parts[1]);
  if (!Number.isFinite(cost) || cost <= 0) return false;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(parts[3], 'hex');
    actual = crypto.scryptSync(plain, Buffer.from(parts[2], 'hex'), expected.length, { N: cost });
  } catch {
    return false;
  }

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

/**
 * Password for the seeded demo suppliers.
 *
 * Read from the environment so the value is not a constant in the source tree.
 * When unset outside development a random one is generated per boot, which
 * makes the seeded accounts unusable rather than silently reintroducing a
 * known shared password in production.
 */
export function seedPortalPassword(): { plain: string | null; hash: string } {
  const fromEnv = process.env.KISHOLOY_SUPPLIER_SEED_PASSWORD;
  if (fromEnv) return { plain: fromEnv, hash: hashSupplierPassword(fromEnv) };

  if (process.env.NODE_ENV !== 'production') {
    const devDefault = 'ChangeMe@2026';
    return { plain: devDefault, hash: hashSupplierPassword(devDefault) };
  }

  const random = crypto.randomBytes(24).toString('base64url');
  return { plain: null, hash: hashSupplierPassword(random) };
}

/** Admin-issued temporary password: returned once, stored only as a hash. */
export function generateTemporaryPassword(): string {
  // Ambiguous characters removed — these get read out over the phone.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export const PASSWORD_MIN_LENGTH = 10;

export function validatePasswordStrength(plain: string): string | null {
  if (!plain || plain.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(plain) || !/[0-9]/.test(plain)) {
    return 'Password must contain both letters and numbers.';
  }
  return null;
}
