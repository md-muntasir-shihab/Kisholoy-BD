import React, { useState } from 'react';
import { 
  X, User, Lock, Phone, Mail, MapPin, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, Sparkles, Link2, LogOut, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { logAuthEvent } from '../../utils/telemetryLogger';
import { signInWithGoogle } from '../../lib/firebase';
import { BrandLogo } from '../brand/BrandLogo';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'guest' | 'link_order';
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { 
    language, 
    showToast, 
    currentCustomerId, 
    setCurrentCustomerId,
    customers,
    setCustomers 
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'guest' | 'link_order'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Registration fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');

  // Link guest order fields
  const [orderNumber, setOrderNumber] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please enter your phone number/email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (data.success && data.customer) {
        if (data.token) localStorage.setItem('ksh_customer_token', data.token);
        setCurrentCustomerId(data.customer.id);
        logAuthEvent({
          userId: data.customer.id,
          userName: data.customer.name,
          userPhone: data.customer.phone,
          userEmail: data.customer.email,
          role: 'CUSTOMER',
          eventType: 'LOGIN_SUCCESS',
          district: data.customer.district || 'Dhaka',
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile (Chrome)' : 'Desktop (Browser)',
          status: 'SUCCESS'
        });
        showToast(`Welcome back, ${data.customer.name}!`);
        onClose();
      } else {
        logAuthEvent({
          userId: 'anonymous',
          userName: identifier,
          userPhone: identifier,
          role: 'GUEST',
          eventType: 'LOGIN_FAILED',
          district: 'Dhaka',
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile (Chrome)' : 'Desktop (Browser)',
          status: 'FAILED'
        });
        showToast(data.error || 'Invalid phone or password.');
      }
    } catch (err: any) {
      showToast(err.message || 'Login connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        logAuthEvent({
          userId: user.uid,
          userName: user.displayName || 'Google User',
          userPhone: user.phoneNumber || 'Google Account',
          userEmail: user.email || '',
          role: user.email === 'mdmuntasirshihab@gmail.com' ? 'SUPER_ADMIN' : 'CUSTOMER',
          eventType: 'LOGIN_SUCCESS',
          district: 'Dhaka',
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile (Chrome)' : 'Desktop (Browser)',
          status: 'SUCCESS'
        });
        showToast(language === 'BN' ? `স্বাগতম, ${user.displayName || 'ব্যবহারকারী'}! (গুগল সাইন-ইন সফল)` : `Welcome, ${user.displayName || 'User'}! (Google Sign-In Successful)`);
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      showToast('Name, phone number and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, address, district })
      });
      const data = await res.json();
      if (data.success && data.customer) {
        if (data.token) localStorage.setItem('ksh_customer_token', data.token);
        setCustomers([...customers, data.customer]);
        setCurrentCustomerId(data.customer.id);
        showToast(`Account created! Welcome, ${data.customer.name}.`);
        onClose();
      } else {
        showToast(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGuestOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !verificationPhone) {
      showToast('Please provide both Order Number and phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth/link-guest-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentCustomerId,
          orderNumber,
          phone: verificationPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Order successfully linked to your account!');
        onClose();
      } else {
        showToast(data.error || 'Could not find or verify this order.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to link order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <BrandLogo variant="light" size="sm" linkToHome={false} showTagline={false} />
            <div className="border-l border-stone-300 pl-3">
              <h3 className="font-serif font-bold text-sm text-stone-900 leading-tight">
                {mode === 'login' && (language === 'BN' ? 'লগইন করুন' : 'Customer Sign In')}
                {mode === 'register' && (language === 'BN' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account')}
                {mode === 'guest' && (language === 'BN' ? 'গেস্ট কাস্টমার মোড' : 'Guest Shopper Mode')}
                {mode === 'link_order' && (language === 'BN' ? 'গেস্ট অর্ডার লিঙ্ক করুন' : 'Link Guest Order')}
              </h3>
              <p className="text-[11px] text-stone-500">
                {mode === 'guest' 
                  ? 'Shop freely without an account'
                  : 'Kisholoy customer account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setMode('login')}
            className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'login' ? 'border-teal-900 text-teal-950 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'register' ? 'border-teal-900 text-teal-950 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setMode('guest')}
            className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'guest' ? 'border-teal-900 text-teal-950 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Guest Shopper
          </button>
          <button
            onClick={() => setMode('link_order')}
            className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              mode === 'link_order' ? 'border-teal-900 text-teal-950 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Link Guest Order
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {language === 'BN' ? 'মোবাইল নম্বর অথবা ইমেইল' : 'Mobile Number or Email'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="017XXXXXXXX or user@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {language === 'BN' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-500 space-y-1">
                <span className="font-semibold text-stone-700 block">Test Demo Accounts:</span>
                <div className="flex justify-between items-center">
                  <span>Tanzil Ahmed:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('tanzil@customer.kisholoy.com');
                      setPassword('password123');
                    }}
                    className="text-teal-900 font-mono font-semibold hover:underline"
                  >
                    Use Tanzil
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Nusrat Jahan:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('nusrat@customer.kisholoy.com');
                      setPassword('password123');
                    }}
                    className="text-teal-900 font-mono font-semibold hover:underline"
                  >
                    Use Nusrat
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                <span className="relative bg-white px-2 text-[10px] uppercase tracking-wider font-bold text-stone-400">Or Continue With</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{language === 'BN' ? 'গুগল (Firebase) দিয়ে সাইন-ইন' : 'Sign in with Google'}</span>
              </button>

              <div className="text-center pt-1 text-[11px] text-stone-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-teal-900 font-semibold hover:underline"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanzil Ahmed"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="optional"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Delivery Address & District</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Area, Dhaka"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs mt-2"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>

              <div className="relative my-2 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                <span className="relative bg-white px-2 text-[10px] uppercase tracking-wider font-bold text-stone-400">Or Quick Register With</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{language === 'BN' ? 'গুগল দিয়ে দ্রুত রেজিস্টার করুন' : 'Sign up with Google'}</span>
              </button>
            </form>
          )}

          {/* MODE 3: GUEST SHOPPER */}
          {mode === 'guest' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-800" />
                  <span>No Account Needed to Shop</span>
                </span>
                <p className="text-stone-600 leading-relaxed">
                  You can freely browse products, add items to your cart, and complete checkout using Cash on Delivery (COD) or bKash / Cards without creating an account.
                </p>
              </div>

              <div className="space-y-2 text-stone-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 mt-0.5" />
                  <span>Instant checkout with just your name, phone number, and address.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 mt-0.5" />
                  <span>Track your delivery status anytime using the Track Order page.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 mt-0.5" />
                  <span>Optionally create an account later and link your past orders seamlessly.</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors"
              >
                Continue Shopping as Guest
              </button>
            </div>
          )}

          {/* MODE 4: LINK GUEST ORDER */}
          {mode === 'link_order' && (
            <form onSubmit={handleLinkGuestOrder} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-teal-800" />
                  <span>Link a Previous Guest Order</span>
                </div>
                <p className="leading-relaxed text-teal-800">
                  Did you place an order before creating your account? Enter your Order Number and verification phone number to attach it to your profile.
                </p>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Order Number (e.g. KSH-2026-001 or ord-001)
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="KSH-2026-001"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Order Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={verificationPhone}
                  onChange={(e) => setVerificationPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>{loading ? 'Verifying & Linking...' : 'Link Order to Account'}</span>
                <Link2 className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 flex justify-between items-center">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-800" />
            <span>Secure 256-bit Session</span>
          </span>
          <button
            onClick={onClose}
            className="hover:text-stone-800 font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
