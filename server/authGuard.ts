/**
 * Server-Side Authentication & Authorization Guard
 *
 * Before this existed, `ROUTE_PERMISSIONS` in the React admin shell was the ONLY
 * gate on the admin surface: 160 of 164 mutating endpoints accepted anonymous
 * requests, so `curl -X POST /api/security/users/create` could mint a
 * SUPER_ADMIN, delete products or rewrite stock. This module makes the server
 * the authority and reduces the client matrix to a UX affordance.
 *
 * Design notes:
 *  - Read (`GET`) traffic is left open by default so the storefront keeps
 *    working; individual sensitive reads are protected explicitly below.
 *  - Every non-GET `/api/**` call must present a staff bearer, EXCEPT the
 *    public/self-service paths on the allow-list (checkout, customer auth,
 *    supplier portal, gateway callbacks...).
 *  - Customer-owned resources are additionally ownership-checked so one
 *    customer cannot read another's profile/addresses/wishlist (IDOR).
 *
 * @license Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { securityEngine } from './securityEngine';
import { serverDb } from './db';
import type { Role } from '../src/types';

export interface AuthContext {
  kind: 'STAFF' | 'CUSTOMER' | 'SUPPLIER' | 'ANONYMOUS';
  role?: Role;
  userId?: string;
  userName?: string;
  customerId?: string;
  supplierId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const clientIpOf = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
  req.socket.remoteAddress ||
  '127.0.0.1';

const bearerOf = (req: Request): string => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const alt = req.headers['x-staff-token'];
  return typeof alt === 'string' ? alt.trim() : '';
};

/** `ksh-cust-sess-<customerId>-<timestamp>` */
const CUSTOMER_TOKEN_RE = /^ksh-cust-sess-(.+)-\d+$/;
/** `ksh-sup-token-<supplierId>-<timestamp>` */
const SUPPLIER_TOKEN_RE = /^ksh-sup-token-(.+)-\d+$/;

/**
 * Resolves whoever is calling into `req.auth`. Never rejects — enforcement is
 * the job of `requireStaff` / `requirePermission` / `requireCustomerSelf`.
 */
export function attachAuthContext(req: Request, _res: Response, next: NextFunction) {
  const token = bearerOf(req);

  if (token) {
    const staff = securityEngine.verifySession(token, clientIpOf(req));
    if (staff.valid && staff.session) {
      req.auth = {
        kind: 'STAFF',
        role: staff.role,
        userId: staff.session.userId,
        userName: staff.session.userName,
      };
      return next();
    }

    const cust = CUSTOMER_TOKEN_RE.exec(token);
    if (cust) {
      req.auth = { kind: 'CUSTOMER', customerId: cust[1] };
      return next();
    }

    const sup = SUPPLIER_TOKEN_RE.exec(token);
    if (sup) {
      req.auth = { kind: 'SUPPLIER', supplierId: sup[1] };
      return next();
    }
  }

  req.auth = { kind: 'ANONYMOUS' };
  next();
}

/**
 * Paths that must stay reachable without a staff session.
 * Anything matching here is exempt from the blanket mutation guard.
 */
const PUBLIC_MUTATION_PATTERNS: RegExp[] = [
  // Storefront checkout & tracking
  /^\/api\/orders\/create$/,
  /^\/api\/checkout\//,
  /^\/api\/promotions\/validate$/,
  // Customer self-service (ownership enforced separately)
  /^\/api\/customer\//,
  // Supplier portal self-service
  /^\/api\/suppliers\/portal\//,
  // Staff auth itself (login must work before you have a token)
  /^\/api\/security\/auth\//,
  // Gateway / courier server-to-server callbacks (signature-verified inside)
  /^\/api\/payments\/(ipn|sslcommerz\/(init|validate)|bkash\/(create|execute))$/,
  /^\/api\/courier\/webhook$/,
  /^\/api\/webhooks\/receive/,
  // Marketing attribution beacon fired by the storefront
  /^\/api\/marketing\/command\/attributions$/,
];

