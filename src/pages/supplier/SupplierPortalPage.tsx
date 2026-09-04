import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, DollarSign, Package, ShoppingBag, CreditCard, ShieldCheck, 
  FileText, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  AlertCircle, Lock, LogOut, Download, Printer, RefreshCw, Globe, ChevronRight, 
  HelpCircle, Search, Filter, Phone, Mail, MapPin, Eye, Check, X, ShieldAlert,
  Clock, Award, BarChart3, PieChart, Info, UserCheck, Key, Edit3, Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  Supplier, 
  SupplierAgreement, 
  SupplyBatch, 
  SupplierEligibleSale, 
  SupplierSettlement, 
  SupplierPurchaseOrder, 
  SupplierPayment,
  SupplierStatement
} from '../../types';
import { BrandLogo } from '../../components/brand/BrandLogo';

export function SupplierPortalPage() {
  const navigate = useNavigate();
  const { language, setLanguage, showToast } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'agreements' | 'batches' | 'pos' | 'sales' | 'settlements' | 'statement' | 'profile'
  >('overview');

  // Supplier auth and state
  const [supplierUser, setSupplierUser] = useState<Supplier | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Statement date range filter
  const [statementRange, setStatementRange] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'BOISHAKH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statementData, setStatementData] = useState<any>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  // Selected PO for Invoice view
  const [selectedPo, setSelectedPo] = useState<SupplierPurchaseOrder | null>(null);

  // Selected Settlement for Detail view
  const [selectedSettlement, setSelectedSettlement] = useState<SupplierSettlement | null>(null);

  // Profile update request modal / state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [updateContactPerson, setUpdateContactPerson] = useState('');
  const [updatePhone, setUpdatePhone] = useState('');
  const [updateAddress, setUpdateAddress] = useState('');
  const [updateBankName, setUpdateBankName] = useState('');
  const [updateAccountName, setUpdateAccountName] = useState('');
  const [updateAccountNumber, setUpdateAccountNumber] = useState('');
  const [updateBranchName, setUpdateBranchName] = useState('');
  const [updateRouting, setUpdateRouting] = useState('');
  const [updateBkash, setUpdateBkash] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Search & Filter within tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const formatPrice = (amount?: number | null) => {
    const val = Number(amount) || 0;
    return `৳ ${val.toLocaleString('en-US')}`;
  };

  const notify = (msg: string) => {
    if (typeof showToast === 'function') {
      showToast(msg);
    }
  };

  // Stale/expired portal session (server restart, password change, revocation) → back to login
  useEffect(() => {
    const onAuthExpired = (e: Event) => {
      const path = ((e as CustomEvent).detail || {}).path || '';
      if (typeof path === 'string' && path.startsWith('/api/suppliers/portal')) {
        localStorage.removeItem('ksh_supplier_token');
        localStorage.removeItem('ksh_supplier_user');
        navigate('/supplier/login');
      }
    };
    window.addEventListener('kisholoy-auth-expired', onAuthExpired);
    return () => window.removeEventListener('kisholoy-auth-expired', onAuthExpired);
  }, [navigate]);

  // Check auth and load dashboard
  useEffect(() => {
    const token = localStorage.getItem('ksh_supplier_token');
    const storedUser = localStorage.getItem('ksh_supplier_user');

    if (!token || !storedUser) {
      navigate('/supplier/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setSupplierUser(parsed);
      loadDashboard(parsed.id);
    } catch (e) {
      navigate('/supplier/login');
    }
  }, [navigate]);

  const loadDashboard = async (supplierId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/suppliers/portal/dashboard?supplierId=${encodeURIComponent(supplierId)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load supplier dashboard.');
      }

      setDashboardData(data);
      if (data.supplier) {
        setSupplierUser(data.supplier);
        // Pre-fill profile update fields
        setUpdateContactPerson(data.supplier.contactPerson || '');
        setUpdatePhone(data.supplier.phone || '');
        setUpdateAddress(data.supplier.address || '');
        setUpdateBankName(data.supplier.bankDetails?.bankName || '');
        setUpdateAccountName(data.supplier.bankDetails?.accountName || '');
        setUpdateAccountNumber(data.supplier.bankDetails?.accountNumber || '');
        setUpdateBranchName(data.supplier.bankDetails?.branchName || '');
        setUpdateRouting(data.supplier.bankDetails?.routingNumber || '');
        setUpdateBkash(data.supplier.mfsDetails?.accountNumber || '');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to supplier portal service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (supplierUser?.id) {
      setRefreshing(true);
      loadDashboard(supplierUser.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ksh_supplier_token');
    localStorage.removeItem('ksh_supplier_user');
    notify(language === 'BN' ? 'সাপ্লায়ার পোর্টাল থেকে লগআউট করা হয়েছে' : 'Logged out from Supplier Portal');
    navigate('/supplier/login');
  };

  // Load formal statement
  const loadStatement = async (start?: string, end?: string) => {
    if (!supplierUser?.id) return;
    setStatementLoading(true);
    try {
      let url = `/api/suppliers/${supplierUser.id}/statement`;
      const params = new URLSearchParams();
      if (start) params.append('periodStart', start);
      if (end) params.append('periodEnd', end);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStatementData(data.statement);
      }
    } catch (err) {
      console.error('Failed to load statement:', err);
    } finally {
      setStatementLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'statement') {
      let start = '';
      let end = '';
      const now = new Date();

      if (statementRange === 'THIS_MONTH') {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        end = now.toISOString();
      } else if (statementRange === 'LAST_MONTH') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
      } else if (statementRange === 'BOISHAKH') {
        start = '2026-01-01T00:00:00.000Z';
        end = '2026-04-30T23:59:59.000Z';
      } else if (statementRange === 'CUSTOM' && customStartDate) {
        start = new Date(customStartDate).toISOString();
        end = customEndDate ? new Date(customEndDate).toISOString() : now.toISOString();
      }

      loadStatement(start || undefined, end || undefined);
    }
  }, [activeTab, statementRange, customStartDate, customEndDate, supplierUser?.id]);

  // Handle Profile Update Submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierUser?.id) return;
    setUpdatingProfile(true);

    try {
      const updates: any = {
        contactPerson: updateContactPerson,
        phone: updatePhone,
        address: updateAddress,
        bankDetails: {
          bankName: updateBankName,
          accountName: updateAccountName,
          accountNumber: updateAccountNumber,
          branchName: updateBranchName,
          routingNumber: updateRouting
        },
        mfsDetails: {
          provider: 'BKASH',
          accountType: 'MERCHANT',
          accountNumber: updateBkash
        }
      };

      const res = await fetch('/api/suppliers/portal/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplierUser.id,
          updates,
          operator: supplierUser.contactPerson || supplierUser.companyName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      notify(language === 'BN' ? 'প্রোফাইল এবং ব্যাংকিং তথ্য সফলভাবে সংরক্ষিত হয়েছে।' : 'Profile & banking details updated successfully.');
      setProfileModalOpen(false);
      loadDashboard(supplierUser.id);
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierUser?.id) return;

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      notify(language === 'BN'
        ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের এবং অক্ষর+সংখ্যা সম্বলিত হতে হবে।'
        : 'Password must be at least 8 characters and contain letters and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      notify(language === 'BN' ? 'পাসওয়ার্ড দুটি মেলেনি।' : 'Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/suppliers/portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password');
      }

      notify(language === 'BN'
        ? 'পাসওয়ার্ড পরিবর্তিত — নিরাপত্তার জন্য সব সেশন বন্ধ, আবার লগইন করুন।'
        : 'Password changed. All sessions were terminated — please sign in again.');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // The server revoked every portal session (including this one) after the change.
      localStorage.removeItem('ksh_supplier_token');
      localStorage.removeItem('ksh_supplier_user');
      setTimeout(() => navigate('/supplier/login'), 900);
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    } finally {
      setChangingPassword(false);
    }
  };

  const metrics = dashboardData?.metrics || {
    totalSuppliedBdt: supplierUser?.totalPurchased || 0,
    totalSoldUnits: 0,
    totalRemainingUnits: 0,
    grossSalesValue: 0,
    supplierEarnings: 0,
    totalDisbursed: supplierUser?.totalPaid || 0,
    netOutstandingDue: supplierUser?.totalDue || 0,
    activeAgreementsCount: 0,
    batchesCount: 0,
    openPosCount: 0,
    pendingSettlementsCount: 0
  };

  const agreements: SupplierAgreement[] = dashboardData?.agreements || [];
  const batches: SupplyBatch[] = dashboardData?.batches || [];
  const purchaseOrders: SupplierPurchaseOrder[] = dashboardData?.purchaseOrders || [];
  const eligibleSales: SupplierEligibleSale[] = dashboardData?.eligibleSales || [];
  const settlements: SupplierSettlement[] = dashboardData?.settlements || [];
  const payments: SupplierPayment[] = dashboardData?.payments || [];
  const monthlyTrends = dashboardData?.monthlyTrends || [];

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white">
            {language === 'BN' ? 'সাপ্লায়ার পোর্টাল লোড হচ্ছে...' : 'Loading Supplier Portal...'}
          </h2>
          <p className="text-xs text-stone-400">Verifying isolated vendor session & financial ledgers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo variant="dark" size="sm" />
          </Link>

          <div className="h-5 w-px bg-stone-800"></div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {supplierUser?.companyName || 'Supplier Portal'}
                </h1>
                <span className="text-[10px] font-mono bg-stone-800 text-amber-400 border border-stone-700 px-1.5 py-0.2 rounded">
                  {supplierUser?.code}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 hidden sm:flex items-center gap-2">
                <span>{supplierUser?.contactPerson}</span>
                <span>&bull;</span>
                <span>{supplierUser?.district}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Isolation Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-800/60 text-[10px] text-amber-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Isolated Vendor Boundary</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh Data"
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors border border-stone-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-300 transition-colors border border-stone-700"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'EN' ? 'বাংলা' : 'English'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/70 text-rose-300 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'BN' ? 'লগআউট' : 'Sign Out'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={handleRefresh} className="underline text-rose-300 hover:text-white font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Top Financial Stat Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Total Supplied Value */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span>{language === 'BN' ? 'মোট সাপ্লাইকৃত মূল্য' : 'Total Supplied Value'}</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {formatPrice(metrics.totalSuppliedBdt)}
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-2 pt-2 border-t border-stone-800/60 font-mono">
              <span className="text-blue-400 font-semibold">{metrics.totalRemainingUnits} in stock</span>
              <span>&bull;</span>
              <span>{metrics.totalSoldUnits} sold</span>
            </div>
          </div>

          {/* Card 2: Supplier Revenue / Earnings */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span>{language === 'BN' ? 'অর্জিত রেভিনিউ শেয়ার' : 'Supplier Earnings'}</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">
              {formatPrice(metrics.supplierEarnings || metrics.grossSalesValue)}
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-2 pt-2 border-t border-stone-800/60">
              <span className="text-emerald-400 font-semibold">{agreements[0]?.settlementMethod || 'ACTIVE'}</span>
              <span>formula applied</span>
            </div>
          </div>

          {/* Card 3: Total Paid Out */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span>{language === 'BN' ? 'পরিশোধিত পেআউট' : 'Total Paid Out'}</span>
              <CreditCard className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-teal-400">
              {formatPrice(metrics.totalDisbursed)}
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-2 pt-2 border-t border-stone-800/60">
              <span>{payments.length} disbursed vouchers</span>
            </div>
          </div>

          {/* Card 4: Net Outstanding Due */}
          <div className="bg-stone-900/80 border border-amber-900/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-stone-900 to-amber-950/30">
            <div className="flex items-center justify-between text-amber-300 text-xs mb-1 font-medium">
              <span>{language === 'BN' ? 'বর্তমান বকেয়া পাওনা' : 'Net Outstanding Due'}</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400">
              {formatPrice(metrics.netOutstandingDue)}
            </div>
            <div className="text-[11px] text-amber-200/80 flex items-center gap-1.5 mt-2 pt-2 border-t border-amber-900/50">
              <span>{metrics.pendingSettlementsCount || (metrics.netOutstandingDue > 0 ? 1 : 0)} pending settlement cycle(s)</span>
            </div>
          </div>

        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-stone-800 scrollbar-none text-xs font-semibold">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{language === 'BN' ? 'ওভারভিউ ও রেভিনিউ' : 'Overview & Revenue'}</span>
          </button>

          <button
            onClick={() => setActiveTab('agreements')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'agreements'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{language === 'BN' ? 'চুক্তি ও শর্তাবলী' : 'Commercial Agreements'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300 font-mono">
              {agreements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'batches'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{language === 'BN' ? 'সাপ্লাই ব্যাচ ও স্টক' : 'Supply Batches'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300 font-mono">
              {batches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'BN' ? 'পারচেজ অর্ডার (POs)' : 'Purchase Orders'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300 font-mono">
              {purchaseOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{language === 'BN' ? 'বিক্রি ও শেয়ার' : 'Sales & Earnings'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300 font-mono">
              {eligibleSales.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settlements'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'BN' ? 'সেটেলমেন্ট ও ভাউচার' : 'Settlements & Payouts'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300 font-mono">
              {settlements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('statement')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'statement'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'BN' ? 'অফিসিয়াল স্টেটমেন্ট' : 'Official Statement'}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'BN' ? 'প্রোফাইল ও ব্যাংকিং' : 'Profile & Bank Info'}</span>
          </button>

        </div>

        {/* TAB 1: OVERVIEW & REVENUE ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Agreement & Settlement Quick Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Active Agreement Snapshot */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    {language === 'BN' ? 'বর্তমান বাণিজ্যিক চুক্তি' : 'Active Commercial Agreement'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                    ACTIVE
                  </span>
                </div>

                {agreements.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Settlement Method:</span>
                      <strong className="text-amber-400 font-mono text-sm">
                        {agreements[0].settlementMethod}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1 text-[11px]">
                      <div className="text-stone-300 font-semibold">Terms & Ratio:</div>
                      {agreements[0].percentage && (
                        <div className="text-emerald-400">
                          &bull; Supplier Share: <strong>{agreements[0].percentage}%</strong> of Net Retail Selling Price
                        </div>
                      )}
                      {agreements[0].supplierCost && (
                        <div className="text-stone-300">
                          &bull; Agreed Unit Cost: <strong>৳{agreements[0].supplierCost.toLocaleString()}</strong>
                        </div>
                      )}
                      {agreements[0].fixedAmount && (
                        <div className="text-teal-400">
                          &bull; Fixed Remuneration: <strong>৳{agreements[0].fixedAmount.toLocaleString()}</strong> per delivered unit
                        </div>
                      )}
                    </div>

                    <p className="text-stone-400 text-[11px] leading-relaxed italic">
                      "{agreements[0].notes || 'Standard artisanal supply agreement with Kisholoy.'}"
                    </p>

                    <div className="pt-2 border-t border-stone-800 flex justify-between text-[11px] text-stone-500 font-mono">
                      <span>Effective: {new Date(agreements[0].effectiveFrom).toLocaleDateString()}</span>
                      <button onClick={() => setActiveTab('agreements')} className="text-amber-400 hover:underline">
                        View All ({agreements.length}) &rarr;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-stone-500">
                    No active commercial agreements recorded.
                  </div>
                )}
              </div>

              {/* Monthly Trajectory */}
              <div className="lg:col-span-2 bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    {language === 'BN' ? 'মাসিক রেভিনিউ ও ডিসবার্সমেন্ট ট্র্যাকিং' : 'Monthly Financial Progression'}
                  </h3>
                  <span className="text-xs text-stone-400 font-mono">
                    {monthlyTrends.length} Active Month(s)
                  </span>
                </div>

                {monthlyTrends.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {monthlyTrends.map((trend: any) => (
                        <div key={trend.monthKey} className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-amber-300 font-mono">{trend.monthKey}</span>
                            <span className="text-stone-400">
                              Earnings: <strong className="text-emerald-400">{formatPrice(trend.earnings || trend.sales)}</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-stone-800/60">
                            <div>
                              <span className="text-stone-400">Disbursed (Paid):</span>{' '}
                              <strong className="text-teal-400">{formatPrice(trend.paid)}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-stone-400">Sales Turnover:</span>{' '}
                              <strong className="text-white">{formatPrice(trend.sales)}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-stone-500 space-y-2">
                    <BarChart3 className="w-8 h-8 text-stone-700 mx-auto" />
                    <p>Financial progression will chart as your supplied batches are sold and delivered.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Recent Batches & Recent Sales Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Supply Batches */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    {language === 'BN' ? 'সাম্প্রতিক সাপ্লাই ব্যাচ' : 'Active Supply Batches'}
                  </h3>
                  <button onClick={() => setActiveTab('batches')} className="text-xs text-amber-400 hover:underline">
                    View All &rarr;
                  </button>
                </div>

                <div className="space-y-2.5">
                  {batches.slice(0, 3).map((b) => (
                    <div key={b.id} className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{b.batchNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 font-mono">
                            Cost: ৳{b.supplierCost}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-1">
                          Received: {b.quantityReceived} units &bull; Sold: <span className="text-emerald-400 font-semibold">{b.quantitySold}</span> &bull; Stock: <span className="text-blue-400 font-semibold">{b.quantityRemaining}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                          {b.status}
                        </span>
                        <div className="text-[10px] text-stone-500 font-mono mt-1">
                          {new Date(b.receivedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Delivered Sales */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {language === 'BN' ? 'ডেলিভার্ড অর্ডার থেকে প্রাপ্ত আয়' : 'Recent Delivered Order Earnings'}
                  </h3>
                  <button onClick={() => setActiveTab('sales')} className="text-xs text-amber-400 hover:underline">
                    View All &rarr;
                  </button>
                </div>

                <div className="space-y-2.5">
                  {eligibleSales.slice(0, 3).map((s) => (
                    <div key={s.id} className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white font-mono">
                          Order #{s.orderNumber || s.orderId}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {s.quantity} unit(s) &bull; Net Sale: ৳{s.netEligibleAmount?.toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-emerald-400 text-sm">
                          +৳{s.supplierShare?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {s.status === 'INCLUDED_IN_SETTLEMENT' ? 'Settled' : 'Pending Cycle'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: COMMERCIAL AGREEMENTS */}
        {activeTab === 'agreements' && (
          <div className="space-y-4">
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    {language === 'BN' ? 'বাণিজ্যিক চুক্তি ও নিষ্পত্তি পদ্ধতি' : 'Commercial Agreements & Settlement Rules'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Legally binding commercial rules governing price calculations, commission retention, and payment terms.
                  </p>
                </div>
                <div className="text-xs font-mono bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl text-amber-400">
                  Total Agreements: {agreements.length}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {agreements.map((agr) => (
                  <div key={agr.id} className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <h4 className="font-bold text-sm text-white font-mono">{agr.settlementMethod}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                          {agr.status}
                        </span>
                      </div>

                      <div className="text-xs text-stone-400 font-mono">
                        Effective: {new Date(agr.effectiveFrom).toLocaleDateString()}
                        {agr.effectiveTo ? ` — ${new Date(agr.effectiveTo).toLocaleDateString()}` : ' (Indefinite / Ongoing)'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                        <span className="text-stone-400 text-[11px] block">Calculation Basis:</span>
                        <strong className="text-white font-mono mt-0.5 block">{agr.calculationBasis || 'NET_SELLING_PRICE'}</strong>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                        <span className="text-stone-400 text-[11px] block">Supplier Share / Cost:</span>
                        <strong className="text-emerald-400 font-mono mt-0.5 block">
                          {agr.percentage ? `${agr.percentage}% of Sale` : agr.fixedAmount ? `৳${agr.fixedAmount} / Unit` : `৳${agr.supplierCost}`}
                        </strong>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                        <span className="text-stone-400 text-[11px] block">Kisholoy Platform Margin:</span>
                        <strong className="text-amber-400 font-mono mt-0.5 block">
                          {agr.percentage ? `${100 - agr.percentage}%` : 'Net Remainder'}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs text-stone-300 space-y-1">
                      <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <span>Agreement Clauses & Terms:</span>
                      </div>
                      <p className="text-stone-400 text-[11px] leading-relaxed">
                        {agr.notes || 'Master standard procurement agreement. Payments disbursed strictly according to delivered orders.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPLY BATCHES & STOCK LEDGER */}
        {activeTab === 'batches' && (
          <div className="space-y-4">
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    {language === 'BN' ? 'সাপ্লাই ব্যাচ ও স্টক রেজিস্টার' : 'Supply Batches & Warehouse Stock Ledger'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Real-time inventory levels, received quantities, units sold to customers, and current warehouse stock.
                  </p>
                </div>
                <div className="text-xs font-mono bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl text-blue-400">
                  {batches.length} Registered Batches
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Batch Number</th>
                      <th className="py-3 px-4">Received Date</th>
                      <th className="py-3 px-4">Received Qty</th>
                      <th className="py-3 px-4">Sold Qty</th>
                      <th className="py-3 px-4">Remaining Stock</th>
                      <th className="py-3 px-4">Supplier Cost</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-medium">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {b.batchNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-400">
                          {new Date(b.receivedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {b.quantityReceived} units
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {b.quantitySold} units
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-400">
                          {b.quantityRemaining} units
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-300">
                          ৳{b.supplierCost?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            b.status === 'ACTIVE' 
                              ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                              : 'bg-stone-800 border-stone-700 text-stone-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PURCHASE ORDERS (POs) */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    {language === 'BN' ? 'পারচেজ অর্ডার ও ডেলিভারি তালিকা' : 'Official Purchase Orders & Procurement Records'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Formal procurement purchase orders issued by Kisholoy procurement management.
                  </p>
                </div>
                <div className="text-xs font-mono bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl text-amber-400">
                  {purchaseOrders.length} Purchase Orders
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {purchaseOrders.map((po) => (
                  <div key={po.id} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-white font-mono">{po.poNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          po.deliveryStatus === 'RECEIVED'
                            ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                            : 'bg-amber-950 border-amber-800 text-amber-300'
                        }`}>
                          {po.deliveryStatus}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          po.paymentStatus === 'PAID'
                            ? 'bg-teal-950 border-teal-800 text-teal-300'
                            : 'bg-stone-800 border-stone-700 text-stone-400'
                        }`}>
                          Payment: {po.paymentStatus}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-400 mt-2 space-y-0.5">
                        <div>
                          Items: {po.items?.map(i => `${i.productTitle} (${i.quantity} pcs)`).join(', ') || 'Custom goods'}
                        </div>
                        <div className="text-stone-500 font-mono">
                          Ordered: {new Date(po.orderDate).toLocaleDateString()} &bull; Expected: {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-800">
                      <div className="text-sm font-bold text-white font-mono">
                        ৳{po.totalAmount?.toLocaleString()}
                      </div>
                      <button
                        onClick={() => setSelectedPo(po)}
                        className="mt-1 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Invoice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DELIVERED SALES & EARNINGS */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    {language === 'BN' ? 'ডেলিভার্ড সেলস ও রেভিনিউ হিসাব' : 'Delivered Retail Sales & Supplier Earnings Snapshot'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Order-by-order transparent earnings generated from customers who received goods successfully.
                  </p>
                </div>
                <div className="text-xs font-mono bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl text-emerald-400">
                  {eligibleSales.length} Eligible Sales Records
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order Number</th>
                      <th className="py-3 px-4">Sale Date</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Gross Net Amount</th>
                      <th className="py-3 px-4">Calculation Rule</th>
                      <th className="py-3 px-4">Supplier Share</th>
                      <th className="py-3 px-4">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-medium">
                    {eligibleSales.map((s) => (
                      <tr key={s.id} className="hover:bg-stone-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          #{s.orderNumber || s.orderId}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-400">
                          {new Date(s.saleDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {s.quantity} pcs
                        </td>
                        <td className="py-3.5 px-4 font-mono text-white font-semibold">
                          ৳{s.netEligibleAmount?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-stone-400 max-w-xs truncate" title={s.calculationRuleSnapshot}>
                          {s.calculationRuleSnapshot || s.settlementMethodSnapshot}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono text-sm">
                          +৳{s.supplierShare?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            s.status === 'INCLUDED_IN_SETTLEMENT'
                              ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                              : 'bg-amber-950 border-amber-800 text-amber-300'
                          }`}>
                            {s.status === 'INCLUDED_IN_SETTLEMENT' ? 'SETTLED' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTLEMENTS & PAYOUTS */}
        {activeTab === 'settlements' && (
          <div className="space-y-6">
            
            {/* Settlements Table */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-400" />
                    {language === 'BN' ? 'সেটেলমেন্ট স্টেটমেন্ট ও বিলিং হিস্ট্রি' : 'Settlement Cycles & Balances'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Formal settlement periods consolidating sales revenue, return adjustments, and disbursements.
                  </p>
                </div>
                <div className="text-xs font-mono bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl text-teal-400">
                  {settlements.length} Settlement Cycles
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {settlements.map((sett) => (
                  <div key={sett.id} className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-white font-mono">{sett.settlementNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          sett.status === 'PAID'
                            ? 'bg-teal-950 border-teal-800 text-teal-300'
                            : sett.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-950 border-amber-800 text-amber-300'
                            : 'bg-stone-800 border-stone-700 text-stone-400'
                        }`}>
                          {sett.status}
                        </span>
                      </div>

                      <div className="text-xs text-stone-400 font-mono">
                        Period: {new Date(sett.periodStart).toLocaleDateString()} — {new Date(sett.periodEnd).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-400 text-[11px] block">Gross Sales Value:</span>
                        <strong className="text-white font-mono mt-0.5 block">৳{sett.grossSales?.toLocaleString()}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-400 text-[11px] block">Supplier Net Share:</span>
                        <strong className="text-emerald-400 font-mono mt-0.5 block">৳{sett.supplierShare?.toLocaleString()}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-400 text-[11px] block">Disbursed (Paid):</span>
                        <strong className="text-teal-400 font-mono mt-0.5 block">৳{sett.paymentsAlreadyMade?.toLocaleString() || 0}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-amber-900/40">
                        <span className="text-amber-300 text-[11px] block">Remaining Due:</span>
                        <strong className="text-amber-400 font-mono mt-0.5 block">৳{sett.remainingDue?.toLocaleString() || 0}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Disbursements Vouchers */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    {language === 'BN' ? 'ব্যাংক ও bKash পেমেন্ট ভাউচার হিস্ট্রি' : 'Disbursement Vouchers & Proof of Payment'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Verified electronic bank transfer TxIDs, cheque numbers, and bKash merchant transaction references.
                  </p>
                </div>
                <div className="text-xs font-mono bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl text-emerald-400">
                  {payments.length} Payment Vouchers
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 font-mono text-sm">৳{p.amount?.toLocaleString()}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                          {p.paymentMethod}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          Ref: <strong className="text-white">{p.referenceNumber}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        {p.notes || 'Settlement payout disbursement'} &bull; Recorded by: {p.recordedBy}
                      </div>
                    </div>

                    <div className="text-right text-stone-500 font-mono text-[11px]">
                      {new Date(p.paymentDate).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 7: OFFICIAL STATEMENT GENERATOR */}
        {activeTab === 'statement' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-stone-400 font-semibold mr-1">Statement Period:</span>
                
                <button
                  onClick={() => setStatementRange('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    statementRange === 'ALL'
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  All-Time
                </button>

                <button
                  onClick={() => setStatementRange('THIS_MONTH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    statementRange === 'THIS_MONTH'
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  This Month
                </button>

                <button
                  onClick={() => setStatementRange('LAST_MONTH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    statementRange === 'LAST_MONTH'
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  Last Month
                </button>

                <button
                  onClick={() => setStatementRange('BOISHAKH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    statementRange === 'BOISHAKH'
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  Boishakh Season '26
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-stone-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'BN' ? 'প্রিন্ট স্টেটমেন্ট' : 'Print Statement'}</span>
                </button>
              </div>
            </div>

            {/* Formal Printable Statement Sheet */}
            <div className="bg-white text-stone-900 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8 border border-stone-200 printable-statement">
              
              {/* Statement Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-stone-200 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <BrandLogo variant="light" size="md" />
                    <span className="text-xs font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                      Procurement & Sourcing Hub
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-2 space-y-0.5">
                    <div>Kisholoy Lifestyle Ltd.</div>
                    <div>Tejgaon Industrial Area, Dhaka-1208, Bangladesh</div>
                    <div>procurement@kisholoy.com &bull; +880 1800-KISHOLOY</div>
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-block">
                    Official Supplier Statement
                  </span>
                  <div className="text-lg font-bold font-mono text-stone-900 mt-1">
                    {statementData?.statementNumber || `STMT-${supplierUser?.code}-2026`}
                  </div>
                  <div className="text-xs text-stone-500">
                    Generated: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Supplier & Period Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50 p-5 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block">Supplier Information:</span>
                  <div className="text-sm font-bold text-stone-900 mt-0.5">{supplierUser?.companyName}</div>
                  <div className="text-stone-600 font-mono mt-0.5">Code: {supplierUser?.code}</div>
                  <div className="text-stone-600 mt-0.5">{supplierUser?.contactPerson} ({supplierUser?.phone})</div>
                  <div className="text-stone-600">{supplierUser?.address}, {supplierUser?.district}</div>
                </div>

                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block">Bank & Tax Details:</span>
                  <div className="text-stone-800 font-semibold mt-0.5">
                    {supplierUser?.bankDetails?.bankName || 'BRAC Bank PLC'}
                  </div>
                  <div className="text-stone-600 font-mono mt-0.5">
                    A/C: {supplierUser?.bankDetails?.accountNumber || 'N/A'} ({supplierUser?.bankDetails?.accountName})
                  </div>
                  <div className="text-stone-600 font-mono mt-0.5">
                    Routing: {supplierUser?.bankDetails?.routingNumber || 'N/A'} &bull; Branch: {supplierUser?.bankDetails?.branchName || 'N/A'}
                  </div>
                  <div className="text-stone-600 text-[11px] mt-0.5">
                    TIN: {supplierUser?.tinNumber || 'N/A'} &bull; Trade License: {supplierUser?.tradeLicenseNumber || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Statement Financial Balance Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Supplied Value</span>
                  <span className="text-base sm:text-lg font-bold text-stone-900 font-mono block mt-1">
                    ৳{metrics.totalSuppliedBdt?.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Supplier Earnings</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-700 font-mono block mt-1">
                    ৳{(metrics.supplierEarnings || metrics.grossSalesValue)?.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-teal-800 block">Total Disbursed (Paid)</span>
                  <span className="text-base sm:text-lg font-bold text-teal-700 font-mono block mt-1">
                    ৳{metrics.totalDisbursed?.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Outstanding Balance Due</span>
                  <span className="text-base sm:text-lg font-bold text-amber-900 font-mono block mt-1">
                    ৳{metrics.netOutstandingDue?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Batches Breakdown in Statement */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2">
                  1. Sourced Batches & Warehouse Inventory Status
                </h4>
                <table className="w-full text-left text-xs text-stone-700 border border-stone-200">
                  <thead className="bg-stone-100 font-semibold border-b border-stone-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Received Date</th>
                      <th className="py-2.5 px-3">Received Qty</th>
                      <th className="py-2.5 px-3">Sold Qty</th>
                      <th className="py-2.5 px-3">Stock Remaining</th>
                      <th className="py-2.5 px-3">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {batches.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2 px-3 font-mono font-bold">{b.batchNumber}</td>
                        <td className="py-2 px-3">{new Date(b.receivedDate).toLocaleDateString()}</td>
                        <td className="py-2 px-3">{b.quantityReceived}</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">{b.quantitySold}</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{b.quantityRemaining}</td>
                        <td className="py-2 px-3 font-mono">৳{b.supplierCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Settlement Disbursements in Statement */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2">
                  2. Settlement History & Payout Disbursed Vouchers
                </h4>
                <table className="w-full text-left text-xs text-stone-700 border border-stone-200">
                  <thead className="bg-stone-100 font-semibold border-b border-stone-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reference / TxID</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount (BDT)</th>
                      <th className="py-2.5 px-3">Disbursed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="py-2 px-3 font-mono font-bold">{p.referenceNumber}</td>
                        <td className="py-2 px-3">{p.paymentMethod}</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700">৳{p.amount?.toLocaleString()}</td>
                        <td className="py-2 px-3 text-stone-500">{p.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures & Certification */}
              <div className="pt-10 border-t border-stone-200 grid grid-cols-2 gap-8 text-xs text-stone-500">
                <div>
                  <div className="h-10 border-b border-stone-300 w-48 mb-1"></div>
                  <div>Authorized Signatory</div>
                  <div className="text-[10px] text-stone-400 font-semibold">Kisholoy Finance & Procurement Lead</div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="h-10 border-b border-stone-300 w-48 mb-1"></div>
                  <div>Acknowledged by Supplier</div>
                  <div className="text-[10px] text-stone-400 font-semibold">{supplierUser?.contactPerson}</div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 8: PROFILE & BANKING */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Organization & Tax Profile */}
              <div className="lg:col-span-6 bg-stone-900/80 border border-stone-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    {language === 'BN' ? 'সংগঠন ও প্রাতিষ্ঠানিক তথ্য' : 'Vendor Organization Profile'}
                  </h3>
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Info</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-stone-400 text-[11px] block">Company Name:</span>
                      <strong className="text-white block mt-0.5">{supplierUser?.companyName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Supplier Code:</span>
                      <strong className="text-amber-400 font-mono block mt-0.5">{supplierUser?.code}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-stone-400 text-[11px] block">Contact Person:</span>
                      <span className="text-stone-200 block mt-0.5">{supplierUser?.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Primary Phone:</span>
                      <span className="text-stone-200 font-mono block mt-0.5">{supplierUser?.phone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Login Email:</span>
                    <span className="text-stone-200 font-mono block mt-0.5">{supplierUser?.portalAccess?.loginEmail || supplierUser?.email}</span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Business Address:</span>
                    <span className="text-stone-200 block mt-0.5">{supplierUser?.address}, {supplierUser?.district}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
                    <div>
                      <span className="text-stone-400 text-[11px] block">TIN Number:</span>
                      <span className="text-stone-300 font-mono block mt-0.5">{supplierUser?.tinNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Trade License:</span>
                      <span className="text-stone-300 font-mono block mt-0.5">{supplierUser?.tradeLicenseNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Bank & MFS Payout Destination */}
              <div className="lg:col-span-6 bg-stone-900/80 border border-stone-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    {language === 'BN' ? 'নিবন্ধিত ব্যাংক ও পেআউট হিসাব' : 'Registered Bank & Payout Destination'}
                  </h3>
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change Bank</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Primary Bank Account</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-stone-300">
                    <div>Bank: <strong className="text-white">{supplierUser?.bankDetails?.bankName || 'Islami Bank Bangladesh PLC'}</strong></div>
                    <div>A/C Name: <strong className="text-white">{supplierUser?.bankDetails?.accountName || supplierUser?.companyName}</strong></div>
                    <div>A/C Number: <strong className="text-amber-300">{supplierUser?.bankDetails?.accountNumber || '2050148020054321'}</strong></div>
                    <div>Branch: <span>{supplierUser?.bankDetails?.branchName || 'Sonargaon Branch'}</span></div>
                    <div>Routing: <span>{supplierUser?.bankDetails?.routingNumber || '125272145'}</span></div>
                  </div>
                </div>

                {/* MFS Account */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-pink-400 font-bold uppercase tracking-wider text-[11px]">bKash / Nagad Merchant Account</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                      Secondary
                    </span>
                  </div>
                  <div className="font-mono text-stone-300">
                    Wallet: <strong className="text-white">{supplierUser?.mfsDetails?.accountNumber || supplierUser?.phone}</strong> ({supplierUser?.mfsDetails?.provider || 'BKASH'} {supplierUser?.mfsDetails?.accountType || 'MERCHANT'})
                  </div>
                </div>

                {/* Password & Security trigger */}
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-xs text-stone-400">Access Security & Passwords:</span>
                  <button
                    onClick={() => setPasswordModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold border border-stone-700 transition-colors flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{language === 'BN' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* PO Invoice Modal */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  <span>Purchase Order Invoice: {selectedPo.poNumber}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Ordered on {new Date(selectedPo.orderDate).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelectedPo(null)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-500 font-bold block">Delivery Status:</span>
                  <span className="font-bold text-amber-800">{selectedPo.deliveryStatus}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-bold block">Payment Status:</span>
                  <span className="font-bold text-teal-800">{selectedPo.paymentStatus}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-stone-200">
                <thead className="bg-stone-100 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Unit Cost</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {selectedPo.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{item.productTitle}</td>
                      <td className="p-2.5">{item.quantity}</td>
                      <td className="p-2.5 font-mono">৳{item.unitCost}</td>
                      <td className="p-2.5 font-mono font-bold text-right">৳{item.subtotal?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center text-sm font-bold border-t border-stone-200 pt-3">
                <span>Total Procurement Amount:</span>
                <span className="font-mono text-emerald-800">৳{selectedPo.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setSelectedPo(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Update Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-stone-900 text-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border border-stone-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>{language === 'BN' ? 'প্রোফাইল ও ব্যাংকিং তথ্য হালনাগাদ' : 'Update Profile & Bank Information'}</span>
              </h3>
              <button onClick={() => setProfileModalOpen(false)} className="p-1 text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Contact Person Name</label>
                <input
                  type="text"
                  value={updateContactPerson}
                  onChange={(e) => setUpdateContactPerson(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={updatePhone}
                    onChange={(e) => setUpdatePhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">bKash Merchant</label>
                  <input
                    type="text"
                    value={updateBkash}
                    onChange={(e) => setUpdateBkash(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Business Address</label>
                <input
                  type="text"
                  value={updateAddress}
                  onChange={(e) => setUpdateAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium"
                />
              </div>

              <div className="pt-2 border-t border-stone-800 space-y-2">
                <span className="text-amber-400 font-bold block text-[11px]">Official Bank Account for Disbursements:</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={updateBankName}
                      onChange={(e) => setUpdateBankName(e.target.value)}
                      placeholder="e.g. BRAC Bank PLC"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={updateAccountName}
                      onChange={(e) => setUpdateAccountName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={updateAccountNumber}
                      onChange={(e) => setUpdateAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={updateBranchName}
                      onChange={(e) => setUpdateBranchName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Routing Number</label>
                  <input
                    type="text"
                    value={updateRouting}
                    onChange={(e) => setUpdateRouting(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{updatingProfile ? 'Saving...' : 'Save Updates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-stone-900 text-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>{language === 'BN' ? 'পোর্টাল পাসওয়ার্ড পরিবর্তন' : 'Change Portal Password'}</span>
              </h3>
              <button onClick={() => setPasswordModalOpen(false)} className="p-1 text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">{language === 'BN' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">{language === 'BN' ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর, অক্ষর+সংখ্যা)' : 'New Password (Min. 8 chars, letters + numbers)'}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
