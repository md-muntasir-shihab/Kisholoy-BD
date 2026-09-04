/**
 * KISHOLOY — Shared password hashing (security audit Phase 1)
 *
 * Rationale (audit C4/C8/C9): the previous scheme was PBKDF2-HMAC-SHA512 with a
 * single hard-coded salt shared across every account and only 10,000 iterations.
 * Supplier portal passwords were stored in plaintext with a universal fallback.
 *
 * This module centralizes a memory-hard hashing pipeline:
 *  - scrypt (node:crypto built-in, OWASP-recommended alongside argon2id/bcrypt)
 *    with OWASP parameters: N=2^15 (32768), r=8, p=1, 64-byte key.
 *  - Per-account random 128-bit salt (crypto.randomBytes) — no shared/fixed salt.
 *  - Constant-time digest comparison to avoid timing side channels.
 *
 * scrypt was chosen over the argon2/bcrypt npm packages deliberately:
 * this repo pins bun.lock in CI and the sandbox has no bun; a native module
 * could not be lockfile-consistently added. node:crypto ships scrypt already,
 * keeps the dependency surface at zero, and matches the repo principle of
 * hardening the existing engines instead of importing new frameworks.
 */
import crypto from 'crypto';

export const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

/** Generate a fresh per-account salt (hex). */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/** Derive the scrypt hex digest for a password under a salt. */
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(String(password ?? ''), salt, KEY_LENGTH, SCRYPT_PARAMS).toString('hex');
}

/**
 * Constant-time password verification. Never short-circuits on missing values:
 * a missing hash or salt always fails, but the comparison itself is fixed-time.
 */
export function verifyPassword(password: string, salt: string | undefined, storedHash: string | undefined): boolean {
  if (!storedHash || !salt || password == null || password === '') return false;
  try {
    const candidate = crypto.scryptSync(String(password), salt, KEY_LENGTH, SCRYPT_PARAMS);
    const expected = Buffer.from(storedHash, 'hex');
    if (expected.length !== candidate.length) return false;
    return crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/** Minimum password length enforced for every principal (staff, customer, supplier). */
export const MIN_PASSWORD_LENGTH = 8;

/** Basic complexity gate shared with registration / change-password flows. */
export function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  const hasLetter = /[a-zA-Z\u0980-\u09ff]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  if (!hasLetter || !hasDigit) {
    return 'Password must contain both letters and numbers.';
  }
  return null;
}

/** One-time hash for demo seed records (never used for real credential flows). */
export function hashSeedPassword(plaintext: string): { passwordHash: string; salt: string } {
  const salt = generateSalt();
  return { salt, passwordHash: hashPassword(plaintext, salt) };
}

/**
 * Sealed credential format for stores that keep a single string field
 * (supplier portalAccess.passwordHash): "<saltHex>:<hashHex>".
 */
export function sealPassword(plaintext: string): string {
  const salt = generateSalt();
  return `${salt}:${hashPassword(plaintext, salt)}`;
}

export function verifySealedPassword(plaintext: string, sealed: string | undefined): boolean {
  if (!sealed || typeof sealed !== 'string' || !sealed.includes(':')) return false;
  const [salt, digest] = sealed.split(':');
  return verifyPassword(plaintext, salt, digest);
}

/**
 * Bangladesh mobile phone normalizer + validator (delivery-data-flow Phase 5,
 * audit C11). Accepts 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX, digits with
 * spaces/dashes/parens and optional +88/88/0 prefixes. Returns the canonical
 * +8801XXXXXXXXX form or null when the number is not a valid BD mobile line.
 */
export function normalizeBdMobilePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let bare = raw.replace(/\D/g, ''); // keep digits only
  if (bare.startsWith('880')) bare = bare.slice(3);
  else if (bare.startsWith('0')) bare = bare.slice(1);
  if (!/^1[3-9]\d{8}$/.test(bare)) return null;
  return `+880${bare}`;
}

/** Validate-and-normalize a phone; returns {phone} or {error}. */
export function requireBdMobilePhone(raw: unknown, fieldLabel: string): { phone?: string; error?: string } {
  const normalized = normalizeBdMobilePhone(raw);
  if (!normalized) {
    return { error: `${fieldLabel} is not a valid Bangladesh mobile number (expected 01XXXXXXXXX / +8801XXXXXXXXX).` };
  }
  return { phone: normalized };
}
