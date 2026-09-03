import React, { useState } from 'react';
import { 
  X, User, Lock, Phone, Mail, MapPin, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, Sparkles, Link2, LogOut, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

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
        setCurrentCustomerId(data.customer.id);
        showToast(`Welcome back, ${data.customer.name}!`);
        onClose();
      } else {
        showToast(data.error || 'Invalid phone or password.');
      }
    } catch (err: any) {
      showToast(err.message || 'Login connection failed.');
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
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-900 text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                {mode === 'login' && (language === 'BN' ? 'লগইন করুন' : 'Customer Sign In')}
                {mode === 'register' && (language === 'BN' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account')}
                {mode === 'guest' && (language === 'BN' ? 'গেস্ট কাস্টমার মোড' : 'Guest Shopper Mode')}
                {mode === 'link_order' && (language === 'BN' ? 'গেস্ট অর্ডার লিঙ্ক করুন' : 'Link Guest Order')}
              </h3>
              <p className="text-xs text-stone-500">
                {mode === 'guest' 
                  ? 'Shop freely without an account'
                  : 'Kisholoy customer account & order services'}
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
