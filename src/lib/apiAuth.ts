/**
 * KISHOLOY — unified API credential attach (security audit Phases 2–4).
 *
 * The server now rejects unauthenticated calls to staff /api/admin, /api/security,
 * /api/finance, /api/customers, /api/suppliers (non-portal), /api/orders mutations
 * and /api/marketing/command, to customer-scope /api/customer/*, and supplier-scope
 * /api/suppliers/portal/* (IDOR closure). Rather than rewriting dozens of fetch
 * call sites scattered across the app, this module wraps window.fetch ONCE:
 *
 *   - sessionStorage['ksh_staff_token']        → Bearer for staff-guarded prefixes
 *   - localStorage['ksh_customer_token']       → Bearer for /api/customer/*
 *   - localStorage['ksh_supplier_token']       → Bearer for /api/suppliers/portal/*
 *
 * It also broadcasts a 'kisholoy-auth-expired' CustomEvent on 401 so gated UIs
 * (admin login screen, supplier portal) can drop stale sessions and prompt re-login.
 */

const STAFF_PREFIXES = [
  '/api/admin',
  '/api/finance',
  '/api/customers',
  '/api/marketing/command',
  '/api/security',
  '/api/orders'
];
const STAFF_PUBLIC_PATHS = [
  '/api/orders/create',
  '/api/orders/track',
  '/api/security/auth/login',
  '/api/security/auth/reset-password-request',
  '/api/security/auth/reset-password-confirm',
  '/api/security/auth/mfa-verify'
];

function pathOf(input: RequestInfo | URL): string {
  try {
    if (typeof input === 'string') return new URL(input, window.location.origin).pathname;
    if (input instanceof URL) return input.pathname;
    if (typeof (input as Request).url === 'string') return new URL((input as Request).url, window.location.origin).pathname;
  } catch {
    /* fall through */
  }
  return '';
}

function isSameOrigin(input: RequestInfo | URL): boolean {
  try {
    if (typeof input === 'string') return input.startsWith('/') || input.startsWith(window.location.origin);
    if (input instanceof URL) return input.origin === window.location.origin;
    const u = (input as Request).url;
    return typeof u === 'string' ? (u.startsWith('/') || u.startsWith(window.location.origin)) : false;
  } catch {
    return false;
  }
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (!isSameOrigin(input)) return originalFetch(input, init);
  const path = pathOf(input);
  if (!path.startsWith('/api/')) return originalFetch(input, init);

  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined) || undefined);
  let touched = false;

  if (!headers.has('authorization')) {
    if (path.startsWith('/api/customer/')) {
      const tok = localStorage.getItem('ksh_customer_token');
      if (tok) { headers.set('Authorization', `Bearer ${tok}`); touched = true; }
    } else if (path.startsWith('/api/suppliers/portal/')) {
      const tok = localStorage.getItem('ksh_supplier_token');
      if (tok) { headers.set('Authorization', `Bearer ${tok}`); touched = true; }
    } else if (STAFF_PREFIXES.some(p => path === p || path.startsWith(p + '/')) && !STAFF_PUBLIC_PATHS.includes(path)) {
      const tok = sessionStorage.getItem('ksh_staff_token');
      if (tok) { headers.set('Authorization', `Bearer ${tok}`); touched = true; }
    }
  }

  const res = await originalFetch(input, touched ? { ...(init || {}), headers } : init);

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('kisholoy-auth-expired', { detail: { path } }));
  }
  return res;
};

/** Persist / clear the staff session token (admin login gate). */
export const staffAuth = {
  getToken: () => sessionStorage.getItem('ksh_staff_token'),
  setSession: (token: string, user: unknown) => {
    sessionStorage.setItem('ksh_staff_token', token);
    sessionStorage.setItem('ksh_staff_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('kisholoy-auth-ready'));
  },
  clear: () => {
    sessionStorage.removeItem('ksh_staff_token');
    sessionStorage.removeItem('ksh_staff_user');
  },
  getUser: <T,>(): T | null => {
    try {
      const raw = sessionStorage.getItem('ksh_staff_user');
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
};

export const customerAuth = {
  setToken: (token: string) => localStorage.setItem('ksh_customer_token', token),
  clear: () => localStorage.removeItem('ksh_customer_token')
};

/** Clean sign-out: server revocation first, then local wipe + gate re-lock. */
export async function staffLogout(): Promise<void> {
  const tok = sessionStorage.getItem('ksh_staff_token');
  try {
    await originalFetch('/api/security/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
      body: '{}'
    });
  } catch { /* offline — local state still cleared */ }
  staffAuth.clear();
  window.dispatchEvent(new CustomEvent('kisholoy-auth-expired'));
}

/** Plain fetch for the login gate itself (must not recurse through the patch semantics). */
export async function authFetch(path: string, body?: unknown): Promise<{ status: number; data: any }> {
  const tok = sessionStorage.getItem('ksh_staff_token');
  const res = await originalFetch(path, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
}
