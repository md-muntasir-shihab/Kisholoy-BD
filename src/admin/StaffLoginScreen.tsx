import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from '../components/brand/BrandLogo';
import { setStaffToken } from '../lib/apiClient';
import { logAuthEvent } from '../utils/telemetryLogger';
import { Role } from '../types';

interface StaffLoginScreenProps {
  onAuthenticated: (session: { token: string; role: Role; name: string; email: string }) => void;
}

/**
 * Staff sign-in gate for the admin control plane.
 *
 * The server now enforces RBAC on every admin mutation, so operators need a
 * real session token instead of the old role-picker dropdown. This screen is
 * the only producer of `kisholoy_staff_token`, which `apiFetch` attaches to
 * subsequent admin calls.
 */
export function StaffLoginScreen({ onAuthenticated }: StaffLoginScreenProps) {
  const { language } = useApp();
  const isBn = language === 'BN';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(isBn ? 'ইমেইল ও পাসওয়ার্ড দুটোই দিন।' : 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/security/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.token) {
        const message =
          data.errorBn && isBn
            ? data.errorBn
            : data.error || (isBn ? 'লগইন ব্যর্থ হয়েছে।' : 'Sign-in failed.');
        setError(message);
        logAuthEvent({
          userId: 'unknown',
          userName: email.trim(),
          userPhone: '-',
          userEmail: email.trim(),
          role: 'CUSTOMER',
          eventType: 'LOGIN_FAILED',
          district: 'Dhaka',
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile (Browser)' : 'Desktop (Browser)',
          status: 'FAILED',
        });
        return;
      }

      setStaffToken(data.token);
      const role: Role = data.user?.role || data.session?.role || 'ADMIN';
      logAuthEvent({
        userId: data.user?.id || 'staff',
        userName: data.user?.name || email.trim(),
        userPhone: data.user?.phone || '-',
        userEmail: data.user?.email || email.trim(),
        role,
        eventType: 'LOGIN_SUCCESS',
        district: 'Dhaka',
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile (Browser)' : 'Desktop (Browser)',
        status: 'SUCCESS',
      });

      onAuthenticated({
        token: data.token,
        role,
        name: data.user?.name || email.trim(),
        email: data.user?.email || email.trim(),
      });
    } catch (err: any) {
      setError(
        isBn
          ? 'সার্ভারের সাথে সংযোগ করা যায়নি। ইন্টারনেট চেক করুন।'
          : 'Could not reach the server. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-stone-300 dark:border-slate-700 ' +
    'bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 ' +
    'focus:outline-none focus:ring-2 focus:ring-teal-600/40 focus:border-teal-700 transition';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-stone-100 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <BrandLogo variant="light" size="md" linkToHome showTagline={false} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-900 text-white shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-serif font-bold text-base text-stone-900 dark:text-white leading-tight">
                  {isBn ? 'স্টাফ সাইন ইন' : 'Staff Sign In'}
                </h1>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  {isBn
                    ? 'কিশলয় অ্যাডমিন কন্ট্রোল প্যানেল — অনুমোদিত কর্মী মাত্র'
                    : 'Kisholoy Admin Control Panel — authorised staff only'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="staff-email" className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                {isBn ? 'অফিসিয়াল ইমেইল' : 'Work email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kisholoy.com"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="staff-password" className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputCls} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? isBn ? 'পাসওয়ার্ড লুকান' : 'Hide password'
                      : isBn ? 'পাসওয়ার্ড দেখান' : 'Show password'
                  }
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-900 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? isBn ? 'যাচাই করা হচ্ছে…' : 'Verifying…'
                : isBn ? 'সাইন ইন করুন' : 'Sign in'}
            </button>

            <p className="text-[10px] text-stone-500 dark:text-slate-500 leading-relaxed pt-1">
              {isBn
                ? 'প্রতিটি অ্যাডমিন কাজ সার্ভারে যাচাই ও অডিট করা হয়। শেয়ার্ড ডিভাইসে কাজ শেষে সাইন আউট করুন।'
                : 'Every admin action is verified and audited server-side. Sign out when using a shared device.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
