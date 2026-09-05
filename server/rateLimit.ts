/**
 * Per-IP rate limiting for authentication endpoints.
 *
 * `securityEngine` already locks an individual staff account after 5 failed
 * attempts, but that is per *account*: an attacker spraying one common
 * password across many usernames never trips it, and the customer and
 * supplier login routes had no protection at all. CodeQL flagged the whole
 * authorization surface as unthrottled.
 *
 * Deliberately dependency-free and in-memory, matching the rest of this
 * server. That means the window resets on restart and is per-process — fine
 * for a single-node deployment, but a shared store (Redis) is required before
 * running more than one instance.
 *
 * @license Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  hits: number;
  /** Epoch ms when this bucket resets. */
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Stop the map growing without bound on a long-lived process. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

const clientIpOf = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
  req.socket.remoteAddress ||
  'unknown';

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests allowed per IP per window. */
  max: number;
  /** Distinguishes buckets when several limiters are mounted. */
  name: string;
}

/**
 * Fixed-window limiter keyed on client IP.
 *
 * Only failed authentication should really count against the budget, but the
 * handler decides success long after this middleware runs, so the window is
 * sized to be generous for a human (a person mistyping a password a few times
 * is nowhere near it) while still cutting off automated guessing.
 */
export function rateLimit({ windowMs, max, name }: RateLimitOptions) {
  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    sweep(now);

    const key = `${name}:${clientIpOf(req)}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { hits: 1, resetAt: now + windowMs });
      return next();
    }

    existing.hits += 1;
    if (existing.hits > max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        error: `Too many attempts. Try again in ${retryAfter} seconds.`,
        errorBn: `অনেকবার চেষ্টা করা হয়েছে। ${retryAfter} সেকেন্ড পর আবার চেষ্টা করুন।`,
      });
    }

    return next();
  };
}

/**
 * Credential-checking endpoints: login, password reset, MFA, token mint.
 * 10 per 5 minutes per IP.
 */
export const authRateLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 10, name: 'auth' });

/** Clears all buckets. Test helper only. */
export function __resetRateLimits() {
  buckets.clear();
}

/**
 * Coarse ceiling for the API as a whole, mounted ahead of the auth middleware
 * so that token and password verification cannot be used as a CPU oracle.
 * 300 requests per IP per minute is far above what the admin panel produces
 * in normal use (a dashboard load is a few dozen calls) while still bounding
 * automated abuse of handlers that are not on the credential surface.
 */
export const generalApiRateLimit = rateLimit({ windowMs: 60 * 1000, max: 300, name: 'api' });
