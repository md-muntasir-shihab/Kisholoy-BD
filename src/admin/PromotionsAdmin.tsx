import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Percent,
  Flame,
  Coins,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Search,
  RefreshCw,
  Play,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Gift
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CouponRule, FlashDeal, CustomerLoyaltyWallet, CouponDiscountType, CouponStatus } from '../types';
import { OfflineDataBanner } from '../components/admin/OfflineDataBanner';

export function PromotionsAdmin() {
  const { language, showToast } = useApp();
  const isBn = language === 'BN';

  const [activeTab, setActiveTab] = useState<'COUPONS' | 'FLASH_DEALS' | 'LOYALTY' | 'SIMULATOR'>('COUPONS');
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // Data states
  const [coupons, setCoupons] = useState<CouponRule[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [wallets, setWallets] = useState<CustomerLoyaltyWallet[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRule | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    titleBn: '',
    description: '',
    descriptionBn: '',
    discountType: 'PERCENTAGE' as CouponDiscountType,
    discountValue: 10,
    maxDiscountAmount: '',
    minOrderSubtotal: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    usageLimitTotal: '',
    usageLimitPerCustomer: '1',
    status: 'ACTIVE' as CouponStatus,
    firstOrderOnly: false
  });

  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [loyaltyForm, setLoyaltyForm] = useState({
    phone: '',
    points: 100,
    type: 'ADMIN_ADJUSTMENT' as 'ADMIN_ADJUSTMENT' | 'WELCOME_BONUS' | 'REFERRAL_BONUS' | 'EXPIRY',
    note: ''
  });

  // Simulator state
  const [simCode, setSimCode] = useState('WELCOME10');
  const [simSubtotal, setSimSubtotal] = useState(2500);
  const [simShipping, setSimShipping] = useState(70);
  const [simPhone, setSimPhone] = useState('01711000000');
  const [simResult, setSimResult] = useState<any>(null);
  const [simRunning, setSimRunning] = useState(false);

  const fetchPromotionData = async () => {
    setLoading(true);
    setOffline(false);
    try {
      const [cRes, fRes, lRes] = await Promise.all([
        fetch('/api/promotions/coupons'),
        fetch('/api/promotions/flash-deals'),
        fetch('/api/promotions/loyalty')
      ]);

      if (!cRes.ok || !fRes.ok || !lRes.ok) {
        throw new Error('Failed to load promotions from server');
      }

      const cData = await cRes.json();
      const fData = await fRes.json();
      const lData = await lRes.json();

      if (cData.success) {
        setCoupons(cData.coupons || []);
        if (cData.stats) setStats(cData.stats);
      }
      if (fData.success) {
        setFlashDeals(fData.flashDeals || []);
      }
      if (lData.success) {
        setWallets(lData.wallets || []);
        if (lData.stats) setStats(lData.stats);
      }
    } catch (err: any) {
      console.error('Failed to load promotions data:', err);
      setOffline(true);
      showToast(isBn ? 'প্রোমোশন ডেটা লোড করা যায়নি' : 'Could not load promotions from the server — the list may be out of date.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast(isBn ? `কুপন কোড "${code}" কপি করা হয়েছে` : `Copied coupon "${code}" to clipboard`);
  };

  const handleToggleStatus = async (coupon: CouponRule) => {
    const nextStatus: CouponStatus = coupon.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/promotions/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, operator: 'ADMIN' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(isBn ? `কুপন স্ট্যাটাস পরিবর্তন হয়েছে: ${nextStatus}` : `Coupon status updated to ${nextStatus}`);
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: nextStatus } : c));
      } else {
        showToast(data.error || 'Failed to update coupon status');
      }
    } catch (err) {
      showToast('Network error while updating coupon status');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm(isBn ? 'আপনি কি নিশ্চিত এই কুপনটি ডিলিট করতে চান?' : 'Are you sure you want to delete this coupon?')) {
      return;
    }
    try {
      const res = await fetch(`/api/promotions/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: 'ADMIN' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(isBn ? 'কুপনটি সফলভাবে মুছে ফেলা হয়েছে' : 'Coupon deleted successfully');
        setCoupons(prev => prev.filter(c => c.id !== id));
      } else {
        showToast(data.error || 'Failed to delete coupon');
      }
    } catch (err) {
      showToast('Network error while deleting coupon');
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      title: '',
      titleBn: '',
      description: '',
      descriptionBn: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscountAmount: '',
      minOrderSubtotal: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      usageLimitTotal: '',
      usageLimitPerCustomer: '1',
      status: 'ACTIVE',
      firstOrderOnly: false
    });
    setIsCouponModalOpen(true);
  };

  const openEditModal = (c: CouponRule) => {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code,
      title: c.title,
      titleBn: c.titleBn || c.title,
      description: c.description || '',
      descriptionBn: c.descriptionBn || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : '',
      minOrderSubtotal: c.minOrderSubtotal ? String(c.minOrderSubtotal) : '',
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate.split('T')[0],
      usageLimitTotal: c.usageLimitTotal ? String(c.usageLimitTotal) : '',
      usageLimitPerCustomer: c.usageLimitPerCustomer ? String(c.usageLimitPerCustomer) : '1',
      status: c.status,
      firstOrderOnly: Boolean(c.firstOrderOnly)
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim() || !couponForm.title.trim()) {
      showToast('Please enter both coupon code and title');
      return;
    }

    const payload = {
      code: couponForm.code.toUpperCase().trim(),
      title: couponForm.title.trim(),
      titleBn: couponForm.titleBn.trim() || couponForm.title.trim(),
      description: couponForm.description.trim(),
      descriptionBn: couponForm.descriptionBn.trim(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : undefined,
      minOrderSubtotal: couponForm.minOrderSubtotal ? Number(couponForm.minOrderSubtotal) : undefined,
      startDate: new Date(couponForm.startDate).toISOString(),
      endDate: new Date(couponForm.endDate).toISOString(),
      usageLimitTotal: couponForm.usageLimitTotal ? Number(couponForm.usageLimitTotal) : undefined,
      usageLimitPerCustomer: Number(couponForm.usageLimitPerCustomer) || 1,
      status: couponForm.status,
      firstOrderOnly: couponForm.firstOrderOnly,
      operator: 'ADMIN'
    };

    try {
      if (editingCoupon) {
        const res = await fetch(`/api/promotions/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(isBn ? 'কুপন সফলভাবে আপডেট হয়েছে' : 'Coupon updated successfully');
          setIsCouponModalOpen(false);
          fetchPromotionData();
        } else {
          showToast(data.error || 'Failed to update coupon');
        }
      } else {
        const res = await fetch('/api/promotions/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(isBn ? 'নতুন কুপন সফলভাবে তৈরি হয়েছে' : 'Coupon created successfully');
          setIsCouponModalOpen(false);
          fetchPromotionData();
        } else {
          showToast(data.error || 'Failed to create coupon');
        }
      }
    } catch (err) {
      showToast('Network error while saving coupon');
    }
  };

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltyForm.phone.trim() || !loyaltyForm.note.trim()) {
      showToast('Customer phone and reason/note are required');
      return;
    }

    try {
      const res = await fetch('/api/promotions/loyalty/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loyaltyForm.phone.trim(),
          points: Number(loyaltyForm.points),
          type: loyaltyForm.type,
          note: loyaltyForm.note.trim(),
          operator: 'ADMIN'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(isBn ? 'লয়্যালটি পয়েন্ট সফলভাবে সমন্বয় করা হয়েছে' : 'Loyalty points adjusted successfully');
        setIsLoyaltyModalOpen(false);
        setLoyaltyForm({ phone: '', points: 100, type: 'ADMIN_ADJUSTMENT', note: '' });
        fetchPromotionData();
      } else {
        showToast(data.error || 'Failed to adjust loyalty points');
      }
    } catch (err) {
      showToast('Network error while adjusting points');
    }
  };

  const runSimulator = async () => {
    if (!simCode.trim()) {
      showToast('Please enter a coupon code to test');
      return;
    }
    setSimRunning(true);
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: simCode.trim(),
          subtotal: Number(simSubtotal),
          shippingFee: Number(simShipping),
          customerPhone: simPhone.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data.evaluation);
        showToast(data.evaluation.valid ? 'Coupon is valid!' : (data.evaluation.message || 'Coupon invalid'));
      } else {
        setSimResult({ valid: false, message: data.error || 'Validation failed' });
        showToast(data.error || 'Simulation failed');
      }
    } catch (err) {
      showToast(isBn ? 'প্রোমোশন ইঞ্জিনের সাথে যোগাযোগ করা যায়নি' : 'Could not reach the promotions engine — simulation did not run.');
    } finally {
      setSimRunning(false);
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.titleBn && c.titleBn.includes(searchTerm));
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  return (
    <div id="promotions-admin-view" className="space-y-6">
      <OfflineDataBanner
        resource="promotions & loyalty rules"
        resourceBn="প্রোমোশন ও লয়্যালটি রুলস"
        visible={offline}
        onRetry={fetchPromotionData}
      />

      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              <Gift className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {isBn ? 'প্রোমোশন ও লয়্যালটি ইঞ্জিন' : 'Promotions & Loyalty Engine'}
            </h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {isBn
              ? 'কুপন ডিসকাউন্ট, ফ্ল্যাশ সেল অফার, লয়্যালটি রিওয়ার্ড ওয়ালেট ও চেকআউট রিয়েল-টাইম সিমুলেটর'
              : 'Coupon discounts, flash deals, customer loyalty reward wallets and checkout real-time validator.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-promotions"
            onClick={fetchPromotionData}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {isBn ? 'রিফ্রেশ' : 'Refresh'}
          </button>
          <button
            id="btn-create-coupon-header"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 transition shadow-sm flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {isBn ? 'নতুন কুপন' : 'New Coupon'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">{isBn ? 'সক্রিয় কুপন' : 'Active Coupons'}</span>
            <Ticket className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {coupons.filter(c => c.status === 'ACTIVE').length}
          </div>
          <span className="text-[11px] text-stone-500">{coupons.length} {isBn ? 'মোট কুপন রুল' : 'total rules in registry'}</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">{isBn ? 'কুপন রিডিম সংখ্যা' : 'Redemptions'}</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
          </div>
          <span className="text-[11px] text-stone-500">{isBn ? 'অর্ডারে সফল ডিসকাউন্ট' : 'successful discount orders'}</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">{isBn ? 'ফ্ল্যাশ ডিল' : 'Flash Deals'}</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {flashDeals.filter(f => f.status === 'ACTIVE').length}
          </div>
          <span className="text-[11px] text-stone-500">{flashDeals.length} {isBn ? 'ক্যাম্পেইন নিবন্ধিত' : 'scheduled deals'}</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">{isBn ? 'লয়্যালটি ওয়ালেট' : 'Loyalty Wallets'}</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {wallets.length}
          </div>
          <span className="text-[11px] text-stone-500">{isBn ? 'নিবন্ধিত গ্রাহক সদস্য' : 'registered members'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          id="tab-coupons"
          onClick={() => setActiveTab('COUPONS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'COUPONS'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          {isBn ? 'কুপন ম্যানেজমেন্ট' : 'Coupons & Promo Codes'}
        </button>

        <button
          id="tab-flash-deals"
          onClick={() => setActiveTab('FLASH_DEALS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'FLASH_DEALS'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          {isBn ? 'ফ্ল্যাশ সেল ও ডিল' : 'Flash Deals'}
        </button>

        <button
          id="tab-loyalty"
          onClick={() => setActiveTab('LOYALTY')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'LOYALTY'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          {isBn ? 'লয়্যালটি পয়েন্টস' : 'Loyalty Wallets'}
        </button>

        <button
          id="tab-simulator"
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'SIMULATOR'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Play className="w-4 h-4" />
          {isBn ? 'চেকআউট সিমুলেটর' : 'Checkout Simulator'}
        </button>
      </div>

      {/* TAB 1: COUPONS */}
      {activeTab === 'COUPONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isBn ? 'কুপন কোড বা নাম দিয়ে খুঁজুন...' : 'Search by coupon code or title...'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                <option value="ALL">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                <option value="ACTIVE">{isBn ? 'সক্রিয় (ACTIVE)' : 'Active'}</option>
                <option value="DISABLED">{isBn ? 'নিষ্ক্রিয় (DISABLED)' : 'Disabled'}</option>
                <option value="EXPIRED">{isBn ? 'মেয়াদোত্তীর্ণ (EXPIRED)' : 'Expired'}</option>
              </select>

              <button
                id="btn-create-coupon-body"
                onClick={openCreateModal}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                {isBn ? 'কুপন যুক্ত করুন' : 'Add Coupon'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-4">{isBn ? 'কুপন কোড' : 'Coupon Code'}</th>
                    <th className="p-4">{isBn ? 'শিরোনাম ও বিবরণ' : 'Title & Description'}</th>
                    <th className="p-4">{isBn ? 'ডিসকাউন্ট ভ্যালু' : 'Discount'}</th>
                    <th className="p-4">{isBn ? 'নিয়ম ও সীমাবদ্ধতা' : 'Rules & Caps'}</th>
                    <th className="p-4">{isBn ? 'ব্যবহার / সীমা' : 'Usage / Limit'}</th>
                    <th className="p-4">{isBn ? 'মেয়াদ' : 'Validity'}</th>
                    <th className="p-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="p-4 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                  {filteredCoupons.map(coupon => {
                    const isActive = coupon.status === 'ACTIVE';
                    const isExp = new Date(coupon.endDate) < new Date();
                    return (
                      <tr key={coupon.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                        <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-[11px]">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              title="Copy code"
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="font-semibold text-stone-900 dark:text-stone-100">{isBn ? coupon.titleBn || coupon.title : coupon.title}</p>
                          {coupon.description && (
                            <p className="text-[11px] text-stone-500 line-clamp-1">{isBn ? coupon.descriptionBn || coupon.description : coupon.description}</p>
                          )}
                        </td>
                        <td className="p-4 font-semibold">
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{coupon.discountValue}% OFF</span>
                          ) : coupon.discountType === 'FIXED_AMOUNT' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">৳{coupon.discountValue} FLAT</span>
                          ) : (
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">FREE SHIPPING</span>
                          )}
                        </td>
                        <td className="p-4 text-[11px] text-stone-600 dark:text-stone-400">
                          <div>{coupon.minOrderSubtotal ? `Min: ৳${coupon.minOrderSubtotal}` : 'No min subtotal'}</div>
                          {coupon.maxDiscountAmount && <div>Max Cap: ৳{coupon.maxDiscountAmount}</div>}
                          {coupon.firstOrderOnly && <div className="text-amber-600 font-semibold">First Order Only</div>}
                        </td>
                        <td className="p-4 font-mono text-[11px]">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{coupon.usageCount || 0}</span>
                          <span className="text-stone-400"> / {coupon.usageLimitTotal ? coupon.usageLimitTotal : '∞'}</span>
                        </td>
                        <td className="p-4 text-[11px] text-stone-500 whitespace-nowrap">
                          <div>{new Date(coupon.startDate).toLocaleDateString()}</div>
                          <div className={isExp ? 'text-rose-500 font-semibold' : ''}>
                            to {new Date(coupon.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            coupon.status === 'ACTIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}>
                            {coupon.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(coupon)}
                              className={`p-1.5 rounded-lg border transition ${
                                isActive
                                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/40'
                                  : 'border-stone-200 text-stone-500 hover:bg-stone-100 dark:border-stone-800 dark:hover:bg-stone-800'
                              }`}
                              title={isActive ? 'Deactivate coupon' : 'Activate coupon'}
                            >
                              {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => openEditModal(coupon)}
                              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                              title="Edit coupon"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Delete coupon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCoupons.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        {isBn ? 'কোনো কুপন পাওয়া যায়নি' : 'No coupons found matching filters'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLASH DEALS */}
      {activeTab === 'FLASH_DEALS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  {isBn ? 'চলমান ও পরিকল্পিত ফ্ল্যাশ ডিল' : 'Flash Deals & Seasonal Campaigns'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isBn ? 'সময়সীমিত ডিসকাউন্ট ও নির্দিষ্ট পণ্য কোটা ভিত্তিক বিক্রয়' : 'Time-limited flash discounts with reserved product stock quotas.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {flashDeals.map(deal => (
                <div key={deal.id} className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                        {deal.badgeText || 'FLASH SALE'}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-1">
                        {isBn ? deal.titleBn || deal.title : deal.title}
                      </h4>
                      <p className="text-xs text-stone-500">{isBn ? deal.descriptionBn || deal.description : deal.description}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      deal.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {deal.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(deal.startDate).toLocaleDateString()} - {new Date(deal.endDate).toLocaleDateString()}</span>
                  </div>

                  <div className="border-t border-stone-200 dark:border-stone-700 pt-2 space-y-1.5">
                    <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                      {deal.items?.length || 0} {isBn ? 'পণ্য অন্তর্ভুক্ত' : 'Products in deal'}
                    </div>
                    {deal.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[200px]">{isBn ? item.productTitleBn || item.productTitle : item.productTitle}</span>
                        <div className="font-mono text-[11px]">
                          <span className="line-through text-stone-400 mr-1.5">৳{item.originalPrice}</span>
                          <span className="font-bold text-rose-600">৳{item.flashPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {flashDeals.length === 0 && (
                <div className="col-span-2 text-center p-8 text-stone-400 text-xs">
                  {isBn ? 'বর্তমানে কোনো ফ্ল্যাশ ডিল সক্রিয় নেই' : 'No active flash deals configured at present'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOYALTY */}
      {activeTab === 'LOYALTY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                {isBn ? 'গ্রাহক লয়্যালটি ও রিওয়ার্ড ওয়ালেট' : 'Customer Loyalty Wallets & Points'}
              </h3>
              <p className="text-xs text-stone-500">
                {isBn ? 'কেনাকাটায় অর্জিত রিওয়ার্ড পয়েন্ট এবং অডিট-যোগ্য অ্যাডমিন সমন্বয়' : 'Earned purchase rewards, tier levels and audited point adjustments.'}
              </p>
            </div>
            <button
              id="btn-adjust-points"
              onClick={() => setIsLoyaltyModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {isBn ? 'পয়েন্ট সমন্বয়' : 'Adjust Points'}
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-4">{isBn ? 'গ্রাহক ফোন' : 'Customer Phone'}</th>
                    <th className="p-4">{isBn ? 'নাম' : 'Name'}</th>
                    <th className="p-4">{isBn ? 'টায়ার' : 'Tier'}</th>
                    <th className="p-4">{isBn ? 'বর্তমান পয়েন্ট' : 'Points Balance'}</th>
                    <th className="p-4">{isBn ? 'টাকা সমমূল্য' : 'BDT Value'}</th>
                    <th className="p-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                  {wallets.map((wallet, idx) => (
                    <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-4 font-mono font-bold">{wallet.phone || 'N/A'}</td>
                      <td className="p-4 font-medium">{wallet.customerName || 'Customer'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          wallet.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          wallet.tier === 'GOLD' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          wallet.tier === 'SILVER' ? 'bg-slate-200 text-slate-700' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {wallet.tier || 'BRONZE'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-base font-bold text-amber-600">
                        {wallet.pointsBalance || 0} pts
                      </td>
                      <td className="p-4 font-mono text-stone-900 dark:text-stone-100">
                        ৳{Math.floor((wallet.pointsBalance || 0) * 0.5)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setLoyaltyForm(prev => ({ ...prev, phone: wallet.phone || '' }));
                            setIsLoyaltyModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
                        >
                          {isBn ? 'সমন্বয়' : 'Adjust'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {wallets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        {isBn ? 'কোনো লয়্যালটি ওয়ালেট নিবন্ধিত নেই' : 'No loyalty wallets found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHECKOUT SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-600" />
              {isBn ? 'চেকআউট কুপন ভ্যালিডেশন সিমুলেটর' : 'Real-time Checkout Coupon Validator Simulator'}
            </h3>
            <p className="text-xs text-stone-500">
              {isBn ? 'লাইভ চেকআউটে ঠিক যেভাবে কুপন যাচাই করা হয়, সেই একই সার্ভার লজিক দিয়ে তাৎক্ষণিক পরীক্ষা করুন' : 'Test any coupon code against arbitrary cart subtotals and customer accounts before public release.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {isBn ? 'কুপন কোড' : 'Coupon Code'}
                </label>
                <input
                  type="text"
                  value={simCode}
                  onChange={e => setSimCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {isBn ? 'কার্ট সাবটোটাল (৳)' : 'Cart Subtotal (BDT)'}
                  </label>
                  <input
                    type="number"
                    value={simSubtotal}
                    onChange={e => setSimSubtotal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {isBn ? 'ডেলিভারি ফি (৳)' : 'Shipping Fee (BDT)'}
                  </label>
                  <input
                    type="number"
                    value={simShipping}
                    onChange={e => setSimShipping(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {isBn ? 'গ্রাহকের ফোন নম্বর (ঐচ্ছিক)' : 'Customer Phone (Optional for 1st-order rule)'}
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={e => setSimPhone(e.target.value)}
                  placeholder="01711000000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <button
                id="btn-run-coupon-sim"
                onClick={runSimulator}
                disabled={simRunning}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${simRunning ? 'animate-spin' : ''}`} />
                {simRunning ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Validating...') : (isBn ? 'সিমুলেশন চালান' : 'Run Validation Check')}
              </button>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 p-5 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {isBn ? 'সার্ভার রেসপন্স আউটপুট' : 'Validation Result'}
              </h4>

              {simResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {simResult.valid ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VALID
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> INVALID
                      </span>
                    )}
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      {simResult.message || (simResult.valid ? 'Coupon applies successfully' : 'Validation rejected')}
                    </span>
                  </div>

                  {simResult.valid && (
                    <div className="space-y-1.5 text-xs border-t border-stone-200 dark:border-stone-700 pt-3">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Discount Amount:</span>
                        <span className="font-bold text-emerald-600 font-mono">-৳{simResult.discountAmount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">New Subtotal:</span>
                        <span className="font-mono">৳{simResult.newSubtotal || (simSubtotal - (simResult.discountAmount || 0))}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-stone-200 dark:border-stone-700 pt-1.5 text-stone-900 dark:text-stone-100">
                        <span>New Payable:</span>
                        <span className="font-mono text-sm">৳{simResult.newTotal || (simSubtotal - (simResult.discountAmount || 0) + simShipping)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  {isBn ? 'কুপন ভ্যালিডেশন ফলাফল দেখতে উপরের ফর্মটি পূরণ করে চালান' : 'Configure parameters on the left and run check to inspect live evaluation output.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {editingCoupon ? (isBn ? 'কুপন সম্পাদনা' : 'Edit Coupon Rule') : (isBn ? 'নতুন কুপন তৈরি' : 'Create New Coupon Rule')}
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={couponForm.code}
                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="E.g. EID20"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Discount Type *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as CouponDiscountType })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  >
                    <option value="PERCENTAGE">Percentage (% OFF)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (৳ FLAT)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Title (EN) *</label>
                  <input
                    type="text"
                    required
                    value={couponForm.title}
                    onChange={e => setCouponForm({ ...couponForm, title: e.target.value })}
                    placeholder="Eid Special 20%"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Title (BN)</label>
                  <input
                    type="text"
                    value={couponForm.titleBn}
                    onChange={e => setCouponForm({ ...couponForm, titleBn: e.target.value })}
                    placeholder="ঈদ স্পেশাল ২০%"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Cap (৳)</label>
                  <input
                    type="number"
                    value={couponForm.maxDiscountAmount}
                    onChange={e => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })}
                    placeholder="500"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Min Subtotal (৳)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderSubtotal}
                    onChange={e => setCouponForm({ ...couponForm, minOrderSubtotal: e.target.value })}
                    placeholder="1500"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={couponForm.startDate}
                    onChange={e => setCouponForm({ ...couponForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={couponForm.endDate}
                    onChange={e => setCouponForm({ ...couponForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    value={couponForm.usageLimitTotal}
                    onChange={e => setCouponForm({ ...couponForm, usageLimitTotal: e.target.value })}
                    placeholder="Unlimited if empty"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Per-Customer Limit</label>
                  <input
                    type="number"
                    value={couponForm.usageLimitPerCustomer}
                    onChange={e => setCouponForm({ ...couponForm, usageLimitPerCustomer: e.target.value })}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-first-order"
                  checked={couponForm.firstOrderOnly}
                  onChange={e => setCouponForm({ ...couponForm, firstOrderOnly: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="chk-first-order" className="font-semibold cursor-pointer">
                  First Order Only (New Customer Welcome Incentive)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold"
                >
                  {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST LOYALTY POINTS MODAL */}
      {isLoyaltyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {isBn ? 'লয়্যালটি পয়েন্ট সমন্বয়' : 'Adjust Loyalty Wallet'}
              </h3>
              <button
                onClick={() => setIsLoyaltyModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Customer Phone *</label>
                <input
                  type="text"
                  required
                  value={loyaltyForm.phone}
                  onChange={e => setLoyaltyForm({ ...loyaltyForm, phone: e.target.value })}
                  placeholder="01711000000"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Points (+ or -) *</label>
                  <input
                    type="number"
                    required
                    value={loyaltyForm.points}
                    onChange={e => setLoyaltyForm({ ...loyaltyForm, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 font-mono font-bold"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Use negative to deduct</p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Adjustment Reason *</label>
                  <select
                    value={loyaltyForm.type}
                    onChange={e => setLoyaltyForm({ ...loyaltyForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                  >
                    <option value="ADMIN_ADJUSTMENT">Admin Manual</option>
                    <option value="WELCOME_BONUS">Welcome Bonus</option>
                    <option value="REFERRAL_BONUS">Referral Incentive</option>
                    <option value="EXPIRY">Points Expiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Audit Note *</label>
                <textarea
                  required
                  rows={2}
                  value={loyaltyForm.note}
                  onChange={e => setLoyaltyForm({ ...loyaltyForm, note: e.target.value })}
                  placeholder="Reason for manual adjustment (audited in ledger)..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsLoyaltyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