/** Sensitive reads that must NOT be world-readable. */
const PROTECTED_READ_PATTERNS: RegExp[] = [
  /^\/api\/customers(\/|$)/,          // full customer PII directory
  /^\/api\/security\//,               // staff users, sessions, rbac, audit chain
  /^\/api\/finance\//,                // revenue, margins, expenses
  /^\/api\/reports\//,                // business intelligence
  /^\/api\/system\//,                 // backups, exports, DR
  /^\/api\/fraud\//,                  // blacklists & risk config
  /^\/api\/marketing\/(?!command\/attributions)/, // CRM & spend data
  /^\/api\/payments\/transactions/,   // payment ledger
];

const isPublicMutation = (path: string) => PUBLIC_MUTATION_PATTERNS.some((re) => re.test(path));
const isProtectedRead = (path: string) => PROTECTED_READ_PATTERNS.some((re) => re.test(path));

const deny = (res: Response, status: number, code: string, message: string, messageBn: string) =>
  res.status(status).json({ success: false, error: message, errorBn: messageBn, code });

/**
 * Blanket guard: every `/api/**` write needs a valid staff session, and the
 * sensitive reads listed above do too. Public/self-service paths are exempt.
 */
export function enforceStaffSurface(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  if (!path.startsWith('/api/')) return next();

  const isRead = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
  const needsStaff = isRead ? isProtectedRead(path) : !isPublicMutation(path);
  if (!needsStaff) return next();

  const auth = req.auth;
  if (auth?.kind === 'STAFF') return next();

  // A customer or supplier token is a valid identity but not staff authority.
  if (auth?.kind === 'CUSTOMER' || auth?.kind === 'SUPPLIER') {
    return deny(
      res, 403, 'STAFF_ROLE_REQUIRED',
      'This action requires a staff account.',
      'এই কাজটি করতে স্টাফ অ্যাকাউন্ট প্রয়োজন।'
    );
  }

  return deny(
    res, 401, 'STAFF_AUTH_REQUIRED',
    'Staff authentication required. Please sign in to the admin panel.',
    'স্টাফ লগইন প্রয়োজন। অনুগ্রহ করে অ্যাডমিন প্যানেলে সাইন ইন করুন।'
  );
}

/** Route-level guard for a specific RBAC permission. */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (auth?.kind !== 'STAFF' || !auth.role) {
      return deny(
        res, 401, 'STAFF_AUTH_REQUIRED',
        'Staff authentication required.',
        'স্টাফ লগইন প্রয়োজন।'
      );
    }
    if (!securityEngine.hasPermission(auth.role, permission)) {
      securityEngine.logAudit({
        operator: auth.userName || auth.userId || 'UNKNOWN',
        role: auth.role,
        action: 'PERMISSION_DENIED',
        category: 'AUTH',
        severity: 'WARNING',
        resource: 'API',
        resourceId: req.path,
        details: `Role ${auth.role} attempted ${req.method} ${req.path} without ${permission}.`,
        ipAddress: clientIpOf(req),
      });
      return deny(
        res, 403, 'PERMISSION_DENIED',
        `Your role (${auth.role}) does not have the required permission: ${permission}.`,
        `আপনার ভূমিকা (${auth.role}) এই কাজের অনুমতি রাখে না: ${permission}।`
      );
    }
    next();
  };
}

/**
 * Ownership guard for customer-scoped resources (fixes the IDOR where any
 * caller could read `/api/customer/profile/<any id>`).
 *
 * Staff keep full access; a customer may only touch their own record.
 */
