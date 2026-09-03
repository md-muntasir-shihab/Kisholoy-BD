import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, 
  CheckCircle2, Sparkles, Eye, EyeOff, Globe, ExternalLink, HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface DemoSupplierAccount {
  id: string;
  name: string;
  nameBn: string;
  code: string;
  category: string;
  email: string;
  contact: string;
}

const DEMO_SUPPLIERS: DemoSupplierAccount[] = [
  {
    id: 'sup-001',
    name: 'Sonargaon Heritage Jamdani Artisans',
    nameBn: 'সোনারগাঁও জামদানী কারিগর সমবায়',
    code: 'SUP-JAM-001',
    category: 'Handloom & Traditional Sarees',
    email: 'supplier.jamdani@kisholoy.com',
    contact: 'Master Weaver Alimuddin Mia'
  },
  {
    id: 'sup-002',
    name: 'ClayCraft Pottery & Terracotta Guild',
    nameBn: 'ক্লে-ক্রাফট পটারি অ্যান্ড টেরাকোটা গিল্ড',
    code: 'SUP-TER-002',
    category: 'Handicrafts & Terracotta Art',
    email: 'supplier.claycraft@kisholoy.com',
    contact: 'Bikash Chandra Paul'
  },
  {
    id: 'sup-003',
    name: 'Sreemangal Organic Tea Estates',
    nameBn: 'শ্রীমঙ্গল অর্গানিক চা এস্টেট',
    code: 'SUP-TEA-003',
    category: 'Organic Pantry & Tea',
    email: 'supplier.tea@kisholoy.com',
    contact: 'Kazi Farhan Ahmed'
  },
  {
    id: 'sup-004',
    name: 'Hazaribagh Master Leather Crafts',
    nameBn: 'হাজারীবাগ মাস্টার লেদার ক্রাফটস',
    code: 'SUP-LEA-004',
    category: 'Full-Grain Leather Goods',
    email: 'supplier.leather@kisholoy.com',
    contact: 'Shahadat Hossain'
  },
  {
    id: 'sup-005',
    name: 'Comilla Khadi Handloom Cooperative',
    nameBn: 'কুমিল্লা খাদি হস্তচালিত তাঁত সমিতি',
    code: 'SUP-KHA-005',
    category: 'Pure Khadi Fabric',
    email: 'supplier.khadi@kisholoy.com',
    contact: 'Prabir Devnath'
  }
];

