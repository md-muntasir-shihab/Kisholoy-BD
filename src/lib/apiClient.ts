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
/** Written by the supplier portal login page (pre-existing key name). */
export const SUPPLIER_TOKEN_KEY = 'ksh_supplier_token';
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
export const getSupplierToken = () => safeGet(SUPPLIER_TOKEN_KEY);
export const setSupplierToken = (token: string | null) => safeSet(SUPPLIER_TOKEN_KEY, token);

/** Paths that belong to the customer/portal surfaces — never staff-guarded. */
const NON_STAFF_PATH_PATTERNS = [
  /^\/api\/customer\//,
  /^\/api\/cust\//,
  /^\/api\/portal\//,
  /^\/api\/supplier\/portal\//,
  /^\/api\/suppliers\/portal\//,
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

/**
 * Global `fetch` interceptor.
 *
 * The admin screens contain ~200 hand-written `fetch('/api/...')` call sites
 * that predate this module. Now that the server enforces a staff session on
 * every mutation, each of those would fail with 401 unless it carries a token.
 * Rewriting every call site is high-risk churn, so we patch `window.fetch`
 * once at boot: any same-origin `/api/**` request that does not already set an
 * Authorization header gets the same token `apiFetch` would have attached.
 *
 * Calls that already use `apiFetch` are unaffected (their header is set), and
 * cross-origin requests are passed through untouched.
 */
export function installApiAuthInterceptor() {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __kshFetchPatched?: boolean };
  if (w.__kshFetchPatched) return;
  w.__kshFetchPatched = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let path = '';
    try {
      const raw =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const parsed = new URL(raw, window.location.origin);
      if (parsed.origin === window.location.origin) path = parsed.pathname;
    } catch {
      /* opaque input — fall through untouched */
    }

    if (!path.startsWith('/api/')) return nativeFetch(input as RequestInfo, init);

    // Respect an Authorization header the caller already set.
    const existing = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );
    if (existing.has('Authorization')) return nativeFetch(input as RequestInfo, init);

    // Pick the token that matches the surface being called.
    const isSupplierPortal = /^\/api\/suppliers?\/portal\//.test(path);
    const token = isSupplierPortal
      ? getSupplierToken() || getStaffToken()
      : isStaffGuardedPath(path)
        ? getStaffToken() || getCustomerToken()
        : getCustomerToken() || getStaffToken();
    if (!token) return nativeFetch(input as RequestInfo, init);

    existing.set('Authorization', `Bearer ${token}`);

    if (input instanceof Request && !init) {
      return nativeFetch(new Request(input, { headers: existing }));
    }
    return nativeFetch(input as RequestInfo, { ...(init || {}), headers: existing });
  };
}
