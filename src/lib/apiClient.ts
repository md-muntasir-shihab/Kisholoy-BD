/**
 * Shared browser API client.
 *
 * Responsibilities:
 *  1. Attach the right bearer token to same-origin `/api/...` calls:
 *     staff/admin session token first, otherwise the logged-in customer's
 *     session token (so customer-scoped endpoints like `GET /api/orders`
 *     actually receive an identity to scope on).
 *  2. Fire the global `kisholoy-auth-expired` event ONLY for 401s that came
 *     back from staff-guarded paths. A stale customer token 401 in a tab that
 *     happens to sit on /admin must never log the whole admin panel out.
 */

export const STAFF_TOKEN_KEY = 'kisholoy_staff_token';
export const CUSTOMER_TOKEN_KEY = 'kisholoy_customer_token';
export const AUTH_EXPIRED_EVENT = 'kisholoy-auth-expired';

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string | null) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable (private mode) — tokens stay in-memory only */
  }
};

export const getStaffToken = () => safeGet(STAFF_TOKEN_KEY);
export const setStaffToken = (token: string | null) => safeSet(STAFF_TOKEN_KEY, token);
export const getCustomerToken = () => safeGet(CUSTOMER_TOKEN_KEY);
export const setCustomerToken = (token: string | null) => safeSet(CUSTOMER_TOKEN_KEY, token);

/** Paths that belong to the customer/portal surfaces — never staff-guarded. */
const NON_STAFF_PATH_PATTERNS = [
  /^\/api\/customer\//,
  /^\/api\/cust\//,
  /^\/api\/portal\//,
  /^\/api\/supplier\/portal\//,
  /^\/api\/orders\/track/,
  /^\/api\/auth\/customer/,
];

const toPathname = (url: string): string => {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url.split('?')[0] || '';
  }
};

/** True when a 401 from this URL should invalidate the STAFF session. */
export function isStaffGuardedPath(url: string): boolean {
  const path = toPathname(url);
  if (!path.startsWith('/api/')) return false;
  return !NON_STAFF_PATH_PATTERNS.some(re => re.test(path));
}

export interface ApiFetchOptions extends RequestInit {
  /** 'staff' | 'customer' | 'auto' (default) | 'none' */
  auth?: 'staff' | 'customer' | 'auto' | 'none';
}

/**
 * fetch() wrapper that adds the appropriate bearer token and applies the
 * staff-scoped 401 handling described above.
 */
export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { auth = 'auto', headers, ...rest } = options;

  const staffToken = getStaffToken();
  const customerToken = getCustomerToken();

  let token: string | null = null;
  if (auth === 'staff') token = staffToken;
  else if (auth === 'customer') token = customerToken;
  else if (auth === 'auto') token = staffToken || customerToken;

  const finalHeaders = new Headers(headers || {});
  if (token && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...rest, headers: finalHeaders });

  if (res.status === 401) {
    const staffGuarded = isStaffGuardedPath(url);
    // Only a 401 on a staff-guarded path with a staff token in play means the
    // staff session died. Customer-token 401s stay local to the customer flow.
    if (staffGuarded && staffToken && token === staffToken) {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { url, scope: 'STAFF' } }));
    } else if (!staffGuarded || token === customerToken) {
      setCustomerToken(null);
    }
  }

  return res;
}

/** apiFetch + tolerant JSON parse: resolves to `null` on any failure. */
export async function apiFetchJson<T = any>(url: string, options: ApiFetchOptions = {}): Promise<T | null> {
  try {
    const res = await apiFetch(url, options);
    if (!res.ok) return null;
    if (!(res.headers.get('content-type') || '').includes('application/json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