export function requireCustomerSelf(paramName = 'customerId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (auth?.kind === 'STAFF') return next();

    const target =
      (req.params as any)[paramName] ||
      (req.body && (req.body.customerId as string)) ||
      (req.query.customerId as string);

    if (!target) {
      return deny(
        res, 400, 'CUSTOMER_ID_REQUIRED',
        'A customer id is required for this request.',
        'এই অনুরোধের জন্য কাস্টমার আইডি প্রয়োজন।'
      );
    }

    if (auth?.kind === 'CUSTOMER' && auth.customerId === target) return next();

    return deny(
      res, 403, 'NOT_RESOURCE_OWNER',
      'You can only access your own account data.',
      'আপনি শুধুমাত্র নিজের অ্যাকাউন্টের তথ্য দেখতে পারবেন।'
    );
  };
}

/**
 * Ownership guard for resources whose owner is not in the URL but stored on the
 * record itself (addresses, notifications). Looking the owner up server-side is
 * the only safe option: a caller-supplied `customerId` proves nothing.
 */
function requireRecordOwner(
  resolveOwner: (id: string) => string | undefined,
  paramName: string,
  notFoundMessage: string,
  notFoundMessageBn: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (auth?.kind === 'STAFF') return next();

    const recordId = (req.params as any)[paramName];
    const owner = recordId ? resolveOwner(recordId) : undefined;

    // Unknown record: answer 404 rather than leaking existence via 403.
    if (!owner) {
      return res.status(404).json({
        success: false,
        error: notFoundMessage,
        errorBn: notFoundMessageBn,
        code: 'NOT_FOUND',
      });
    }

    if (auth?.kind === 'CUSTOMER' && auth.customerId === owner) return next();

    return deny(
      res, 403, 'NOT_RESOURCE_OWNER',
      'You can only access your own account data.',
      'আপনি শুধুমাত্র নিজের অ্যাকাউন্টের তথ্য দেখতে পারবেন।'
    );
  };
}

/** Ownership guard for a saved delivery address, keyed by the stored record. */
export function requireAddressOwner(paramName = 'addressId') {
  return requireRecordOwner(
    (id) => serverDb.customerAddresses.find((a) => a.id === id)?.customerId,
    paramName,
    'Address not found.',
    'ঠিকানা পাওয়া যায়নি।'
  );
}

/** Ownership guard for a customer notification, keyed by the stored record. */
export function requireNotificationOwner(paramName = 'id') {
  return requireRecordOwner(
    (id) => serverDb.customerNotifications.find((n) => n.id === id)?.customerId,
    paramName,
    'Notification not found.',
    'নোটিফিকেশন পাওয়া যায়নি।'
  );
}

/** Ownership guard for supplier-portal resources. */
export function requireSupplierSelf(paramName = 'supplierId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (auth?.kind === 'STAFF') return next();

    const target =
      (req.params as any)[paramName] ||
      (req.body && (req.body.supplierId as string)) ||
      (req.query.supplierId as string) ||
      (req.headers['x-supplier-id'] as string);

    if (!target) {
      return deny(
        res, 400, 'SUPPLIER_ID_REQUIRED',
        'A supplier id is required for this request.',
        'এই অনুরোধের জন্য সাপ্লায়ার আইডি প্রয়োজন।'
      );
    }

    if (auth?.kind === 'SUPPLIER' && auth.supplierId === target) return next();

    return deny(
      res, 403, 'NOT_RESOURCE_OWNER',
      'You can only access your own supplier data.',
      'আপনি শুধুমাত্র নিজের সাপ্লায়ার তথ্য দেখতে পারবেন।'
    );
  };
}

/** Convenience: the customer id the caller is allowed to act as, if any. */
export function callerCustomerId(req: Request): string | undefined {
  return req.auth?.kind === 'CUSTOMER' ? req.auth.customerId : undefined;
}

/** True when the request carries a valid staff session. */
export function isStaff(req: Request): boolean {
  return req.auth?.kind === 'STAFF';
}

/** Used by order-scoping logic that already existed in `GET /api/orders`. */
export function resolveCustomerScope(req: Request): string | null {
  if (req.auth?.kind === 'CUSTOMER' && req.auth.customerId) return req.auth.customerId;
  return null;
}
