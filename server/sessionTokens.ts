/**
 * Signed session tokens for the non-staff surfaces (customer + supplier).
 *
 * PHASE 4 batch 2 scoped `/api/customer/*` and the supplier portal to "the
 * caller's own id", but it derived that id from the token *string shape*
 * (`ksh-cust-sess-<id>-<ts>`). That shape is guessable, so anyone could mint
 * `ksh-cust-sess-cust-1-9999999999` and read another customer's PII — the
 * ownership check was enforcing a value the attacker controlled.
 *
 * Tokens are now HMAC-signed. The public prefix is unchanged so existing
 * clients and the `attachAuthContext` regexes keep working; a `.<sig>` suffix
 * is appended and verified in constant time. Unsigned legacy tokens are
 * rejected unless KISHOLOY_ALLOW_LEGACY_TOKENS is set (escape hatch for a
 * staged rollout, off by default).
 *
 * Staff sessions are unaffected: they are random opaque strings looked up in
 * `securityEngine.activeSessions`, which is already unguessable.
 *
 * @license Apache-2.0
 */

import crypto from 'node:crypto';

/**
 * Signing key. In production this must come from the environment; a missing
 * secret falls back to a per-process random key, which is safe (tokens simply
 * do not survive a restart) rather than predictable.
 */
const SECRET: string =
  process.env.KISHOLOY_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const ALLOW_LEGACY = process.env.KISHOLOY_ALLOW_LEGACY_TOKENS === 'true';

const sign = (payload: string): string =>
  crypto.createHmac('sha256', SECRET).update(payload).digest('base64url').slice(0, 32);

/** Constant-time compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export type TokenKind = 'CUSTOMER' | 'SUPPLIER';

const PREFIX: Record<TokenKind, string> = {
  CUSTOMER: 'ksh-cust-sess',
  SUPPLIER: 'ksh-sup-token',
};

/** Mint a signed session token: `ksh-cust-sess-<id>-<ts>.<sig>` */
export function issueSessionToken(kind: TokenKind, subjectId: string): string {
  const payload = `${PREFIX[kind]}-${subjectId}-${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a token and return the subject id it authenticates, or `null`.
 * The id is taken from the *verified* payload, never from raw user input.
 */
export function verifySessionToken(kind: TokenKind, token: string): string | null {
  if (!token) return null;

  const dot = token.lastIndexOf('.');
  const payload = dot === -1 ? token : token.slice(0, dot);
  const sig = dot === -1 ? '' : token.slice(dot + 1);

  const shape = new RegExp(`^${PREFIX[kind]}-(.+)-\\d+$`).exec(payload);
  if (!shape) return null;

  if (dot === -1) {
    // Unsigned legacy token: only honoured when explicitly opted in.
    return ALLOW_LEGACY ? shape[1] : null;
  }

  if (!safeEqual(sig, sign(payload))) return null;
  return shape[1];
}
