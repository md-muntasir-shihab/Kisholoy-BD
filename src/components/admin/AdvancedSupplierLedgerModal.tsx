import React, { useState, useMemo } from 'react';
import { 
  X, Printer, Download, Package, Receipt, CreditCard, TrendingUp, 
  TrendingDown, Building2, Phone, Mail, MapPin, Calendar, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, ArrowDownLeft, FileText, Plus, 
  ExternalLink, Layers, Search, ChevronDown, ChevronRight, Filter, 
  ShieldCheck, Copy, Check, Warehouse, Boxes, RefreshCw, Eye
} from 'lucide-react';
import { 
  Supplier, 
  SupplierPurchaseOrder, 
  SupplierPayment, 
  SupplierInteraction, 
  SourcedProductSummary, 
  SupplierLedgerEntry, 
  SupplierFinancialSummary,
  SupplierDetailResponse
} from '../../types';
import { SupplierFinancialTrendChart } from './SupplierFinancialTrendChart';
import { useModalA11y } from '../../hooks/useModalA11y';

interface AdvancedSupplierLedgerModalProps {
  supplier: Supplier;
  detail: SupplierDetailResponse | null;
  loading?: boolean;
  onClose: () => void;
  onMarkPoReceived: (supplierId: string, poId: string) => void;
  onDisbursePayment: (supplier: Supplier, suggestedAmount?: number) => void;
  onIssuePo: (supplier: Supplier) => void;
  onRefresh?: () => void;
}