export function SupplierLoginPage() {
  const navigate = useNavigate();
  const { language, setLanguage, showToast } = useApp();

  const [email, setEmail] = useState('supplier.jamdani@kisholoy.com');
  const [password, setPassword] = useState('kisholoy2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'BN' ? 'সাপ্লায়ার ইমেইল প্রদান করুন' : 'Please provide your supplier login email.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/suppliers/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save supplier session to localStorage
      localStorage.setItem('ksh_supplier_token', data.token);
      localStorage.setItem('ksh_supplier_user', JSON.stringify(data.supplier));

      if (typeof showToast === 'function') {
        showToast(
          language === 'BN' 
            ? `স্বাগতম ${data.supplier.companyName}! সাপ্লায়ার পোর্টালে যুক্ত হয়েছেন।` 
            : `Welcome ${data.supplier.companyName}! Logged into Supplier Portal.`
        );
      }

      navigate('/supplier');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials or contact Kisholoy administration.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (demo: DemoSupplierAccount) => {
    setEmail(demo.email);
    setPassword('kisholoy2026');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950">
      {/* Top Header */}
      <header className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo variant="dark" size="md" />
          <div className="h-5 w-px bg-stone-800"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800/50 px-2.5 py-0.5 rounded-md">
              {language === 'BN' ? 'সাপ্লায়ার পোর্টাল' : 'Supplier Portal'}
            </span>
            <span className="hidden sm:inline-block text-[11px] text-stone-400 font-medium">
              Self-Service Procurement & Settlement Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-300 transition-colors border border-stone-700"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'EN' ? 'বাংলা' : 'English'}</span>
          </button>

          <Link
            to="/admin/suppliers"
            className="text-xs text-stone-400 hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-stone-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{language === 'BN' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
          </Link>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Security Notice */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{language === 'BN' ? 'নিরাপদ আইসোলেটেড ভেন্ডর নেটওয়ার্ক' : 'Isolated Vendor Security Boundary'}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                {language === 'BN' ? (
                  <>সাপ্লায়ার রেভিনিউ, সাপ্লাই ব্যাচ ও <span className="text-amber-400">সেটেলমেন্ট কন্ট্রোল</span></>
                ) : (
                  <>Transparent Revenue, Supply Batches & <span className="text-amber-400">Settlements</span></>
                )}
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed">
                {language === 'BN'
                  ? 'কিশলয় প্ল্যাটফর্মের প্রতিটি রেজিস্টার্ড সাপ্লায়ার ও কারিগর সমিতির জন্য বিশেষায়িত পোর্টাল। নিজস্ব পণ্যের সাপ্লাই, ডেলিভারি অর্ডার থেকে প্রাপ্ত শেয়ার, বিলিং ও ব্যাংক পেমেন্ট ভাউচার তাৎক্ষণিকভাবে ট্র্যাক করুন।'
                  : 'A dedicated self-service hub for registered Kisholoy artisans, weavers, and suppliers. Monitor delivered order shares, stock batches, purchase orders, and direct bank/MFS payouts in real-time.'}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-1">
                <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'BN' ? 'রিয়েল-টাইম রেভিনিউ শেয়ার' : 'Real-Time Revenue Share'}
                </div>
                <p className="text-stone-400 text-[11px] leading-normal">
                  {language === 'BN' ? 'ডেলিভার্ড অর্ডারের ভিত্তিতে স্বয়ংক্রিয়ভাবে হিসাবকৃত প্রাপ্য টাকা।' : 'Delivered order calculations with transparent contract terms.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-1">
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'BN' ? 'ব্যাংক ও bKash পেআউট' : 'Bank & MFS Disbursements'}
                </div>
                <p className="text-stone-400 text-[11px] leading-normal">
                  {language === 'BN' ? 'প্রতিটি পেমেন্টের TxID, তারিখ ও ভাউচার হিস্ট্রি।' : 'Complete payment vouchers, transaction IDs, and dues ledger.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-1">
                <div className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'BN' ? 'সাপ্লাই ব্যাচ ও স্টক লেজার' : 'Supply Batches & Stock'}
                </div>
                <p className="text-stone-400 text-[11px] leading-normal">
                  {language === 'BN' ? 'প্রাপ্ত ইউনিট, বিক্রি হওয়া ইউনিট ও মজুত স্টকের রিয়েলটাইম আপডেট।' : 'Batch-wise units received, sold, remaining, and cost.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-1">
                <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'BN' ? 'অফিসিয়াল স্টেটমেন্ট ডাউনলোড' : 'Official Statement Export'}
                </div>
                <p className="text-stone-400 text-[11px] leading-normal">
                  {language === 'BN' ? 'যেকোনো তারিখের রেঞ্জ অনুযায়ী প্রিন্ট ও এক্সেল/পিডিএফ স্টেটমেন্ট।' : 'Filter by date range and print official financial ledger.'}
                </p>
              </div>
            </div>

            {/* Strict Isolation Callout */}
            <div className="p-3 rounded-xl bg-stone-900/90 border border-amber-900/50 flex items-start gap-3 text-xs text-amber-200/90">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">
                  {language === 'BN' ? 'গোপনীয়তা ও সিকিউরিটি গ্যারান্টি:' : 'Zero-Trust Isolation Guarantee:'}
                </strong>
                <span>
                  {language === 'BN'
                    ? 'আপনার পোর্টাল সম্পূর্ণ আইসোলেটেড। অন্য সাপ্লায়ারের কোনো তথ্য বা কিশলয়ের আভ্যন্তরীণ গ্রাহক ডেটা এখানে দেখা যাবে না।'
                    : 'Each supplier account is strictly locked to its own domain. Customer PII and other supplier balances are cryptographically isolated.'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Card: Login Box & Demo Switcher */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-teal-500"></div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    {language === 'BN' ? 'সাপ্লায়ার অ্যাকাউন্টে প্রবেশ' : 'Supplier Portal Login'}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {language === 'BN' ? 'আপনার নির্ধারিত ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন' : 'Sign in to access your vendor dashboard'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    {language === 'BN' ? 'সাপ্লায়ার ইমেইল (Login Email)' : 'Supplier Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. supplier.jamdani@kisholoy.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-300">
                      {language === 'BN' ? 'পাসওয়ার্ড (Password)' : 'Security Password'}
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Default: <code className="text-amber-300 bg-stone-950 px-1 py-0.5 rounded font-mono">kisholoy2026</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>{language === 'BN' ? 'যাচাই করা হচ্ছে...' : 'Verifying Credentials...'}</span>
                    </span>
                  ) : (
                    <>
                      <span>{language === 'BN' ? 'পোর্টালে প্রবেশ করুন' : 'Sign In to Portal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Switcher */}
              <div className="mt-6 pt-5 border-t border-stone-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {language === 'BN' ? 'টেস্ট / ডেমো সাপ্লায়ার নির্বাচন করুন:' : '1-Click Quick Demo Sign-In:'}
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 font-mono">
                    5 Active Guilds
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {DEMO_SUPPLIERS.map((sup) => (
                    <button
                      key={sup.id}
                      type="button"
                      onClick={() => handleQuickDemoSelect(sup)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between border ${
                        email === sup.email
                          ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                          : 'bg-stone-950/60 hover:bg-stone-800/80 border-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-white truncate flex items-center gap-1.5">
                          <span>{language === 'BN' ? sup.nameBn : sup.name}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono truncate">
                          {sup.code} &bull; {sup.category}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-amber-400 flex-shrink-0">
                        {sup.email.split('@')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Assistance */}
              <div className="mt-4 pt-3 border-t border-stone-800/60 text-center text-[11px] text-stone-500">
                <span>
                  {language === 'BN' ? 'লগইন করতে সমস্যা হচ্ছে? ' : 'Need access or forgot credentials? '}
                </span>
                <Link to="/pages/contact" className="text-amber-400 hover:underline">
                  {language === 'BN' ? 'কিশলয় হেল্পডেস্কে যোগাযোগ করুন' : 'Contact Kisholoy Support'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-4 px-4 sm:px-8 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} KISHOLOY Artisan & Supplier Governance. Protected by TLS 1.3 & Server RBAC.</p>
        <div className="flex items-center gap-4 text-[11px]">
          <Link to="/" className="hover:text-stone-300 transition-colors">Storefront</Link>
          <Link to="/pages/terms" className="hover:text-stone-300 transition-colors">Vendor Terms</Link>
          <Link to="/pages/privacy" className="hover:text-stone-300 transition-colors">Privacy & Isolation</Link>
          <Link to="/admin" className="text-teal-400 hover:text-teal-300 transition-colors">Admin Hub</Link>
        </div>
      </footer>
    </div>
  );
}
