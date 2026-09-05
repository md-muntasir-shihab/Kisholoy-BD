import React, { useState, useEffect } from 'react';
import { 
  Tag, Percent, Gift, Zap, Users, Plus, Edit2, Trash2, 
  CheckCircle2, Clock, AlertCircle, Copy, Check, ArrowRight,
  Search, Filter, Calendar, Sparkles, Shield, DollarSign,
  TrendingUp, Award, ShoppingBag, Eye, RefreshCw, X, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminModalShell } from '../components/admin/AdminModalShell';
import { usePendingAction } from '../hooks/usePendingAction';
import { 
  CouponRule, FlashDeal, CustomerLoyaltyWallet, 
  CouponDiscountType, CouponStatus, LoyaltyTier 
} from '../types';

export function PromotionsAdmin() {
  const { products, categories, showToast, logAudit } = useApp();

  const [activeTab, setActiveTab] = useState<'COUPONS' | 'FLASH_DEALS' | 'LOYALTY' | 'SIMULATOR'>('COUPONS');

  // F-306: blocks duplicate submits while a mutation is in flight.

  const { run, isPending, isBusy } = usePendingAction();
  const [loading, setLoading] = useState(true);

  // Coupons State
  const [coupons, setCoupons] = useState<CouponRule[]>([]);
  const [couponFilter, setCouponFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRule | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Flash Deals State
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [showFlashModal, setShowFlashModal] = useState(false);

  // Loyalty Wallets State
  const [loyaltyWallets, setLoyaltyWallets] = useState<CustomerLoyaltyWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<CustomerLoyaltyWallet | null>(null);
  const [showAdjustPointsModal, setShowAdjustPointsModal] = useState(false);
  const [adjustPhone, setAdjustPhone] = useState('');
  const [adjustPoints, setAdjustPoints] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'ADMIN_ADJUSTMENT' | 'WELCOME_BONUS' | 'REFERRAL_BONUS'>('ADMIN_ADJUSTMENT');
  const [adjustNote, setAdjustNote] = useState('');

  // Simulator State
  const [simCode, setSimCode] = useState('KISHOLOY10');
  const [simSubtotal, setSimSubtotal] = useState<number>(3500);
  const [simShipping, setSimShipping] = useState<number>(80);
  const [simPhone, setSimPhone] = useState('+8801712345678');
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Coupon Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    titleBn: '',
    description: '',
    descriptionBn: '',
    discountType: 'PERCENTAGE' as CouponDiscountType,
    discountValue: 15,
    maxDiscountAmount: 500,
    minOrderSubtotal: 1500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    usageLimitTotal: 500,
    usageLimitPerCustomer: 1,
    categoryRestrictions: [] as string[],
    productRestrictions: [] as string[],
    firstOrderOnly: false,
    status: 'ACTIVE' as CouponStatus
  });

  // Fetch all promotion data
  const fetchPromotionData = async () => {
    try {
      setLoading(true);
      const [cpnRes, flashRes, loyaltyRes] = await Promise.all([
        fetch('/api/promotions/coupons'),
        fetch('/api/promotions/flash-deals'),
        fetch('/api/promotions/loyalty')
      ]);

      const [cpnData, flashData, loyaltyData] = await Promise.all([
        cpnRes.json(),
        flashRes.json(),
        loyaltyRes.json()
      ]);

      if (cpnData.success) setCoupons(cpnData.coupons || []);
      if (flashData.success) setFlashDeals(flashData.flashDeals || []);
      if (loyaltyData.success) setLoyaltyWallets(loyaltyData.wallets || []);
    } catch (err) {
      console.error('Failed to load promotions data:', err);
      showToast('Could not load promotions from the server — the list may be out of date.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionData();
  }, []);

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle coupon status
  const handleToggleStatus = async (coupon: CouponRule) =>  run('handleToggleStatus', async () => {
    const newStatus: CouponStatus = coupon.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/promotions/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, operator: 'PROMOTION_ADMIN' })
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: newStatus } : c));
        showToast(`Coupon "${coupon.code}" is now ${newStatus.toLowerCase()}.`);
      }
    } catch (e) {
      showToast('Failed to update coupon status.');
    }
    });

  // Delete coupon
  const handleDeleteCoupon = async (id: string, code: string) =>  run('handleDeleteCoupon', async () => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/promotions/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: 'PROMOTION_ADMIN' })
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.filter(c => c.id !== id));
        showToast(`Coupon "${code}" deleted successfully.`);
      }
    } catch (e) {
      showToast('Failed to delete coupon.');
    }
    });

  // Save Coupon (Create or Edit)
    const handleSaveCoupon = async (e: React.FormEvent) => {
    // Must fire synchronously. Inside run() it would land in a microtask and
    // the browser would submit the form and reload the page first.
    e.preventDefault();
    return run('handleSaveCoupon', async () => {
    try {
      if (editingCoupon) {
        // Update
        const res = await fetch(`/api/promotions/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            operator: 'PROMOTION_ADMIN'
          })
        });
        const data = await res.json();
        if (data.success) {
          setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? data.coupon : c));
          showToast(`Coupon "${formData.code}" updated successfully.`);
          setShowCouponModal(false);
          setEditingCoupon(null);
        } else {
          alert(data.error || 'Failed to update coupon');
        }
      } else {
        // Create
        const res = await fetch('/api/promotions/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            operator: 'PROMOTION_ADMIN'
          })
        });
        const data = await res.json();
        if (data.success) {
          setCoupons(prev => [data.coupon, ...prev]);
          showToast(`Coupon "${formData.code}" created successfully!`);
          setShowCouponModal(false);
        } else {
          alert(data.error || 'Failed to create coupon');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving coupon');
    }
    });
  };

  // Open Edit Modal
  const openEditModal = (coupon: CouponRule) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      titleBn: coupon.titleBn || '',
      description: coupon.description,
      descriptionBn: coupon.descriptionBn || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount || 500,
      minOrderSubtotal: coupon.minOrderSubtotal || 1500,
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
      usageLimitTotal: coupon.usageLimitTotal || 500,
      usageLimitPerCustomer: coupon.usageLimitPerCustomer || 1,
      categoryRestrictions: coupon.categoryRestrictions || [],
      productRestrictions: coupon.productRestrictions || [],
      firstOrderOnly: Boolean(coupon.firstOrderOnly),
      status: coupon.status
    });
    setShowCouponModal(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: `KSH${Math.floor(10 + Math.random() * 90)}`,
      title: '',
      titleBn: '',
      description: '',
      descriptionBn: '',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      maxDiscountAmount: 500,
      minOrderSubtotal: 1500,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      usageLimitTotal: 500,
      usageLimitPerCustomer: 1,
      categoryRestrictions: [],
      productRestrictions: [],
      firstOrderOnly: false,
      status: 'ACTIVE'
    });
    setShowCouponModal(true);
  };

  // Adjust Points Submit
    const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    // Must fire synchronously. Inside run() it would land in a microtask and
    // the browser would submit the form and reload the page first.
    e.preventDefault();
    return run('handleAdjustPointsSubmit', async () => {
    try {
      const res = await fetch('/api/promotions/loyalty/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: adjustPhone,
          points: Number(adjustPoints),
          type: adjustType,
          note: adjustNote,
          operator: 'PROMOTION_ADMIN'
        })
      });
      const data = await res.json();
      if (data.success) {
        setLoyaltyWallets(prev => prev.map(w => w.phone === adjustPhone ? data.wallet : w));
        if (selectedWallet && selectedWallet.phone === adjustPhone) {
          setSelectedWallet(data.wallet);
        }
        showToast(`Successfully adjusted ${adjustPoints} points for ${adjustPhone}.`);
        setShowAdjustPointsModal(false);
        setAdjustNote('');
      } else {
        alert(data.error || 'Failed to adjust loyalty points');
      }
    } catch (e: any) {
      alert(e.message || 'Error communicating with server');
    }
    });
  };

  // Run Simulator
  const runSimulator = async () => {
    try {
      setSimulating(true);
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: simCode,
          subtotal: Number(simSubtotal),
          shippingFee: Number(simShipping),
          customerPhone: simPhone,
          items: products.slice(0, 2).map(p => ({
            productId: p.id,
            quantity: 1,
            price: p.price
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data.evaluation);
      } else {
        setSimResult(null);
        showToast(data.error || 'Coupon simulation failed. Please try again.');
      }
    } catch (e) {
      // A blank result panel used to be the only sign of failure, which reads
      // as "this coupon is invalid" rather than "the check never ran" (F-305).
      setSimResult(null);
      showToast('Could not reach the promotions engine — simulation did not run.');
    } finally {
      setSimulating(false);
    }
  };

  // Computed Totals
  const totalDisbursed = coupons.reduce((acc, c) => acc + (c.totalDiscountDisbursedBdt || 0), 0);
  const totalRevenue = coupons.reduce((acc, c) => acc + (c.totalAttributedRevenueBdt || 0), 0);
  const activeCoupons = coupons.filter(c => c.status === 'ACTIVE').length;
  const totalPoints = loyaltyWallets.reduce((acc, w) => acc + (w.pointsBalance || 0), 0);

  const filteredCoupons = coupons.filter(c => {
    if (couponFilter !== 'ALL' && c.status !== couponFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.titleBn && c.titleBn.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              Phase 14: Growth Engine
            </span>
            <span className="text-xs text-stone-400">|</span>
            <span className="text-xs font-semibold text-stone-500">Promotions, Dynamic Coupons & Loyalty</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 mt-1">Promotions & Growth Desk</h1>
          <p className="text-xs text-stone-500">Manage campaign codes, midnight flash sales, customer loyalty wallet points, and tiered incentives.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPromotionData}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Active Coupons</span>
            <Tag className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-stone-900">{activeCoupons} / {coupons.length}</div>
          <p className="text-[11px] text-teal-700 mt-0.5 font-medium">Live discounts running</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Discounts Disbursed</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700">৳{totalDisbursed.toLocaleString()}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Authoritative financial total</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Attributed GMV</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-stone-900">৳{totalRevenue.toLocaleString()}</div>
          <p className="text-[11px] text-blue-700 mt-0.5 font-medium">Gross revenue generated</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Flash Sales</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-stone-900">{flashDeals.filter(f => f.status === 'ACTIVE').length} Active</div>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Timed clearance bazaar</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Loyalty Club</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-purple-900">{totalPoints.toLocaleString()} pts</div>
          <p className="text-[11px] text-purple-700 mt-0.5 font-medium">{loyaltyWallets.length} club members</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('COUPONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'COUPONS' 
              ? 'bg-teal-900 text-white shadow-xs' 
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Coupons & Promo Codes ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FLASH_DEALS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'FLASH_DEALS' 
              ? 'bg-teal-900 text-white shadow-xs' 
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Flash Deals & Midnight Sales ({flashDeals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LOYALTY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'LOYALTY' 
              ? 'bg-teal-900 text-white shadow-xs' 
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Customer Loyalty & Wallets ({loyaltyWallets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'SIMULATOR' 
              ? 'bg-teal-900 text-white shadow-xs' 
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Discount Simulator & Cart Auditor</span>
        </button>
      </div>

      {/* TAB 1: COUPONS DESK */}
      {activeTab === 'COUPONS' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search coupon code or campaign..."
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-teal-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {['ALL', 'ACTIVE', 'SCHEDULED', 'EXHAUSTED', 'DISABLED'].map(st => (
                <button
                  key={st}
                  onClick={() => setCouponFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    couponFilter === st
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Campaign & Discount</th>
                    <th className="p-4">Min Spend & Cap</th>
                    <th className="p-4">Usage Quota</th>
                    <th className="p-4">Validity Window</th>
                    <th className="p-4">Disbursed (৳)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        No coupon campaigns found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map(coupon => {
                      const usagePercent = coupon.usageLimitTotal 
                        ? Math.min(100, Math.round((coupon.usageCount / coupon.usageLimitTotal) * 100))
                        : 0;

                      return (
                        <tr key={coupon.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-stone-900 text-amber-300 font-mono font-bold rounded-md tracking-wider">
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => handleCopyCode(coupon.code)}
                                className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                                title="Copy code"
                              >
                                {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            {coupon.firstOrderOnly && (
                              <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                                1st Order Only
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-stone-900">{coupon.title}</div>
                            {coupon.titleBn && <div className="text-[11px] text-stone-500 font-bengali">{coupon.titleBn}</div>}
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                {coupon.discountType === 'PERCENTAGE' && `${coupon.discountValue}% OFF`}
                                {coupon.discountType === 'FIXED_AMOUNT' && `৳${coupon.discountValue} FLAT OFF`}
                                {coupon.discountType === 'FREE_SHIPPING' && 'FREE SHIPPING'}
                                {coupon.discountType === 'TIERED_BUNDLE' && 'BUNDLE SAVINGS'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-stone-900">
                              Min: ৳{(coupon.minOrderSubtotal || 0).toLocaleString()}
                            </div>
                            {coupon.maxDiscountAmount && (
                              <div className="text-[11px] text-stone-500">
                                Max Cap: ৳{coupon.maxDiscountAmount.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-bold text-stone-800">{coupon.usageCount}</span>
                              <span className="text-stone-400">/ {coupon.usageLimitTotal ? coupon.usageLimitTotal : '∞'}</span>
                            </div>
                            {coupon.usageLimitTotal && (
                              <div className="w-24 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${usagePercent > 80 ? 'bg-rose-600' : 'bg-teal-700'}`} 
                                  style={{ width: `${usagePercent}%` }} 
                                />
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-[11px]">
                            <div className="text-stone-700 font-medium">
                              From: {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('en-GB') : 'Immediate'}
                            </div>
                            <div className="text-stone-500">
                              To: {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('en-GB') : 'No expiry'}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-emerald-800">
                            ৳{(coupon.totalDiscountDisbursedBdt || 0).toLocaleString()}
                            <div className="text-[10px] text-stone-400 font-normal">
                              GMV: ৳{(coupon.totalAttributedRevenueBdt || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              coupon.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                              coupon.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                              coupon.status === 'EXHAUSTED' ? 'bg-amber-100 text-amber-800' :
                              coupon.status === 'EXPIRED' ? 'bg-rose-100 text-rose-800' :
                              'bg-stone-200 text-stone-700'
                            }`}>
                              {coupon.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleStatus(coupon)}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${
                                  coupon.status === 'ACTIVE' 
                                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' 
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                              >
                                {coupon.status === 'ACTIVE' ? 'Disable' : 'Activate'}
                              </button>
                              <button
                                onClick={() => openEditModal(coupon)}
                                className="p-1 text-stone-400 hover:text-stone-900 rounded hover:bg-stone-100"
                                title="Edit Coupon"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashDeals.map(deal => (
              <div key={deal.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="relative h-40 bg-stone-900">
                  <img 
                    src={deal.bannerImage} 
                    alt={deal.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-amber-400 text-stone-950 font-bold text-xs rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-stone-950" />
                        {deal.badgeText}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 rounded text-[10px] font-bold">
                        {deal.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-serif font-bold text-white">{deal.title}</h3>
                      <p className="text-xs text-stone-300 font-bengali">{deal.titleBn}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-xs text-stone-600">{deal.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Ends: {new Date(deal.endDate).toLocaleDateString('en-GB')}</span>
                    </div>
                    <span className="font-bold text-teal-900">{deal.items.length} Products on Deal</span>
                  </div>

                  {/* Deals Items List */}
                  <div className="space-y-2 pt-1">
                    {deal.items.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg text-xs">
                        <div className="flex-1">
                          <div className="font-semibold text-stone-900">{item.productTitle}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="line-through text-stone-400">৳{item.originalPrice}</span>
                            <span className="font-bold text-rose-700">৳{item.flashPrice}</span>
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                              -{item.discountPercent}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-stone-700">{item.soldStock} / {item.quotaStock} sold</span>
                          <div className="w-16 bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className="bg-amber-500 h-full" 
                              style={{ width: `${(item.soldStock / item.quotaStock) * 100}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOYALTY CLUB & WALLETS */}
      {activeTab === 'LOYALTY' && (
        <div className="space-y-4">
          {/* Loyalty Tiers Configuration Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { tier: 'BRONZE', color: 'border-amber-700/40 bg-amber-50/40', text: 'text-amber-900', multiplier: '1.0x', req: '0 - 249 pts' },
              { tier: 'SILVER', color: 'border-slate-300 bg-slate-50', text: 'text-slate-800', multiplier: '1.25x', req: '250 - 499 pts' },
              { tier: 'GOLD', color: 'border-yellow-400 bg-yellow-50/60', text: 'text-yellow-900', multiplier: '1.5x', req: '500 - 999 pts' },
              { tier: 'PLATINUM', color: 'border-purple-300 bg-purple-50', text: 'text-purple-900', multiplier: '2.0x', req: '1,000+ pts' }
            ].map(t => (
              <div key={t.tier} className={`p-4 rounded-xl border ${t.color}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${t.text}`}>{t.tier} TIER</span>
                  <Award className="w-4 h-4 text-stone-400" />
                </div>
                <div className="text-xl font-bold text-stone-900 mt-1">{t.multiplier} Points</div>
                <div className="text-[11px] text-stone-500 mt-0.5">{t.req}</div>
              </div>
            ))}
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Registered Customer Loyalty Wallets</h3>
                <p className="text-xs text-stone-500">Every 1 Point = ৳1 cash discount at checkout.</p>
              </div>
              <button
                onClick={() => {
                  setAdjustPhone('');
                  setAdjustPoints(100);
                  setAdjustNote('');
                  setShowAdjustPointsModal(true);
                }}
                className="px-3 py-1.5 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adjust Points</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Loyalty Tier</th>
                    <th className="p-4">Points Balance</th>
                    <th className="p-4">Lifetime Earned</th>
                    <th className="p-4">Referral Code</th>
                    <th className="p-4">Total Savings</th>
                    <th className="p-4 text-right">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loyaltyWallets.map(wallet => (
                    <tr key={wallet.customerId} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-stone-900">{wallet.customerName}</div>
                        <div className="text-stone-500 font-mono text-[11px]">{wallet.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          wallet.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                          wallet.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-900 border border-yellow-300' :
                          wallet.tier === 'SILVER' ? 'bg-slate-200 text-slate-800' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {wallet.tier}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-base font-bold text-teal-900">{wallet.pointsBalance}</span>
                        <span className="text-[10px] text-stone-400 ml-1">(৳{wallet.pointsBalance})</span>
                      </td>
                      <td className="p-4 font-semibold text-stone-800">
                        {wallet.lifetimeEarnedPoints} pts
                      </td>
                      <td className="p-4 font-mono font-bold text-stone-900">
                        {wallet.referralCode}
                        <div className="text-[10px] text-stone-400 font-sans">{wallet.referralCount} friends invited</div>
                      </td>
                      <td className="p-4 font-bold text-emerald-700">
                        ৳{wallet.totalWalletSavingsBdt.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedWallet(wallet)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px]"
                        >
                          History ({wallet.transactions?.length || 0})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIMULATOR & CART AUDITOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulator Controls */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Financial Promotion & Discount Simulator</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Test real-time calculation, eligibility constraints & financial impact before publishing campaigns.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Coupon Code to Test</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simCode}
                    onChange={e => setSimCode(e.target.value.toUpperCase())}
                    placeholder="e.g. KISHOLOY10, BOISHAKH20, FREESHIP"
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono uppercase focus:outline-none focus:border-teal-700"
                  />
                  <button
                    onClick={runSimulator}
                    disabled={simulating}
                    className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Simulate</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Cart Subtotal (৳)</label>
                  <input
                    type="number"
                    value={simSubtotal}
                    onChange={e => setSimSubtotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Shipping Fee (৳)</label>
                  <input
                    type="number"
                    value={simShipping}
                    onChange={e => setSimShipping(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Phone (For Fraud & Usage Limit Checks)</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={e => setSimPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[11px] font-semibold text-stone-400 uppercase">Quick Preload Test Codes:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {coupons.map(c => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setSimCode(c.code);
                      setSimSubtotal(c.minOrderSubtotal ? c.minOrderSubtotal + 500 : 2500);
                    }}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-mono font-semibold"
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulator Output */}
          <div className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Authoritative Engine Output</span>
                {simResult && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    simResult.valid ? 'bg-emerald-900 text-emerald-300 border border-emerald-700' : 'bg-rose-900 text-rose-300 border border-rose-700'
                  }`}>
                    {simResult.valid ? 'ELIGIBLE' : 'INELIGIBLE'}
                  </span>
                )}
              </div>

              {simResult ? (
                <div className="space-y-4 mt-4">
                  {simResult.valid ? (
                    <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Coupon Applied: {simResult.code}</span>
                      </div>
                      <p className="text-xs text-emerald-200">{simResult.description}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-950/60 border border-rose-800/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Rejection Reason</span>
                      </div>
                      <p className="text-xs text-rose-200">{simResult.errorReason}</p>
                    </div>
                  )}

                  {/* Financial Breakdown */}
                  <div className="bg-stone-800/60 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>Cart Subtotal:</span>
                      <span className="text-white font-mono">৳{simSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Shipping Fee:</span>
                      <span className="text-white font-mono">৳{simResult.adjustedShippingFee !== undefined ? simResult.adjustedShippingFee : simShipping}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Promotional Discount:</span>
                      <span className="font-mono">-৳{(simResult.discountAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-stone-700 pt-2 flex justify-between text-sm font-bold text-white">
                      <span>Net Payable:</span>
                      <span className="text-teal-300 font-mono">
                        ৳{Math.max(0, simSubtotal + (simResult.adjustedShippingFee !== undefined ? simResult.adjustedShippingFee : simShipping) - (simResult.discountAmount || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-stone-500 text-xs">
                  Click "Simulate" to execute authoritative server evaluation.
                </div>
              )}
            </div>

            <div className="text-[11px] text-stone-500 pt-4 border-t border-stone-800 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-teal-500" />
              <span>Financial Rule: Recalculated server-side. Client-supplied totals are strictly forbidden.</span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      <AdminModalShell
        open={!!showCouponModal}
        onClose={() => setShowCouponModal(false)}
        label="CREATE EDIT COUPON MODAL"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
      >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Campaign Coupon'}
                </h3>
                <p className="text-xs text-stone-500">Configure discount type, minimum purchase rules, and redemption quotas.</p>
              </div>
              <button
                onClick={() => setShowCouponModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Coupon Code (Uppercase)</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. EID2026, HERITAGE15"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono font-bold uppercase focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as CouponDiscountType })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700 font-semibold"
                  >
                    <option value="PERCENTAGE">Percentage (% Off)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (৳ Flat Off)</option>
                    <option value="FREE_SHIPPING">Free Nationwide Shipping</option>
                    <option value="TIERED_BUNDLE">Tiered Bundle Volume Discount</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Campaign Title (English)</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 15% Boishakh Festival Offer"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Campaign Title (বাংলা)</label>
                  <input
                    type="text"
                    value={formData.titleBn}
                    onChange={e => setFormData({ ...formData, titleBn: e.target.value })}
                    placeholder="e.g. ১৫% বৈশাখ উৎসব স্পেশাল অফার"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700 font-bengali"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {formData.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (৳)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Max Cap (৳ - Percentage only)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscountAmount}
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Min Order Subtotal (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderSubtotal}
                    onChange={e => setFormData({ ...formData, minOrderSubtotal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Total Usage Limit (Quota)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimitTotal}
                    onChange={e => setFormData({ ...formData, usageLimitTotal: Number(e.target.value) })}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Max Uses Per Customer</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimitPerCustomer}
                    onChange={e => setFormData({ ...formData, usageLimitPerCustomer: Number(e.target.value) })}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              {/* Safeguards & First Order Checkbox */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">First-Time Customer Only</div>
                  <div className="text-[11px] text-stone-500">Restricts usage strictly to customer's very first order.</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.firstOrderOnly}
                  onChange={e => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                  className="w-4 h-4 accent-teal-800 rounded"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl font-bold shadow-xs transition-all"
                >
                  {editingCoupon ? 'Save Changes' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>

      {/* LOYALTY POINTS ADJUSTMENT MODAL */}
      <AdminModalShell
        open={!!showAdjustPointsModal}
        onClose={() => setShowAdjustPointsModal(false)}
        label="LOYALTY POINTS ADJUSTMENT MODAL"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
      >
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">Adjust Customer Loyalty Points</h3>
                <p className="text-xs text-stone-500">Manual administrative balance modification with audit trail.</p>
              </div>
              <button
                onClick={() => setShowAdjustPointsModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Customer Phone Number</label>
                <input
                  type="text"
                  required
                  value={adjustPhone}
                  onChange={e => setAdjustPhone(e.target.value)}
                  placeholder="+8801712345678"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Points Delta (+ or -)</label>
                  <input
                    type="number"
                    required
                    value={adjustPoints}
                    onChange={e => setAdjustPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-bold focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                  >
                    <option value="ADMIN_ADJUSTMENT">Admin Correction</option>
                    <option value="WELCOME_BONUS">Welcome Gift</option>
                    <option value="REFERRAL_BONUS">Referral Incentive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Reason / Note for Audit Log</label>
                <textarea
                  required
                  rows={2}
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="e.g. VIP goodwill bonus for delayed parcel delivery"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustPointsModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl font-bold shadow-xs transition-all"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>

      {/* WALLET HISTORY DRAWER */}
      <AdminModalShell
        open={!!selectedWallet}
        onClose={() => setSelectedWallet(null)}
        label="WALLET HISTORY DRAWER"
        overlayClassName="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
      >
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  {selectedWallet.customerName} - Loyalty Ledger
                </h3>
                <p className="text-xs text-stone-500 font-mono">{selectedWallet.phone} | Tier: {selectedWallet.tier}</p>
              </div>
              <button
                onClick={() => setSelectedWallet(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                <div className="text-[10px] text-teal-700 uppercase font-bold">Current Balance</div>
                <div className="text-lg font-bold text-teal-950 mt-0.5">{selectedWallet.pointsBalance} pts</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-[10px] text-emerald-700 uppercase font-bold">Lifetime Earned</div>
                <div className="text-lg font-bold text-emerald-950 mt-0.5">{selectedWallet.lifetimeEarnedPoints} pts</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="text-[10px] text-purple-700 uppercase font-bold">Total Saved</div>
                <div className="text-lg font-bold text-purple-950 mt-0.5">৳{selectedWallet.totalWalletSavingsBdt}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Transaction Ledger</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedWallet.transactions?.map(tx => (
                  <div key={tx.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900">{tx.note}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-2">
                        <span>{new Date(tx.timestamp).toLocaleString('en-GB')}</span>
                        {tx.orderNumber && <span className="text-stone-600 font-mono">Order: {tx.orderNumber}</span>}
                      </div>
                    </div>
                    <div className={`font-bold font-mono text-sm ${tx.points >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {tx.points >= 0 ? `+${tx.points}` : tx.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedWallet(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                Close Ledger
              </button>
            </div>
          </div>
      </AdminModalShell>
    </div>
  );
}