export const AdvancedSupplierLedgerModal: React.FC<AdvancedSupplierLedgerModalProps> = ({
  supplier,
  detail,
  loading = false,
  onClose,
  onMarkPoReceived,
  onDisbursePayment,
  onIssuePo,
  onRefresh
}) => {
  // F-307: this modal is mounted only while open (the parent conditionally
  // renders it), so the dialog is always "open" from the hook's perspective.
  const { containerRef, dialogProps } = useModalA11y({
    open: true,
    onClose,
    label: 'Supplier ledger',
  });

  const [activeTab, setActiveTab] = useState<'products' | 'statement' | 'trends' | 'pos' | 'payments' | 'profile'>('products');
  const [showStatementTrendChart, setShowStatementTrendChart] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [statementFilter, setStatementFilter] = useState<'ALL' | 'PURCHASE_ORDER' | 'PAYMENT_VOUCHER'>('ALL');
  const [statementSearch, setStatementSearch] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(detail?.purchaseOrders?.[0]?.id || null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount).replace('BDT', '৳');
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const financialSummary = detail?.financialSummary || {
    totalPurchased: supplier.totalPurchased || 0,
    totalPaid: supplier.totalPaid || 0,
    totalDue: supplier.totalDue || 0,
    totalOrdersCount: 0,
    paymentFulfillmentRatio: supplier.totalPurchased ? Math.round(((supplier.totalPaid || 0) / supplier.totalPurchased) * 100) : 100,
    lastPaymentDate: undefined,
    recentPurchasesTotal: 0
  };
  const sourcedProducts = detail?.sourcedProducts || [];
  const ledgerStatement = detail?.ledgerStatement || [];
  const purchaseOrders = detail?.purchaseOrders || [];
  const payments = detail?.payments || [];
  const interactions = detail?.interactions || [];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return sourcedProducts;
    const q = productSearch.toLowerCase().trim();
    return sourcedProducts.filter(p => 
      p.productTitle.toLowerCase().includes(q) ||
      (p.productTitleBn && p.productTitleBn.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [sourcedProducts, productSearch]);

  // Filtered Ledger Statement Entries
  const filteredStatement = useMemo(() => {
    return ledgerStatement.filter(entry => {
      const matchesType = statementFilter === 'ALL' || entry.type === statementFilter;
      const matchesSearch = !statementSearch.trim() || 
        entry.referenceNumber.toLowerCase().includes(statementSearch.toLowerCase()) ||
        entry.description.toLowerCase().includes(statementSearch.toLowerCase()) ||
        (entry.descriptionBn && entry.descriptionBn.toLowerCase().includes(statementSearch.toLowerCase())) ||
        (entry.itemsSummary && entry.itemsSummary.toLowerCase().includes(statementSearch.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [ledgerStatement, statementFilter, statementSearch]);

  // Export Ledger as CSV
  const handleExportCsv = () => {
    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit (Paid BDT)', 'Credit (Billed BDT)', 'Running Balance (Due BDT)', 'Status', 'Operator'];
    const rows = ledgerStatement.map(e => [
      new Date(e.date).toLocaleDateString('en-GB'),
      e.type,
      `"${e.referenceNumber}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.runningBalance,
      e.status,
      `"${e.operator || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KISHOLOY_Ledger_${supplier.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div ref={containerRef} {...dialogProps} id="advanced-supplier-ledger-modal" className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-6xl h-[92vh] sm:h-auto sm:max-h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        
        {/* ========================================================================= */}
        {/* Modal Top Header with Quick Actions */}
        {/* ========================================================================= */}
        <div className="bg-stone-900 text-white p-3.5 sm:p-6 border-b border-stone-800 flex-shrink-0">
          <div className="flex flex-col gap-3">
            {/* Top row: Badges and Close button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {supplier.code}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase ${
                  supplier.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-stone-700 text-stone-300 border border-stone-600'
                }`}>
                  {supplier.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700">
                  {supplier.paymentTerms}
                </span>
                {supplier.district && (
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-stone-400">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{supplier.district}</span>
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Middle row: Supplier Title & Contact Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-bold font-serif text-white tracking-tight">
                    {supplier.companyName}
                  </h2>
                  <span className="text-xs sm:text-sm text-stone-400 font-medium">
                    {supplier.contactPerson}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                  {supplier.phone && (
                    <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 text-emerald-400 hover:underline">
                      <Phone className="w-3 h-3" />
                      <span>{supplier.phone}</span>
                    </a>
                  )}
                  {supplier.email && (
                    <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 text-sky-400 hover:underline">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[170px] sm:max-w-none">{supplier.email}</span>
                    </a>
                  )}
                  {supplier.taxIdentificationNumber && (
                    <span className="font-mono text-[10px] sm:text-[11px] text-stone-400">
                      TIN: {supplier.taxIdentificationNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    title="রিফ্রেশ করুন"
                    className="p-1.5 sm:p-2 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors flex items-center gap-1 border border-stone-700"
                  title="প্রিন্ট ভাউচার / খতিয়ান"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-300" />
                  <span className="hidden sm:inline">প্রিন্ট খতিয়ান</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors flex items-center gap-1 border border-stone-700"
                  title="ডাউনলোড CSV লেজার"
                >
                  <Download className="w-3.5 h-3.5 text-stone-300" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  onClick={() => onDisbursePayment(supplier, financialSummary.totalDue)}
                  className="px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>পরিশোধ</span>
                </button>
                <button
                  onClick={() => onIssuePo(supplier)}
                  className="px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg transition-colors shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন PO</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Executive KPI Summary Ribbon */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-800/80">
            {/* 1. Total Sourced */}
            <div className="bg-stone-800/60 p-2.5 sm:p-3.5 rounded-xl border border-stone-700/60">
              <div className="flex items-center justify-between text-stone-400 text-[10px] sm:text-xs">
                <span>মোট ক্রয় / বিল</span>
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
              </div>
              <div className="text-sm sm:text-xl font-bold font-mono text-white mt-0.5">
                {formatPrice(financialSummary.totalPurchased)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 flex items-center justify-between">
                <span>{financialSummary.totalOrdersCount}টি ক্রয়াদেশ</span>
                <button 
                  onClick={() => setActiveTab('trends')}
                  className="text-[10px] text-amber-300 hover:text-white underline font-semibold flex items-center gap-0.5 transition-colors"
                >
                  <span>ট্রেন্ড</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* 2. Total Paid */}
            <div className="bg-stone-800/60 p-2.5 sm:p-3.5 rounded-xl border border-stone-700/60">
              <div className="flex items-center justify-between text-stone-400 text-[10px] sm:text-xs">
                <span>পরিশোধিত অর্থ</span>
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {formatPrice(financialSummary.totalPaid)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 flex items-center justify-between">
                <span>{financialSummary.paymentFulfillmentRatio}% ক্লিয়ার</span>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="text-[10px] text-emerald-400 hover:text-white underline font-semibold flex items-center gap-0.5 transition-colors"
                >
                  <span>ভাউচার</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* 3. Outstanding Due Balance */}
            <div className={`p-2.5 sm:p-3.5 rounded-xl border ${
              financialSummary.totalDue > 0 
                ? 'bg-amber-950/40 border-amber-500/40' 
                : 'bg-stone-800/60 border-stone-700/60'
            }`}>
              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className={financialSummary.totalDue > 0 ? 'text-amber-300 font-medium' : 'text-stone-400'}>
                  বর্তমান বকেয়া
                </span>
                <AlertCircle className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${financialSummary.totalDue > 0 ? 'text-amber-400' : 'text-stone-500'}`} />
              </div>
              <div className={`text-sm sm:text-xl font-bold font-mono mt-0.5 ${
                financialSummary.totalDue > 0 ? 'text-amber-300' : 'text-emerald-400'
              }`}>
                {formatPrice(financialSummary.totalDue)}
              </div>
              <div className="text-[10px] sm:text-[11px] mt-0.5 flex items-center justify-between">
                <span className={financialSummary.totalDue > 0 ? 'text-amber-400/80' : 'text-stone-400'}>
                  {financialSummary.totalDue > 0 ? 'বকেয়া আছে' : 'ক্লিয়ার'}
                </span>
                {financialSummary.totalDue > 0 && (
                  <button 
                    onClick={() => onDisbursePayment(supplier, financialSummary.totalDue)}
                    className="text-[10px] text-amber-200 underline hover:text-white font-medium"
                  >
                    পরিশোধ →
                  </button>
                )}
              </div>
            </div>

            {/* 4. Procured SKUs & Live Stock */}
            <div className="bg-stone-800/60 p-2.5 sm:p-3.5 rounded-xl border border-stone-700/60">
              <div className="flex items-center justify-between text-stone-400 text-[10px] sm:text-xs">
                <span>পণ্য ও স্টক</span>
                <Boxes className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
              </div>
              <div className="text-sm sm:text-xl font-bold font-mono text-white mt-0.5">
                {sourcedProducts.length} <span className="text-xs font-normal text-stone-400">SKUs</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 flex items-center justify-between">
                <span>লাইভ স্টক</span>
                <span className="font-semibold text-sky-400">
                  {sourcedProducts.reduce((sum, p) => sum + p.currentStock, 0)} পিস
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Navigation Tabs */}
        {/* ========================================================================= */}
        <div className="flex items-center border-b border-stone-200 bg-stone-50 px-2 sm:px-6 gap-1 sm:gap-2 overflow-x-auto flex-shrink-0 scrollbar-none py-1 sm:py-0">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 sm:py-3 px-2.5 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap rounded-t-lg sm:rounded-none ${
              activeTab === 'products'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs sm:shadow-none'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-stone-600" />
            <span>পণ্য ও স্টক ({sourcedProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('statement')}
            className={`py-2 sm:py-3 px-2.5 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap rounded-t-lg sm:rounded-none ${
              activeTab === 'statement'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs sm:shadow-none'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-stone-600" />
            <span>খতিয়ান / স্টেটমেন্ট ({ledgerStatement.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`py-2 sm:py-3 px-2.5 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap rounded-t-lg sm:rounded-none ${
              activeTab === 'trends'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs sm:shadow-none'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>ট্রেন্ড গ্রাফ</span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`py-2 sm:py-3 px-2.5 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap rounded-t-lg sm:rounded-none ${
              activeTab === 'pos'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs sm:shadow-none'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            <span>ক্রয়াদেশ ({purchaseOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 sm:py-3 px-2.5 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap rounded-t-lg sm:rounded-none ${
              activeTab === 'payments'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs sm:shadow-none'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-stone-600" />
            <span>পেমেন্ট ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 sm:py-3 px-2.5 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap rounded-t-lg sm:rounded-none ${
              activeTab === 'profile'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs sm:shadow-none'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-stone-600" />
            <span>প্রোফাইল ও ব্যাংক</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* Modal Scrollable Body */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {loading && !detail ? (
            <div className="py-16 text-center space-y-3 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 m-2">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <div className="text-sm font-bold text-stone-800">
                সাপ্লায়ারের বিস্তারিত খতিয়ান ও লেনদেন লোড হচ্ছে...
              </div>
              <div className="text-xs text-stone-500">
                Loading live balance ledger, purchase orders, and sourced products...
              </div>
            </div>
          ) : (
            <>
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>এই ভেন্ডর থেকে সংগৃহীত পণ্য ও বর্তমান ওয়্যারহাউস ইনভেন্টরি</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                      {sourcedProducts.length} আইটেম
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    মোট কতগুলো পণ্য নেওয়া হয়েছে, কত ব্যয় হয়েছে, বর্তমানে কতগুলো ওয়্যারহাউসে অবিক্রিত আছে এবং গ্রস মার্জিন।
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="পণ্য বা SKU দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 border border-dashed border-stone-200 rounded-xl space-y-2">
                  <Package className="w-8 h-8 text-stone-400 mx-auto" />
                  <div className="text-sm font-semibold text-stone-700">কোন পণ্য পাওয়া যায়নি</div>
                  <p className="text-xs text-stone-400">এই ভেন্ডরের নামে এখনো কোন পণ্য ক্রয়াদেশ চালান এন্ট্রি হয়নি।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((prod, idx) => {
                    const soldUnits = Math.max(0, prod.totalQuantityReceived - prod.currentStock);
                    const sellThroughPct = prod.totalQuantityReceived > 0 
                      ? Math.min(100, Math.round((soldUnits / prod.totalQuantityReceived) * 100))
                      : 0;

                    return (
                      <div key={idx} className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 hover:shadow-xs transition-all space-y-3.5">
                        <div className="flex gap-3.5">
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=300'}
                            alt={prod.productTitle}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover bg-stone-100 flex-shrink-0 border border-stone-200"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                {prod.sku}
                              </span>
                              <span className="text-[10px] font-semibold text-stone-500">
                                {prod.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                prod.stockStatus === 'IN_STOCK'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : prod.stockStatus === 'LOW_STOCK'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {prod.stockStatus === 'IN_STOCK' ? 'ইন স্টক' : prod.stockStatus === 'LOW_STOCK' ? 'সীমিত স্টক' : 'স্টক শেষ'}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-stone-900 mt-1 line-clamp-1">
                              {prod.productTitle}
                            </h4>
                            {prod.productTitleBn && (
                              <div className="text-xs text-stone-500 font-medium line-clamp-1">
                                {prod.productTitleBn}
                              </div>
                            )}

                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="text-xs text-stone-500">গড় ক্রয়মূল্য:</span>
                              <span className="text-sm font-bold font-mono text-stone-900">
                                {formatPrice(prod.averageUnitCost)}
                              </span>
                              {prod.retailPrice > 0 && (
                                <span className="text-[11px] text-stone-400 font-mono">
                                  (বিক্রয়: {formatPrice(prod.retailPrice)})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Metric Highlights Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg text-center border border-stone-100">
                          <div>
                            <div className="text-[10px] text-stone-500 uppercase tracking-wider">মোট সংগ্রহ</div>
                            <div className="text-xs sm:text-sm font-bold font-mono text-stone-900 mt-0.5">
                              {prod.totalQuantityOrdered} <span className="text-[10px] font-normal text-stone-500">পিস</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-stone-500 uppercase tracking-wider">বর্তমান স্টক</div>
                            <div className={`text-xs sm:text-sm font-bold font-mono mt-0.5 ${
                              prod.currentStock > 10 ? 'text-emerald-700' : prod.currentStock > 0 ? 'text-amber-700' : 'text-rose-700'
                            }`}>
                              {prod.currentStock} <span className="text-[10px] font-normal text-stone-500">পিস</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-stone-500 uppercase tracking-wider">মোট ক্রয় ব্যয়</div>
                            <div className="text-xs sm:text-sm font-bold font-mono text-stone-900 mt-0.5">
                              {formatPrice(prod.totalSpend)}
                            </div>
                          </div>
                        </div>

                        {/* Stock Liquidation & Sell-Through Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>বিক্রয় অগ্রগতি: {soldUnits} পিস বিক্রি হয়েছে</span>
                            <span className="font-semibold text-stone-700">{sellThroughPct}% বিক্রিত</span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${sellThroughPct}%` }}
                            />
                          </div>
                        </div>

                        {/* PO References & Quick Action */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-stone-400">চালান:</span>
                            {prod.poNumbers.map((poNum, pIdx) => (
                              <button
                                key={pIdx}
                                onClick={() => {
                                  setActiveTab('pos');
                                  const target = purchaseOrders.find(o => o.poNumber === poNum);
                                  if (target) setExpandedPoId(target.id);
                                }}
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-colors"
                              >
                                {poNum}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => onIssuePo(supplier)}
                            className="text-[11px] text-stone-700 font-bold hover:text-stone-950 flex items-center gap-1"
                          >
                            <span>পুনরায় অর্ডার</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 2: CHRONOLOGICAL DOUBLE-ENTRY RUNNING STATEMENT */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'statement' && (
            <div className="space-y-4">
              {/* Embedded 12-Month Financial Performance Trend Chart */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">
                        ১২ মাসের ক্রয় বনাম পরিশোধের ট্রেন্ড গ্রাফ (Purchased vs Paid Trend)
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        লেজার স্টেটমেন্টের সাথে গত ১২ মাসের আর্থিক লেনদেন ও পরিশোধের গতিপ্রকৃতি।
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('trends')}
                      className="text-xs text-amber-800 hover:text-amber-950 font-bold px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                    >
                      পূর্ণাঙ্গ চার্ট ভিউ ↗
                    </button>
                    <button
                      onClick={() => setShowStatementTrendChart(!showStatementTrendChart)}
                      className="text-xs text-stone-600 hover:text-stone-900 font-semibold px-2.5 py-1 bg-white border border-stone-200 rounded-lg shadow-2xs hover:bg-stone-50 transition-colors"
                    >
                      {showStatementTrendChart ? 'চার্ট সংকুচিত করুন' : 'চার্ট প্রসারিত করুন'}
                    </button>
                  </div>
                </div>
                {showStatementTrendChart && (
                  <div className="mt-4">
                    <SupplierFinancialTrendChart
                      trends={detail?.monthlyTrends || detail?.financialSummary?.monthlyTrends}
                      purchaseOrders={purchaseOrders}
                      payments={payments}
                      supplierName={supplier.companyName}
                      supplierCode={supplier.code}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50 p-3 sm:p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                    সার্বিক হিসাব খতিয়ান ও রানিং ব্যালেন্স হিস্ট্রি (Statement of Account)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    প্রতিটি ক্রয়াদেশের চালান (ক্রেডিট) এবং ব্যাংকিং/ক্যাশ পেমেন্ট (ডেবিট) সহ হিসাব জের।
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statementFilter}
                    onChange={(e: any) => setStatementFilter(e.target.value)}
                    className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none flex-shrink-0"
                  >
                    <option value="ALL">সকল লেনদেন</option>
                    <option value="PURCHASE_ORDER">চালান (বিল)</option>
                    <option value="PAYMENT_VOUCHER">পেমেন্ট ভাউচার</option>
                  </select>

                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={statementSearch}
                      onChange={(e) => setStatementSearch(e.target.value)}
                      placeholder="রেফারেন্স খুঁজুন..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Card List for Statement (visible on sm/xs screens) */}
              <div className="block md:hidden space-y-2.5">
                {filteredStatement.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-xs">
                    কোন লেনদেন পাওয়া যায়নি।
                  </div>
                ) : (
                  filteredStatement.map((entry, idx) => {
                    const isPo = entry.type === 'PURCHASE_ORDER';
                    return (
                      <div key={idx} className="bg-white rounded-xl border border-stone-200 p-3 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                            isPo ? 'text-amber-800' : 'text-emerald-800'
                          }`}>
                            {isPo ? <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />}
                            <span>{entry.referenceNumber}</span>
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-stone-800">
                          {entry.descriptionBn || entry.description}
                        </div>
                        {entry.itemsSummary && (
                          <div className="text-[11px] text-stone-500 line-clamp-2">
                            {entry.itemsSummary}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-center font-mono">
                          <div className="bg-stone-50 p-1.5 rounded">
                            <div className="text-[9px] text-stone-500 font-sans">বিল (Cr)</div>
                            <div className="text-xs font-bold text-amber-800">
                              {entry.credit > 0 ? formatPrice(entry.credit) : '—'}
                            </div>
                          </div>
                          <div className="bg-stone-50 p-1.5 rounded">
                            <div className="text-[9px] text-stone-500 font-sans">পরিশোধ (Dr)</div>
                            <div className="text-xs font-bold text-emerald-700">
                              {entry.debit > 0 ? formatPrice(entry.debit) : '—'}
                            </div>
                          </div>
                          <div className="bg-amber-50/60 p-1.5 rounded border border-amber-200/50">
                            <div className="text-[9px] text-amber-900 font-sans font-bold">ব্যালেন্স</div>
                            <div className="text-xs font-black text-amber-900">
                              {formatPrice(entry.runningBalance)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Statement Table (visible on md screens and larger) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3.5">তারিখ</th>
                      <th className="py-3 px-3.5">ধরন ও রেফারেন্স</th>
                      <th className="py-3 px-3.5">বিবরণ / আইটেমস</th>
                      <th className="py-3 px-3.5 text-right text-rose-700">চালান বিল (+ ক্রেডিট)</th>
                      <th className="py-3 px-3.5 text-right text-emerald-700">পরিশোধ (- ডেবিট)</th>
                      <th className="py-3 px-3.5 text-right text-stone-900">চলতি জের (Due BDT)</th>
                      <th className="py-3 px-3.5 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {filteredStatement.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-400">
                          কোন লেনদেন পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredStatement.map((entry, idx) => {
                        const isPo = entry.type === 'PURCHASE_ORDER';
                        return (
                          <tr key={idx} className="hover:bg-stone-50 transition-colors">
                            <td className="py-3.5 px-3.5 text-stone-600 whitespace-nowrap">
                              <div className="font-semibold text-stone-900">
                                {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[10px] text-stone-400">
                                {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                                isPo ? 'text-amber-800' : 'text-emerald-800'
                              }`}>
                                {isPo ? <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />}
                                <span>{entry.referenceNumber}</span>
                              </span>
                              <div className="text-[10px] text-stone-400 font-semibold uppercase">
                                {isPo ? 'ক্রয় চালান (PO)' : `পেমেন্ট (${entry.paymentMethod?.replace('_', ' ') || 'Voucher'})`}
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5 max-w-xs">
                              <div className="font-semibold text-stone-800">{entry.descriptionBn || entry.description}</div>
                              {entry.itemsSummary && (
                                <div className="text-[11px] text-stone-500 truncate" title={entry.itemsSummary}>
                                  {entry.itemsSummary}
                                </div>
                              )}
                              {entry.operator && (
                                <div className="text-[10px] text-stone-400">এন্ট্রি: {entry.operator}</div>
                              )}
                            </td>

                            <td className="py-3.5 px-3.5 text-right font-mono font-bold text-amber-800">
                              {entry.credit > 0 ? formatPrice(entry.credit) : '—'}
                            </td>

                            <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-700">
                              {entry.debit > 0 ? formatPrice(entry.debit) : '—'}
                            </td>

                            <td className="py-3.5 px-3.5 text-right font-mono font-extrabold text-stone-900">
                              <span className={entry.runningBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                                {formatPrice(entry.runningBalance)}
                              </span>
                            </td>

                            <td className="py-3.5 px-3.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.status === 'RECEIVED' || entry.status === 'SETTLED' || entry.status === 'CLEARED'
                                   ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                   : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}>
                                {entry.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-stone-100/90 border-t-2 border-stone-300 font-mono font-bold text-xs">
                    <tr>
                      <td colSpan={3} className="py-3 px-3.5 text-stone-800 uppercase tracking-wider text-[11px]">
                        সর্বমোট যোগফল (Summary Totals)
                      </td>
                      <td className="py-3 px-3.5 text-right text-amber-800 text-sm">
                        {formatPrice(financialSummary.totalPurchased)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-emerald-700 text-sm">
                        {formatPrice(financialSummary.totalPaid)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-stone-900 text-sm font-black">
                        {formatPrice(financialSummary.totalDue)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB: 12-MONTH FINANCIAL TRENDS & FLUCTUATION ANALYSIS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    গত ১২ মাসের আর্থিক লেনদেন ও গতিপ্রকৃতি বিশ্লেষণ (12-Month Financial Performance Trends)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    মোট ক্রয়াদেশ বিল বনাম ব্যাংকিং পরিশোধের মাসিক ওঠানামা, কিউমুলেティブ বকেয়া ও ক্যাশফ্লো চার্ট।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('statement')}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>খতিয়ান স্টেটমেন্ট দেখুন</span>
                  </button>
                  <button
                    onClick={() => onDisbursePayment(supplier, financialSummary.totalDue)}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>পেমেন্ট ভাউচার প্রদান</span>
                  </button>
                </div>
              </div>

              <SupplierFinancialTrendChart
                trends={detail?.monthlyTrends || detail?.financialSummary?.monthlyTrends}
                purchaseOrders={purchaseOrders}
                payments={payments}
                supplierName={supplier.companyName}
                supplierCode={supplier.code}
              />
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 3: PURCHASE ORDERS & DELIVERY CHECKPOINTS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'pos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    ইস্যুকৃত ক্রয়াদেশ ও মালামাল রিসিভিং হিস্ট্রি
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    প্রতিটি অর্ডারে কি কি পণ্য ছিল, প্রতিটির মূল্য কত এবং ওয়্যারহাউস রিসিভিং স্ট্যাটাস।
                  </p>
                </div>
                <button
                  onClick={() => onIssuePo(supplier)}
                  className="px-3 py-1.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন PO ইস্যু</span>
                </button>
              </div>

              {purchaseOrders.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                  এই ভেন্ডরের জন্য এখনো কোন ক্রয়াদেশ ইস্যু করা হয়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {purchaseOrders.map((po) => {
                    const isExpanded = expandedPoId === po.id;
                    const isFullyReceived = po.deliveryStatus === 'RECEIVED';
                    const isFullyPaid = po.paymentStatus === 'PAID';

                    return (
                      <div key={po.id} className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                        {/* Header Bar */}
                        <div 
                          onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                          className="p-4 bg-stone-50/70 hover:bg-stone-100/60 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-1 rounded bg-stone-200 text-stone-600">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-stone-900">{po.poNumber}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isFullyReceived 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                                }`}>
                                  {po.deliveryStatus}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isFullyPaid
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {po.paymentStatus}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-500 mt-0.5">
                                অর্ডারের তারিখ: {new Date(po.orderDate).toLocaleDateString('en-GB')} • প্রত্যাশিত ডেলিভারি: {new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-center">
                            <div className="text-right">
                              <div className="text-xs font-mono font-bold text-stone-900">
                                মোট: {formatPrice(po.totalAmount)}
                              </div>
                              <div className="text-[11px] text-stone-500 font-mono">
                                পরিশোধ: {formatPrice(po.paidAmount)} | বকেয়া: {formatPrice(po.dueAmount)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible PO Content */}
                        {isExpanded && (
                          <div className="p-4 border-t border-stone-200 space-y-4">
                            {po.notes && (
                              <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                                <span className="font-bold text-stone-700">নোট:</span> {po.notes}
                              </div>
                            )}

                            {/* Itemized Line Items Table */}
                            <div className="overflow-x-auto rounded-lg border border-stone-200">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-stone-50 text-stone-600 font-semibold text-[10px] uppercase">
                                  <tr>
                                    <th className="py-2.5 px-3">পণ্য</th>
                                    <th className="py-2.5 px-3">SKU</th>
                                    <th className="py-2.5 px-3 text-right">পরিমাণ (Qty)</th>
                                    <th className="py-2.5 px-3 text-right">একক দর (Unit Cost)</th>
                                    <th className="py-2.5 px-3 text-right">মোট সাবটোটাল</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  {po.items.map((item, iIdx) => (
                                    <tr key={iIdx}>
                                      <td className="py-2.5 px-3 font-semibold text-stone-800">
                                        {item.productTitle}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-stone-500">
                                        {item.sku}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                                        {item.quantity} পিস
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono text-stone-700">
                                        {formatPrice(item.unitCost)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                                        {formatPrice(item.subtotal || item.quantity * item.unitCost)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
                              <div className="text-[11px] text-stone-500">
                                প্রস্তুতকারক: {po.createdByName || 'Inventory Staff'} • ওয়্যারহাউস: {po.warehouseName || 'Dhaka Central Hub'}
                              </div>

                              <div className="flex items-center gap-2">
                                {!isFullyReceived && (
                                  <button
                                    onClick={() => onMarkPoReceived(supplier.id, po.id)}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow-xs"
                                  >
                                    <Warehouse className="w-3.5 h-3.5" />
                                    <span>রিসিভ করুন ও স্টক বাড়ান</span>
                                  </button>
                                )}
                                {po.dueAmount > 0 && (
                                  <button
                                    onClick={() => onDisbursePayment(supplier, po.dueAmount)}
                                    className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>এই PO এর বকেয়া পরিশোধ ({formatPrice(po.dueAmount)})</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 4: PAYMENTS & BANK DISBURSEMENT VOUCHERS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    পরিশোধিত অর্থ ও ব্যাংক ডিসবার্সমেন্ট ভাউচার
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ব্যাংক ট্রান্সফার, চেক ও বিকাশ পেমেন্টের ট্রানজেকশন আইডি এবং হিসাবের প্রমাণ।
                  </p>
                </div>
                <button
                  onClick={() => onDisbursePayment(supplier, financialSummary.totalDue)}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>পেমেন্ট ভাউচার তৈরি করুন</span>
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                  এই ভেন্ডরের জন্য এখনো কোন পেমেন্ট ডিসবার্সমেন্ট রেকর্ড নেই।
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {payments.map((pmt) => (
                    <div key={pmt.id} className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-colors space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-stone-900 px-2 py-0.5 rounded bg-stone-100 border border-stone-200">
                          {pmt.referenceNumber}
                        </span>
                        <span className="font-mono text-base font-extrabold text-emerald-700">
                          {formatPrice(pmt.amount)}
                        </span>
                      </div>

                      <div className="text-xs text-stone-700">
                        <div className="font-semibold flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                          <span>মেথড: {pmt.paymentMethod.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          তারিখ: {new Date(pmt.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {pmt.notes && (
                        <div className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded border border-stone-100 italic">
                          "{pmt.notes}"
                        </div>
                      )}

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                        <span>হিসাব কর্মকর্তা: {pmt.recordedBy}</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> পরিশোধিত
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 5: VENDOR PROFILE, BANK DETAILS & AGREEMENTS */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business & Legal Identifiers */}
              <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-stone-600" />
                  <span>ব্যবসায়িক ও আইনি তথ্যাবলি</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-stone-200">
                    <span className="text-stone-500">কোম্পানির নাম:</span>
                    <span className="font-bold text-stone-900">{supplier.companyName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200">
                    <span className="text-stone-500">মূল যোগাযোগকারী:</span>
                    <span className="font-bold text-stone-900">{supplier.contactPerson}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200">
                    <span className="text-stone-500">ট্রেড লাইসেন্স নং:</span>
                    <span className="font-mono font-bold text-stone-900">{supplier.tradeLicenseNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200">
                    <span className="text-stone-500">ট্যাক্স আইডেন্টিফিকেশন (TIN):</span>
                    <span className="font-mono font-bold text-stone-900">{supplier.tinNumber || supplier.taxIdentificationNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200">
                    <span className="text-stone-500">ভ্যাট রেজিস্ট্রেশন (BIN):</span>
                    <span className="font-mono font-bold text-stone-900">{supplier.vatRegistrationNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200">
                    <span className="text-stone-500">পেমেন্ট টার্মস (শর্ত):</span>
                    <span className="font-bold text-stone-900">{supplier.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-200">
                    <span className="text-stone-500">সরবরাহের ক্যাটাগরি:</span>
                    <span className="font-medium text-stone-800">{supplier.categoriesSupplied.join(', ')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-stone-500">ঠিকানা ও জেলা:</span>
                    <span className="text-stone-800 text-right">{supplier.address}, {supplier.district}</span>
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-stone-600" />
                  <span>ব্যাংক হিসাব ও পেমেন্ট রুট</span>
                </h4>

                {supplier.bankDetails ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-stone-200">
                      <span className="text-stone-500">ব্যাংকের নাম:</span>
                      <span className="font-bold text-stone-900">{supplier.bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-200">
                      <span className="text-stone-500">হিসাবধারীর নাম:</span>
                      <span className="font-bold text-stone-900">{supplier.bankDetails.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-stone-200">
                      <span className="text-stone-500">হিসাব নম্বর:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-stone-900">
                        <span>{supplier.bankDetails.accountNumber}</span>
                        <button
                          onClick={() => copyToClipboard(supplier.bankDetails?.accountNumber || '', 'acct')}
                          className="text-stone-400 hover:text-stone-700 p-0.5"
                          title="Copy account number"
                        >
                          {copiedField === 'acct' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-200">
                      <span className="text-stone-500">শাখা (Branch):</span>
                      <span className="font-medium text-stone-800">{supplier.bankDetails.branchName}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-stone-500">রাউটিং নম্বর:</span>
                      <span className="font-mono font-bold text-stone-900">{supplier.bankDetails.routingNumber}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-500 py-6 text-center border border-dashed border-stone-200 rounded-lg">
                    কোন ব্যাংক হিসাব যুক্ত করা হয়নি।
                  </div>
                )}

                {/* Portal Access Status */}
                <div className="mt-4 pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-900">আইসোলেটেড ভেন্ডর পোর্টাল এক্সেস</div>
                      <div className="text-[11px] text-stone-500">নিরাপদ সেলফ-সার্ভিস পোর্টাল</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                      supplier.portalAccess?.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {supplier.portalAccess?.enabled ? 'সক্রিয় (Active)' : 'লকড (Disabled)'}
                    </span>
                  </div>
                  {supplier.portalAccess?.enabled && (
                    <div className="mt-2 text-[11px] text-stone-600 font-mono bg-white p-2 rounded border border-stone-200">
                      লগইন আইডি: {supplier.portalAccess.loginEmail}
                    </div>
                  )}
                </div>
              </div>

              {/* Interactions & Contract Discussions */}
              <div className="md:col-span-2 bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  যোগাযোগ ও চুক্তির লগ হিস্ট্রি ({interactions.length})
                </h4>

                {interactions.length === 0 ? (
                  <div className="text-center py-6 text-stone-400 text-xs border border-dashed border-stone-200 rounded-lg">
                    কোন যোগাযোগের রেকর্ড এখনো নেই।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interactions.map(item => (
                      <div key={item.id} className="p-3 bg-white rounded-lg border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{item.subject}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600">
                              {item.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            {new Date(item.date).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <p className="text-stone-600 text-[11px]">{item.notes}</p>
                        <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1">
                          <span>রেকর্ড করেছেন: {item.loggedBy}</span>
                          <span className="font-semibold text-emerald-700">{item.outcome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Printable Official Invoice Statement (Appears only during Window Print) */}
        {/* ========================================================================= */}
        <div className="hidden print:block p-8 space-y-6 text-black bg-white">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold font-serif">KISHOLOY</h1>
              <p className="text-xs text-stone-600">Pure Heritage Bangladeshi E-Commerce</p>
              <p className="text-xs text-stone-500">Dhaka Central Hub, Tejgaon I/A, Dhaka</p>
            </div>
            <div className="text-right text-xs">
              <h2 className="text-base font-bold">OFFICIAL VENDOR LEDGER STATEMENT</h2>
              <p className="font-mono">Date: {new Date().toLocaleDateString('en-GB')}</p>
              <p className="font-mono">Vendor Code: {supplier.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded">
            <div>
              <div className="font-bold">VENDOR DETAILS:</div>
              <div>{supplier.companyName}</div>
              <div>Contact: {supplier.contactPerson} ({supplier.phone})</div>
              <div>Address: {supplier.address}, {supplier.district}</div>
              <div>TIN: {supplier.taxIdentificationNumber || 'N/A'}</div>
            </div>
            <div className="text-right">
              <div className="font-bold">FINANCIAL POSITION:</div>
              <div>Total Billed: {formatPrice(financialSummary.totalPurchased)}</div>
              <div>Total Disbursed: {formatPrice(financialSummary.totalPaid)}</div>
              <div className="font-bold text-sm">Net Outstanding Due: {formatPrice(financialSummary.totalDue)}</div>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse border">
            <thead>
              <tr className="bg-stone-100 border">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Ref #</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border text-right">Debit (Paid)</th>
                <th className="p-2 border text-right">Credit (Bill)</th>
                <th className="p-2 border text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerStatement.map((e, idx) => (
                <tr key={idx} className="border">
                  <td className="p-2 border">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                  <td className="p-2 border font-mono">{e.referenceNumber}</td>
                  <td className="p-2 border">{e.description}</td>
                  <td className="p-2 border text-right">{e.debit > 0 ? formatPrice(e.debit) : '—'}</td>
                  <td className="p-2 border text-right">{e.credit > 0 ? formatPrice(e.credit) : '—'}</td>
                  <td className="p-2 border text-right font-bold">{formatPrice(e.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-12 flex justify-between text-xs">
            <div className="text-center border-t border-black pt-1 w-40">Accounts Officer</div>
            <div className="text-center border-t border-black pt-1 w-40">Procurement Lead</div>
            <div className="text-center border-t border-black pt-1 w-40">Vendor Signature</div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>KISHOLOY Authoritative ERP Ledger • All values calculated server-side</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-lg transition-colors"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
