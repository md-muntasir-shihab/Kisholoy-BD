/**
 * StaffLoginGate — real credential gate for the admin control plane
 * (security audit Phase 4, C7). Before this, /admin/* relied on a client-side
 * role persona switcher only. The gate now:
 *   1. verifies any stored staff token against /api/security/auth/verify,
 *   2. renders the login form otherwise (email + password),
 *   3. keeps the UI session in sync: login stores the server token via the
 *      apiAuth helper that the patched fetch attaches to guarded /api calls,
 *   4. reacts to 401 broadcasts ('kisholoy-auth-expired') by locking again.
 *
 * The MFA simulation inside the engine is left as-is (documented FUTURE item);
 * this gate only enforces the password + server session that was missing.
 */
import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { staffAuth, authFetch } from '../../lib/apiAuth';
import { useApp } from '../../context/AppContext';

type GateState = 'checking' | 'anon' | 'ok';

export function StaffLoginGate({ children }: { children: React.ReactNode }) {
  const { setCurrentRole } = useApp();
  const [state, setState] = useState<GateState>('checking');
  const [email, setEmail] = useState('admin@kisholoy.com');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const verifyExisting = async () => {
    if (!staffAuth.getToken()) { setState('anon'); return; }
    const { status, data } = await authFetch('/api/security/auth/verify', {});
    if (status === 200 && data?.valid) {
      setState('ok');
      if (data?.user?.role) setCurrentRole(data.user.role);
    } else {
      staffAuth.clear();
      setState('anon');
    }
  };

  useEffect(() => {
    verifyExisting();
    const onExpired = () => { staffAuth.clear(); setState('anon'); };
    window.addEventListener('kisholoy-auth-expired', onExpired);
    return () => window.removeEventListener('kisholoy-auth-expired', onExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setHint(null);
    try {
      const { status, data } = await authFetch('/api/security/auth/login', { email, password });
      if (status === 200 && data?.success && data.token) {
        staffAuth.setSession(data.token, data.user);
        if (data.user?.role) setCurrentRole(data.user.role);
        setState('ok');
        setPassword('');
        if (data.requires2FA) {
          setHint(data.user?.twoFactorEnabled
            ? 'MFA is flagged for this account — step-up verification remains a FUTURE item in this build.'
            : null);
        }
      } else {
        setError(data?.error || 'Login failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection failed.');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'checking') {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-100 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-teal-700 dark:text-teal-300" />
      </div>
    );
  }

  if (state === 'anon') {
    return (
      <div id="admin-login-gate" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-white to-teal-50/60 dark:from-slate-950 dark:via-stone-950 dark:to-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-6 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-700 to-teal-950 flex items-center justify-center font-serif font-black text-white shadow-xs border border-teal-600/40">K</div>
            <span className="font-serif font-black text-2xl text-stone-900 dark:text-white tracking-tight">KISHOLOY</span>
            <span className="text-teal-800 dark:text-teal-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800/80 uppercase tracking-wider">Staff</span>
          </div>
          <form onSubmit={handleLogin} className="bg-white/90 dark:bg-stone-900/80 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-teal-300" />
              <h1 className="font-bold text-lg">নিয়ন্ত্রণ প্লেন / Control Plane Sign-in</h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              সার্ভার-ভেরিফাইড স্টাফ সেশন ছাড়া অ্যাডমিন API ব্লকড। <br />
              Admin APIs are rejected without a server-verified staff session (audit C7 fix).
            </p>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Email</label>
              <input
                id="admin-login-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/60"
                placeholder="you@kisholoy.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="admin-login-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/60"
                  placeholder="••••••••••"
                />
              </div>
            </div>
            {error && <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2">{error}</div>}
            {hint && <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl px-3 py-2">{hint}</div>}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white text-sm font-bold shadow-xs transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {busy ? 'Verifying…' : 'Sign in / সাইন ইন'}
            </button>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-relaxed pt-1 border-t border-stone-100 dark:border-stone-800">
              ডেমো বুটে: সার্ভার কনসোলে এক-বারের bootstrap পাসওয়ার্ড মুদ্রিত হয় (KISHOLOY_ADMIN_INIT_PASSWORD দিয়ে নিজেরটা ঠিক করুন)।<br />
              Dev boot prints a one-time bootstrap staff password in the server console unless pinned via <code>KISHOLOY_ADMIN_INIT_PASSWORD</code>.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


