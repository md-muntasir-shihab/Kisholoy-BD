import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Plus, RefreshCw, HelpCircle, CheckCircle2, AlertTriangle, 
  FileText, Calendar, ShieldCheck, Eye, CreditCard, ArrowUpRight, Lock, 
  ChevronRight, Filter, Search, Printer, ShieldAlert, ArrowDownRight,
  TrendingUp, Undo2, Layers, Building2, Check, Download, AlertCircle, 
  Sparkles, CheckCircle, Info
} from 'lucide-react';
import { Supplier, SupplierSettlement, SupplierEligibleSale } from '../../types';
import { useApp } from '../../context/AppContext';
import { SUPPLIER_HELP_DEFINITIONS, SupplierFunctionHelp } from '../../admin/supplierHelpData';
import { AdminModalShell } from './AdminModalShell';
import { usePendingAction } from '../../hooks/usePendingAction';

interface SupplierSettlementsViewProps {
  suppliers: Supplier[];
  onOpenHelp: (help: SupplierFunctionHelp) => void;
  onOpenStatement: (supplierId: string) => void;
}

type SubTab = 'cycles' | 'sales' | 'returns' | 'matrix';

export const SupplierSettlementsView: React.FC<SupplierSettlementsViewProps> = ({
  suppliers,
  onOpenHelp,
  onOpenStatement
}) => {
  const { language, showToast, currentRole, formatPrice } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('cycles');
  // F-306: blocks duplicate submits while a mutation is in flight.
  const { run, isPending, isBusy } = usePendingAction();
  const [settlements, setSettlements] = useState<SupplierSettlement[]>([]);
  const [eligibleSales, setEligibleSales] = useState<SupplierEligibleSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingSales, setSyncingSales] = useState(false);
  
  // Filters
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SupplierSettlement | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  // Form State for creating a settlement
  const [supplierId, setSupplierId] = useState('');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);

  // Return Adjustment Form State
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('Customer returned damaged/unopened product');

  // Payment Disbursement State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'BKASH_MERCHANT' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [resSettlements, resSales] = await Promise.all([
        fetch('/api/suppliers/settlements/all').then(r => r.json()),
        fetch('/api/suppliers/eligible-sales/all').then(r => r.json())
      ]);
      if (resSettlements.success) setSettlements(resSettlements.settlements || []);
      if (resSales.success) setEligibleSales(resSales.sales || []);
    } catch (err) {
      console.error('Failed to load settlements data', err);
      showToast?.('Failed to load settlements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync delivered orders automatically into supplier eligible sales
  const handleSyncDeliveredOrders = async () => {
    setSyncingSales(true);
    try {
      const res = await fetch('/api/suppliers/eligible-sales/sync-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: currentRole })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`Automated sync complete. Processed ${data.totalProcessed} new order line items.`);
        loadData();
      } else {
        showToast?.(data.error || 'Failed to sync delivered orders.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Sync error.');
    } finally {
      setSyncingSales(false);
    }
  };

  const openCreateModal = (preselectedSuppId?: string) => {
    setSupplierId(preselectedSuppId || suppliers[0]?.id || '');
    setCreateModalOpen(true);
  };

  // Preview Candidate Sales during Settlement Creation
  const previewSales = useMemo(() => {
    if (!supplierId) return [];
    return eligibleSales.filter(es => {
      // Find matching batch
      return es.status === 'PENDING_SETTLEMENT';
    });
  }, [eligibleSales, supplierId]);

  const previewGross = previewSales.reduce((sum, s) => sum + (s.netEligibleAmount || 0), 0);
  const previewSupplierShare = previewSales.reduce((sum, s) => sum + (s.supplierShare || 0), 0);
  const previewReturns = previewSales.filter(s => s.status === 'ADJUSTED_RETURNED').reduce((sum, s) => sum + (s.supplierShare || 0), 0);
  const previewNet = Math.max(0, previewSupplierShare - previewReturns);

  const handleGenerateSettlement = async (e: React.FormEvent) =>  run('handleGenerateSettlement', async () => {
    e.preventDefault();
    if (!supplierId || !periodStart || !periodEnd) {
      showToast?.('Please specify supplier and complete date range.');
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/${supplierId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
          operator: currentRole
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`Settlement ${data.settlement.settlementNumber} generated.`);
        setCreateModalOpen(false);
        loadData();
      } else {
        showToast?.(data.error || 'Failed to generate settlement.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error generating settlement.');
    }
  
  });

  // Manual Return Adjustment Handler
  const handleApplyReturnAdjustment = async (e: React.FormEvent) =>  run('handleApplyReturnAdjustment', async () => {
    e.preventDefault();
    if (!returnOrderId.trim()) {
      showToast?.('Please enter Order ID or Reference Number.');
      return;
    }

    try {
      const res = await fetch('/api/suppliers/eligible-sales/adjust-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: returnOrderId.trim(),
          returnData: { reason: returnReason },
          operator: currentRole
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.('Return adjustment debited from supplier eligible pool.');
        setReturnModalOpen(false);
        setReturnOrderId('');
        loadData();
      } else {
        showToast?.(data.note || 'Failed to adjust returned order.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error processing return adjustment.');
    }
    });

  const handleUpdateStatus = async (settlementId: string, newStatus: string) =>  run('handleUpdateStatus', async () => {
    try {
      const res = await fetch(`/api/suppliers/settlements/${settlementId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, operator: currentRole })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`Settlement status updated to ${newStatus}.`);
        loadData();
        if (selectedSettlement?.id === settlementId) {
          setSelectedSettlement(data.settlement);
        }
      } else {
        showToast?.(data.error || 'Failed to update settlement status.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error updating status.');
    }
  
  });

  const openPayModal = (settlement: SupplierSettlement) => {
    setSelectedSettlement(settlement);
    const totalPayable = settlement.netPayable ?? settlement.currentPayable ?? 0;
    const disbursed = settlement.paidAmount ?? settlement.paymentsAlreadyMade ?? 0;
    const remaining = Math.max(0, totalPayable - disbursed);
    setPaymentAmount(remaining);
    setPaymentMethod('BANK_TRANSFER');
    setReferenceNumber(`VCH-${Date.now().toString().slice(-6)}`);
    setPaymentNotes(`Settlement ${settlement.settlementNumber} payout`);
    setMfaCode('');
    setPayModalOpen(true);
  };

  const handleDisbursePayment = async (e: React.FormEvent) =>  run('handleDisbursePayment', async () => {
    e.preventDefault();
    if (!selectedSettlement || paymentAmount <= 0) {
      showToast?.('Please specify a positive payout amount.');
      return;
    }

    if (paymentAmount >= 50000 && (!mfaCode || mfaCode.length < 6)) {
      showToast?.('High-value payment (≥ ৳50,000) requires a 6-digit MFA confirmation code.');
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/settlements/${selectedSettlement.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          paymentMethod,
          referenceNumber,
          notes: paymentNotes,
          mfaCode: mfaCode || undefined,
          operator: currentRole
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`Disbursed ৳${paymentAmount.toLocaleString('en-BD')} for ${selectedSettlement.settlementNumber}.`);
        setPayModalOpen(false);
        loadData();
      } else {
        showToast?.(data.error || 'Failed to disburse payment.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error executing payout.');
    }
  
  });

  // High-level Calculations
  const totalGrossSourced = settlements.reduce((sum, s) => sum + (s.grossSalesAmount ?? s.grossSales ?? 0), 0);
  const totalSupplierShare = settlements.reduce((sum, s) => sum + (s.supplierShareAmount ?? s.supplierShare ?? 0), 0);
  const totalReturnsAdjusted = settlements.reduce((sum, s) => sum + (s.returnsAdjustment ?? (s as any).returnAdjustments ?? 0), 0);
  const totalPaidOut = settlements.reduce((sum, s) => sum + (s.paidAmount ?? s.paymentsAlreadyMade ?? 0), 0);
  const totalNetPayableObligation = settlements.reduce((sum, s) => sum + (s.netPayable ?? s.currentPayable ?? 0), 0);
  const totalOutstandingDue = Math.max(0, totalNetPayableObligation - totalPaidOut);
  const totalKisholoyRetained = settlements.reduce((sum, s) => sum + (s.kisholoyShareAmount ?? s.kisholoyShare ?? 0), 0);

  // Filtered Settlement Lists
  const filteredSettlements = settlements.filter(s => {
    const matchesSupplier = selectedSupplierFilter === 'ALL' || s.supplierId === selectedSupplierFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch = s.settlementNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSupplier && matchesStatus && matchesSearch;
  });

  // Filtered Eligible Sales
  const filteredEligibleSales = eligibleSales.filter(es => {
    const matchesSupplier = selectedSupplierFilter === 'ALL' || true; // Can filter if needed
    const matchesStatus = statusFilter === 'ALL' || es.status === statusFilter;
    const matchesSearch = es.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (es.productId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSupplier && matchesStatus && matchesSearch;
  });

  // Filtered Returns
  const returnedSales = eligibleSales.filter(es => es.status === 'ADJUSTED_RETURNED');

  return (
    <div id="supplier-settlements-module" className="space-y-6">
      {/* 1. Header & Context Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              {language === 'BN' ? 'আর্থিক আইসোলেশন ও এসক্রো খাতা' : 'ISOLATED ESCROW & PAYABLES LEDGER'}
            </span>
            <span className="text-xs text-stone-400 font-mono">/</span>
            <span className="text-xs font-semibold text-stone-600 font-mono">FINANCIAL SETTLEMENTS</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900 text-white rounded-xl shadow-xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'সাপ্লায়ার সেটেলমেন্ট ও প্রদেয় হিসাব' : 'Supplier Settlements & Payables Cycle'}
                </h1>
                <button
                  type="button"
                  onClick={() => onOpenHelp(SUPPLIER_HELP_DEFINITIONS.settlement_calculation)}
                  className="text-stone-400 hover:text-emerald-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
                  title="Explain Settlement Mechanics"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
                {language === 'BN' 
                  ? 'ডেলিভারিকৃত অর্ডারের লাইভ ডাটা থেকে স্বয়ংক্রিয় প্রদেয় হিসেব, কাস্টমার রিটার্ন সমন্বয় ও পৃথক ব্যাংক/বিকাশ পেমেন্ট ভাউচার ব্যবস্থাপনা।'
                  : 'Automated revenue share calculation on delivered orders, RMA return adjustments, isolated accounts payable, and high-value MFA payouts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'BN' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncDeliveredOrders}
            disabled={syncingSales}
            className="px-3.5 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Scan delivered orders in database and compute eligible sales"
          >
            <Sparkles className={`w-3.5 h-3.5 text-teal-700 ${syncingSales ? 'animate-spin' : ''}`} />
            <span>{syncingSales ? 'Syncing...' : (language === 'BN' ? 'ডেলিভারি সিঙ্ক' : 'Sync Delivered')}</span>
          </button>

          <button
            type="button"
            onClick={() => setReturnModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === 'BN' ? 'রিটার্ন সমন্বয়' : 'Return Adjustment'}</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'নতুন সেটেলমেন্ট তৈরি' : 'Generate Settlement'}</span>
          </button>
        </div>
      </div>

      {/* 2. Core Revenue vs Supplier Liability Isolation Notice */}
      <div className="bg-stone-900 text-stone-200 rounded-xl p-4 border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 rounded-lg shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {language === 'BN' ? 'আর্থিক আইসোলেশন ও স্বচ্ছতা নীতি' : 'Financial Isolation & Separation Safeguard'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-mono font-semibold">
                STRICT LIABILITY SEPARATION
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1 max-w-3xl leading-relaxed">
              {language === 'BN'
                ? 'সাপ্লায়ার শেয়ার বা প্রদেয় অর্থ কিশোলয়ের নিজস্ব মূল রাজস্ব (Revenue) নয় — এটি সংগৃহীত বিক্রয় অর্থ থেকে আলাদা রক্ষিত দায় (Accounts Payable Escrow)। কিশোলয়ের প্রকৃত আয় হচ্ছে কেবল চুক্তিভিত্তিক নির্ধারিত মার্জিন।'
                : "Supplier shares are strictly accounted for as pass-through accounts payable obligations and held isolated from KISHOLOY's core recognized platform gross revenue. Only the agreed platform margin constitutes KISHOLOY operating income."}
            </p>
          </div>
        </div>

        <div className="bg-stone-800/90 px-4 py-2.5 rounded-lg border border-stone-700/60 shrink-0 text-right">
          <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">KISHOLOY Platform Margin</div>
          <div className="text-lg font-mono font-bold text-emerald-400">
            {formatPrice ? formatPrice(totalKisholoyRetained) : `৳${totalKisholoyRetained.toLocaleString()}`}
          </div>
          <div className="text-[10px] text-stone-400">Retained commission & margin</div>
        </div>
      </div>

      {/* 3. High-Level Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>{language === 'BN' ? 'মোট বিক্রয় (গ্রস)' : 'Gross Sourced GMV'}</span>
            <TrendingUp className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-xl font-bold text-stone-900 mt-1.5 font-mono">
            {formatPrice ? formatPrice(totalGrossSourced) : `৳${totalGrossSourced.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Customer retail sales volume
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>{language === 'BN' ? 'সাপ্লায়ার শেয়ার' : 'Supplier Gross Share'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1.5 font-mono">
            {formatPrice ? formatPrice(totalSupplierShare) : `৳${totalSupplierShare.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            Based on agreed split/cost
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>{language === 'BN' ? 'রিটার্ন সমন্বয়' : 'Returns Deducted'}</span>
            <Undo2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1.5 font-mono">
            {formatPrice ? formatPrice(totalReturnsAdjusted) : `৳${totalReturnsAdjusted.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">
            Debited on order RMA returns
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>{language === 'BN' ? 'পরিশোধিত অর্থ' : 'Total Paid Out'}</span>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-800 mt-1.5 font-mono">
            {formatPrice ? formatPrice(totalPaidOut) : `৳${totalPaidOut.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-teal-700 mt-1">
            Disbursed via bank / bKash
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs bg-gradient-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>{language === 'BN' ? 'মোট বকেয়া প্রদেয়' : 'Net Outstanding Due'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1.5 font-mono">
            {formatPrice ? formatPrice(totalOutstandingDue) : `৳${totalOutstandingDue.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-semibold">
            Active payable obligation
          </div>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('cycles')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'cycles'
              ? 'border-emerald-800 text-emerald-950 font-bold bg-stone-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-700" />
          <span>{language === 'BN' ? 'সেটেলমেন্ট সাইকেল ও ভাউচার' : 'Settlement Cycles'}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600 font-mono">
            {settlements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sales')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'sales'
              ? 'border-emerald-800 text-emerald-950 font-bold bg-stone-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-700" />
          <span>{language === 'BN' ? 'ডেলিভারি ও সেলস শেয়ার স্ট্রিম' : 'Automated Sales Stream'}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600 font-mono">
            {eligibleSales.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('returns')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'returns'
              ? 'border-emerald-800 text-emerald-950 font-bold bg-stone-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Undo2 className="w-4 h-4 text-amber-700" />
          <span>{language === 'BN' ? 'রিটার্ন ও রিফান্ড সমন্বয়' : 'Return Adjustments'}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
            {returnedSales.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'border-emerald-800 text-emerald-950 font-bold bg-stone-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span>{language === 'BN' ? 'সাপ্লায়ার প্রদেয় ব্যালেন্স ম্যাট্রিক্স' : 'Payables Balance Matrix'}</span>
        </button>
      </div>

      {/* 5. Sub-Tab Content Views */}

      {/* View A: Settlement Cycles */}
      {activeSubTab === 'cycles' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-5 shadow-xs space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'BN' ? 'সেটেলমেন্ট নম্বর খুঁজুন...' : 'Search settlement #...'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 font-mono"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-800"
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.companyName || s.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Settlements Table */}
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Settlement Cycle</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5 text-right">Gross GMV</th>
                  <th className="p-3.5 text-right">Supplier Share</th>
                  <th className="p-3.5 text-right">Returns Debited</th>
                  <th className="p-3.5 text-right">Net Payable</th>
                  <th className="p-3.5 text-right">Disbursed Paid</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSettlements.map((st) => {
                  const supplier = suppliers.find(s => s.id === st.supplierId);
                  const grossAmt = st.grossSalesAmount ?? st.grossSales ?? 0;
                  const suppShare = st.supplierShareAmount ?? st.supplierShare ?? 0;
                  const returnsAdj = st.returnsAdjustment ?? (st as any).returnAdjustments ?? 0;
                  const netPay = st.netPayable ?? st.currentPayable ?? 0;
                  const paidAmt = st.paidAmount ?? st.paymentsAlreadyMade ?? 0;
                  const isPaidFull = st.status === 'PAID' || (paidAmt >= netPay && netPay > 0);

                  return (
                    <tr key={st.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900 font-mono text-xs flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-800" />
                          {st.settlementNumber}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 font-mono">
                          {new Date(st.periodStart).toLocaleDateString()} — {new Date(st.periodEnd).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-stone-900 text-xs">
                          {supplier?.companyName || supplier?.name || st.supplierId}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {supplier?.code || 'VENDOR'} • {st.eligibleSalesCount || 0} orders
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono text-stone-900 font-medium">
                        ৳{grossAmt.toLocaleString('en-BD')}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-emerald-800">
                        ৳{suppShare.toLocaleString('en-BD')}
                      </td>

                      <td className="p-3.5 text-right font-mono text-amber-700">
                        {returnsAdj > 0 ? `-৳${returnsAdj.toLocaleString('en-BD')}` : '৳0'}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                        ৳{netPay.toLocaleString('en-BD')}
                      </td>

                      <td className="p-3.5 text-right font-mono text-xs">
                        <span className={`font-semibold ${isPaidFull ? 'text-emerald-700' : 'text-stone-600'}`}>
                          ৳{paidAmt.toLocaleString('en-BD')}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          st.status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          st.status === 'APPROVED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          st.status === 'PARTIALLY_PAID' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          st.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-stone-100 text-stone-600 border-stone-200'
                        }`}>
                          {st.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSettlement(st);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 text-stone-600 hover:text-emerald-900 hover:bg-stone-100 rounded-lg text-xs"
                            title="View Calculation Breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenStatement(st.supplierId)}
                            className="p-1.5 text-stone-600 hover:text-emerald-900 hover:bg-stone-100 rounded-lg text-xs"
                            title="Print Settlement Statement"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {st.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(st.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-md text-[11px] font-bold"
                            >
                              Approve
                            </button>
                          )}

                          {(st.status === 'APPROVED' || st.status === 'PARTIALLY_PAID') && (
                            <button
                              type="button"
                              onClick={() => openPayModal(st)}
                              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-[11px] font-bold shadow-2xs"
                            >
                              Pay Due
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredSettlements.length === 0 && !loading && (
            <div className="p-8 text-center text-stone-500 text-xs border border-dashed border-stone-200 rounded-xl">
              No settlements found matching the criteria. Click "Generate Settlement" to compute delivered customer orders.
            </div>
          )}
        </div>
      )}

      {/* View B: Automated Sales Stream */}
      {activeSubTab === 'sales' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                {language === 'BN' ? 'স্বয়ংক্রিয় অর্ডার ভিত্তিক শেয়ার গণনা স্ট্রিম' : 'Delivered Orders & Automated Share Calculations'}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Every line item delivered to customers is automatically matched against active commercial agreements.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncDeliveredOrders}
              disabled={syncingSales}
              className="px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>{syncingSales ? 'Syncing...' : 'Scan Delivered Orders'}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-200 font-sans">
                <tr>
                  <th className="p-3">Order & Date</th>
                  <th className="p-3">Product / Batch</th>
                  <th className="p-3">Applied Commercial Rule</th>
                  <th className="p-3 text-right">Retail Gross</th>
                  <th className="p-3 text-right">Supplier Share</th>
                  <th className="p-3 text-right">KISHOLOY Retained</th>
                  <th className="p-3 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {filteredEligibleSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-stone-50/50">
                    <td className="p-3 font-sans">
                      <div className="font-bold text-stone-900 font-mono text-xs">{sale.orderNumber}</div>
                      <div className="text-[10px] text-stone-400">{new Date(sale.saleDate).toLocaleDateString()}</div>
                    </td>

                    <td className="p-3 font-sans">
                      <div className="font-medium text-stone-900 text-xs">
                        {sale.quantity}× {sale.productId}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Batch: {sale.supplyBatchId || 'Default Catalog Batch'}
                      </div>
                    </td>

                    <td className="p-3 font-sans">
                      <div className="text-xs text-stone-800 font-semibold">{sale.settlementMethodSnapshot}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{sale.calculationRuleSnapshot}</div>
                    </td>

                    <td className="p-3 text-right text-stone-900 font-semibold">
                      ৳{sale.netEligibleAmount.toLocaleString()}
                    </td>

                    <td className="p-3 text-right text-emerald-800 font-bold">
                      ৳{sale.supplierShare.toLocaleString()}
                    </td>

                    <td className="p-3 text-right text-stone-600">
                      ৳{sale.kisholoyShare.toLocaleString()}
                    </td>

                    <td className="p-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        sale.status === 'INCLUDED_IN_SETTLEMENT' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        sale.status === 'ADJUSTED_RETURNED' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {sale.status === 'PENDING_SETTLEMENT' ? 'Awaiting Cycle' : sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEligibleSales.length === 0 && (
            <div className="p-8 text-center text-stone-500 text-xs border border-dashed border-stone-200 rounded-xl">
              No eligible sales snapshots recorded yet. Ensure orders are transitioned to DELIVERED status.
            </div>
          )}
        </div>
      )}

      {/* View C: Return & Refund Adjustments */}
      {activeSubTab === 'returns' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Undo2 className="w-4 h-4 text-amber-700" />
                {language === 'BN' ? 'রিটার্ন ও রিফান্ড সমন্বয় লগ' : 'Return & Refund Clawback Adjustments'}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                When a customer returns a delivered order, the supplier's previous calculated share is debited from future payouts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReturnModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Return Adjustment</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Product / SKU</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3 text-right">Retail Amount</th>
                  <th className="p-3 text-right">Supplier Clawback Debited</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {returnedSales.map((ret) => (
                  <tr key={ret.id} className="hover:bg-stone-50/50">
                    <td className="p-3 font-bold text-stone-900">{ret.orderNumber}</td>
                    <td className="p-3 font-sans">{ret.productId}</td>
                    <td className="p-3">{ret.quantity} units</td>
                    <td className="p-3 text-right">৳{ret.netEligibleAmount.toLocaleString()}</td>
                    <td className="p-3 text-right text-amber-800 font-bold">-৳{ret.supplierShare.toLocaleString()}</td>
                    <td className="p-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        DEBITED FROM PAYABLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {returnedSales.length === 0 && (
            <div className="p-8 text-center text-stone-500 text-xs border border-dashed border-stone-200 rounded-xl">
              No return clawback adjustments on record. Return adjustments occur automatically when RMA returns are approved.
            </div>
          )}
        </div>
      )}

      {/* View D: Payables Summary Matrix */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              {language === 'BN' ? 'সাপ্লায়ার অনুযায়ী প্রদেয় ব্যালেন্স বিবরণী' : 'Consolidated Supplier Payable Balance Matrix'}
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Current total balance breakdown per artisan cooperative and vendor.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Settlement Terms</th>
                  <th className="p-3.5 text-right">Total Sourced (PO/Sales)</th>
                  <th className="p-3.5 text-right">Total Disbursed (Paid)</th>
                  <th className="p-3.5 text-right">Current Net Due</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {suppliers.map((supp) => {
                  const suppSettlements = settlements.filter(s => s.supplierId === supp.id);
                  const suppPurchased = supp.totalPurchased || 0;
                  const suppPaid = supp.totalPaid || 0;
                  const suppDue = Math.max(0, suppPurchased - suppPaid);

                  return (
                    <tr key={supp.id} className="hover:bg-stone-50/70">
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900 text-xs">{supp.companyName || supp.name}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{supp.code} • {supp.phone}</div>
                      </td>

                      <td className="p-3.5 text-stone-600 font-medium">
                        {supp.paymentTerms || 'NET_30'}
                      </td>

                      <td className="p-3.5 text-right font-mono font-semibold text-stone-900">
                        ৳{suppPurchased.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-mono text-emerald-800 font-semibold">
                        ৳{suppPaid.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-amber-800 text-sm">
                        ৳{suppDue.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenStatement(supp.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-teal-900 bg-stone-100 hover:bg-stone-200 rounded-md"
                          >
                            Statement
                          </button>
                          <button
                            type="button"
                            onClick={() => openCreateModal(supp.id)}
                            className="px-3 py-1 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md shadow-2xs"
                          >
                            Settle Cycle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Settlement Detail Breakdown Modal */}
      <AdminModalShell
        open={!!(detailModalOpen && selectedSettlement)}
        onClose={() => setDetailModalOpen(null)}
        label="6 Settlement Detail Breakdown Modal"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-300" />
                  Settlement Breakdown — {selectedSettlement.settlementNumber}
                </h3>
                <p className="text-[11px] text-emerald-200">
                  Cycle Period: {new Date(selectedSettlement.periodStart).toLocaleDateString()} to {new Date(selectedSettlement.periodEnd).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-emerald-200 hover:text-white p-1">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto font-sans">
              {/* Financial Snapshot Matrix */}
              <div className="grid grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 font-mono text-center">
                <div>
                  <span className="text-[10px] text-stone-400 block font-sans font-bold">Gross Retail GMV</span>
                  <span className="font-bold text-stone-900 text-sm">
                    ৳{(selectedSettlement.grossSalesAmount ?? selectedSettlement.grossSales ?? 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-sans font-bold">Supplier Gross</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    ৳{(selectedSettlement.supplierShareAmount ?? selectedSettlement.supplierShare ?? 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-sans font-bold">Returns Deducted</span>
                  <span className="font-bold text-amber-700 text-sm">
                    -৳{(selectedSettlement.returnsAdjustment ?? (selectedSettlement as any).returnAdjustments ?? 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-sans font-bold">Net Payable</span>
                  <span className="font-bold text-emerald-950 text-sm">
                    ৳{(selectedSettlement.netPayable ?? selectedSettlement.currentPayable ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-sans">
                  Status: <strong className="text-stone-800">{selectedSettlement.status}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      onOpenStatement(selectedSettlement.supplierId);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Statement
                  </button>

                  {selectedSettlement.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedSettlement.id, 'APPROVED')}
                      className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Approve for Payout
                    </button>
                  )}

                  {(selectedSettlement.status === 'APPROVED' || selectedSettlement.status === 'PARTIALLY_PAID') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        openPayModal(selectedSettlement);
                      }}
                      className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Disburse Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* 7. Generate Settlement Modal Wizard */}
      <AdminModalShell
        open={!!createModalOpen}
        onClose={() => setCreateModalOpen(null)}
        label="7 Generate Settlement Modal Wizard"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Generate Supplier Settlement Cycle</h3>
                <p className="text-[11px] text-emerald-200">Calculates automated shares and return debits for period</p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-emerald-200 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleGenerateSettlement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-stone-50 focus:ring-1 focus:ring-emerald-700"
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName || s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Period Start *</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Period End *</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  Settlement Calculation Preview
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-stone-700">
                  <div>Pending Candidate Sales: <strong>{previewSales.length} orders</strong></div>
                  <div>Estimated Gross GMV: <strong>৳{previewGross.toLocaleString()}</strong></div>
                  <div>Calculated Supplier Share: <strong className="text-emerald-800">৳{previewSupplierShare.toLocaleString()}</strong></div>
                  <div>Net Payable Estimate: <strong className="text-stone-900 font-bold">৳{previewNet.toLocaleString()}</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
                >
                  Confirm & Generate Settlement
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>

      {/* 8. Return Adjustment Modal */}
      <AdminModalShell
        open={!!returnModalOpen}
        onClose={() => setReturnModalOpen(null)}
        label="8 Return Adjustment Modal"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-amber-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-amber-300" />
                Record Return Adjustment
              </h3>
              <button onClick={() => setReturnModalOpen(false)} className="text-amber-200 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleApplyReturnAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Order ID / Reference Number *</label>
                <input
                  type="text"
                  placeholder="e.g. ord-101 or KSH-2026-8812"
                  value={returnOrderId}
                  onChange={(e) => setReturnOrderId(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">RMA Reason</label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5"
                  rows={2}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                This will reverse the supplier share credit on this order and adjust the supply batch stock.
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-xs"
                >
                  Apply Clawback
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>

      {/* 9. Pay Settlement Modal with MFA */}
      <AdminModalShell
        open={!!(payModalOpen && selectedSettlement)}
        onClose={() => setPayModalOpen(null)}
        label="9 Pay Settlement Modal with MFA"
        closeOnEscape={false}
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Disburse Supplier Payout</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-emerald-200 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleDisbursePayment} className="p-6 space-y-4 font-sans">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs font-mono">
                <div>Settlement: <strong>{selectedSettlement.settlementNumber}</strong></div>
                <div className="mt-1">
                  Net Payable Obligation: <strong>৳{(selectedSettlement.netPayable ?? selectedSettlement.currentPayable ?? 0).toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Disbursement Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedSettlement.netPayable ?? selectedSettlement.currentPayable ?? 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 font-mono font-bold text-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (EFT/NPSB)</option>
                    <option value="BKASH_MERCHANT">bKash B2B Payout</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CASH">Cash Voucher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Voucher / Tx Ref</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              {/* MFA Step-Up for Payouts >= ৳50,000 */}
              {paymentAmount >= 50000 && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    High-Value Step-Up MFA Required (≥ ৳50,000)
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit MFA Code (e.g. 123456)"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full text-center tracking-widest text-sm font-mono font-bold border border-amber-300 rounded-lg p-2 bg-white"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Payout Notes</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
                >
                  Confirm Payout & Record Voucher
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>
    </div>
  );
};
