import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Package,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  Building2,
  Phone,
  FileText,
  Clock,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Download,
  Plus,
  Send,
  Check,
  User,
  SlidersHorizontal,
  Box,
  CreditCard,
  Wallet,
  Printer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { ReturnRefundPrintModal } from '../components/print/ReturnRefundPrintModal';

export interface RmaRecord {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  district: string;
  requestDate: string;
  reason: 'WRONG_SIZE' | 'DEFECTIVE_PRODUCT' | 'WRONG_ITEM_SENT' | 'COLOR_MISMATCH' | 'CHANGED_MIND' | 'COURIER_RETURNED';
  reasonDetails: string;
  productTitle: string;
  sku: string;
  quantity: number;
  itemPrice: number;
  totalRefundAmount: number;
  originalPaymentMethod: string;
  originalPaymentStatus: string;
  stage: 'REQUESTED' | 'PARCEL_RECEIVED' | 'INSPECTED' | 'RESTOCKED' | 'REFUND_QUEUED' | 'REFUND_DISBURSED' | 'REJECTED';
  inspectionResult?: {
    condition: 'PRISTINE_NEW' | 'OPENED_RESELLABLE' | 'DAMAGED_SCRAP';
    inspectedBy: string;
    inspectedAt: string;
    notes: string;
    restocked: boolean;
  };
  refundExecution?: {
    method: 'bKash' | 'Nagad' | 'SSLCOMMERZ_REVERSAL' | 'BANK_EFT' | 'STORE_CREDIT';
    accountNumber: string;
    trxId: string;
    disbursedAt: string;
    disbursedAmount: number;
    disbursedBy: string;
  };
}

const INITIAL_RMA_RECORDS: RmaRecord[] = [
  {
    id: 'rma-101',
    rmaNumber: 'RMA-2026-0891',
    orderId: 'ord-001',
    orderNumber: 'KSH-2026-0891',
    customerName: 'Tanzil Ahmed',
    customerPhone: '+880 1712345678',
    district: 'Dhaka',
    requestDate: '2026-08-30T10:15:00Z',
    reason: 'WRONG_SIZE',
    reasonDetails: 'Ordered XL, customer requested replacement or refund for size L',
    productTitle: 'Handcrafted Silk Panjabi',
    sku: 'PJ-SLK-01',
    quantity: 1,
    itemPrice: 3800,
    totalRefundAmount: 3800,
    originalPaymentMethod: 'SSLCOMMERZ (Visa)',
    originalPaymentStatus: 'PAID',
    stage: 'PARCEL_RECEIVED',
    inspectionResult: {
      condition: 'PRISTINE_NEW',
      inspectedBy: 'Warehouse Inspector #2',
      inspectedAt: '2026-08-31T14:30:00Z',
      notes: 'Item tags intact and packaging undamaged. Eligible for full restock and refund reversal.',
      restocked: true
    }
  },
  {
    id: 'rma-102',
    rmaNumber: 'RMA-2026-0892',
    orderId: 'ord-002',
    orderNumber: 'KSH-2026-0892',
    customerName: 'Nusrat Jahan',
    customerPhone: '+880 1819876543',
    district: 'Chittagong',
    requestDate: '2026-08-29T16:45:00Z',
    reason: 'DEFECTIVE_PRODUCT',
    reasonDetails: 'Loose embroidery stitch on collar seam reported upon unboxing',
    productTitle: 'Embroidered Cotton Kurti',
    sku: 'KT-COT-02',
    quantity: 1,
    itemPrice: 2200,
    totalRefundAmount: 2200,
    originalPaymentMethod: 'bKash',
    originalPaymentStatus: 'PAID',
    stage: 'REFUND_QUEUED',
    inspectionResult: {
      condition: 'DAMAGED_SCRAP',
      inspectedBy: 'Quality Lead Rafiq',
      inspectedAt: '2026-08-30T11:00:00Z',
      notes: 'Factory stitching defect verified. Written off to Supplier Claim. Authorized 100% bKash refund.',
      restocked: false
    }
  },
  {
    id: 'rma-103',
    rmaNumber: 'RMA-2026-0870',
    orderId: 'ord-003',
    orderNumber: 'KSH-2026-0870',
    customerName: 'Farhan Kabir',
    customerPhone: '+880 1912445566',
    district: 'Sylhet',
    requestDate: '2026-08-25T09:20:00Z',
    reason: 'COURIER_RETURNED',
    reasonDetails: 'Customer was unavailable after 3 delivery attempts by Steadfast courier',
    productTitle: 'Premium Festive Jamdani Sharee',
    sku: 'SH-JAM-03',
    quantity: 1,
    itemPrice: 7500,
    totalRefundAmount: 7500,
    originalPaymentMethod: 'COD',
    originalPaymentStatus: 'UNPAID',
    stage: 'RESTOCKED',
    inspectionResult: {
      condition: 'PRISTINE_NEW',
      inspectedBy: 'Hub Dispatcher Alam',
      inspectedAt: '2026-08-26T12:00:00Z',
      notes: 'Courier return parcel intact. Restocked to Dhaka Central Hub inventory. No cash refund required (COD order).',
      restocked: true
    }
  },
  {
    id: 'rma-104',
    rmaNumber: 'RMA-2026-0855',
    orderId: 'ord-004',
    orderNumber: 'KSH-2026-0855',
    customerName: 'Samira Huq',
    customerPhone: '+880 1611223344',
    district: 'Rajshahi',
    requestDate: '2026-08-22T13:10:00Z',
    reason: 'COLOR_MISMATCH',
    reasonDetails: 'Fabric shade appeared slightly different in room lighting compared to website photos',
    productTitle: 'Linen Casual Shirt',
    sku: 'SH-LIN-04',
    quantity: 1,
    itemPrice: 1650,
    totalRefundAmount: 1650,
    originalPaymentMethod: 'Nagad',
    originalPaymentStatus: 'PAID',
    stage: 'REFUND_DISBURSED',
    inspectionResult: {
      condition: 'OPENED_RESELLABLE',
      inspectedBy: 'Inspector Mahin',
      inspectedAt: '2026-08-23T10:00:00Z',
      notes: 'Clean condition, steam-pressed and repackaged for inventory sale.',
      restocked: true
    },
    refundExecution: {
      method: 'Nagad',
      accountNumber: '01611223344',
      trxId: 'NGD982310892',
      disbursedAt: '2026-08-24T15:20:00Z',
      disbursedAmount: 1650,
      disbursedBy: 'Finance Lead (Kisholoy)'
    }
  }
];

export function ReturnsRefundsAdmin() {
  const { orders, products, updateOrderStatus, logAudit, showToast, language } = useApp();
  const isBn = language === 'BN';

  // Persistence for RMA records
  const [rmaList, setRmaList] = useState<RmaRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kisholoy_rma_records');
      return saved ? JSON.parse(saved) : INITIAL_RMA_RECORDS;
    } catch {
      return INITIAL_RMA_RECORDS;
    }
  });

  const saveRmaList = (updated: RmaRecord[]) => {
    setRmaList(updated);
    try {
      localStorage.setItem('kisholoy_rma_records', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'inspections' | 'disbursements' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [inspectModalRma, setInspectModalRma] = useState<RmaRecord | null>(null);
  const [refundModalRma, setRefundModalRma] = useState<RmaRecord | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Inspection form
  const [inspectCondition, setInspectCondition] = useState<'PRISTINE_NEW' | 'OPENED_RESELLABLE' | 'DAMAGED_SCRAP'>('PRISTINE_NEW');
  const [inspectRestock, setInspectRestock] = useState(true);
  const [inspectNotes, setInspectNotes] = useState('');

  // Refund form
  const [refundMethod, setRefundMethod] = useState<'bKash' | 'Nagad' | 'SSLCOMMERZ_REVERSAL' | 'BANK_EFT'>('bKash');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundTrxId, setRefundTrxId] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [sendRefundSms, setSendRefundSms] = useState(true);

  // New RMA creation form
  const [selectedOrderForRma, setSelectedOrderForRma] = useState('');
  const [newRmaReason, setNewRmaReason] = useState<RmaRecord['reason']>('WRONG_SIZE');
  const [newRmaDetails, setNewRmaDetails] = useState('');
  const [printRma, setPrintRma] = useState<RmaRecord | null>(null);

  // Key Metrics
  const activeCasesCount = rmaList.filter(r => r.stage !== 'REFUND_DISBURSED' && r.stage !== 'RESTOCKED' && r.stage !== 'REJECTED').length;
  const pendingInspectionCount = rmaList.filter(r => r.stage === 'REQUESTED' || r.stage === 'PARCEL_RECEIVED').length;
  const pendingRefundCount = rmaList.filter(r => r.stage === 'REFUND_QUEUED' || (r.stage === 'INSPECTED' && r.totalRefundAmount > 0 && r.originalPaymentStatus === 'PAID')).length;
  const totalDisbursedSum = rmaList
    .filter(r => r.stage === 'REFUND_DISBURSED' && r.refundExecution)
    .reduce((sum, r) => sum + (r.refundExecution?.disbursedAmount || 0), 0);

  // Filtered list
  const filteredList = useMemo(() => {
    return rmaList.filter(r => {
      // Tab filter
      if (activeTab === 'inspections') {
        if (r.stage !== 'REQUESTED' && r.stage !== 'PARCEL_RECEIVED') return false;
      } else if (activeTab === 'disbursements') {
        if (r.stage !== 'REFUND_QUEUED' && !(r.stage === 'INSPECTED' && r.totalRefundAmount > 0 && r.originalPaymentStatus === 'PAID')) return false;
      } else if (activeTab === 'completed') {
        if (r.stage !== 'REFUND_DISBURSED' && r.stage !== 'RESTOCKED' && r.stage !== 'REJECTED') return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && r.stage !== statusFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.rmaNumber.toLowerCase().includes(q) ||
          r.orderNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerPhone.includes(q) ||
          r.productTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rmaList, activeTab, statusFilter, searchQuery]);

  // Open Inspection Modal
  const handleOpenInspection = (rma: RmaRecord) => {
    setInspectModalRma(rma);
    setInspectCondition(rma.inspectionResult?.condition || 'PRISTINE_NEW');
    setInspectRestock(rma.inspectionResult ? rma.inspectionResult.restocked : true);
    setInspectNotes(rma.inspectionResult?.notes || 'Inspection completed at Kisholoy Central Fulfillment Hub.');
  };

  // Submit Inspection
  const handleSaveInspection = () => {
    if (!inspectModalRma) return;

    const nextStage = inspectModalRma.originalPaymentStatus === 'PAID' ? 'REFUND_QUEUED' : 'RESTOCKED';

    const updated = rmaList.map(item => {
      if (item.id === inspectModalRma.id) {
        return {
          ...item,
          stage: nextStage,
          inspectionResult: {
            condition: inspectCondition,
            inspectedBy: 'Warehouse Quality Team',
            inspectedAt: new Date().toISOString(),
            notes: inspectNotes,
            restocked: inspectRestock
          }
        };
      }
      return item;
    });

    saveRmaList(updated);
    updateOrderStatus(inspectModalRma.orderId, 'RETURNED', `RMA Inspected (${inspectCondition}). Restock: ${inspectRestock ? 'YES' : 'NO'}`);
    logAudit('INSPECT_RMA', 'Return', inspectModalRma.rmaNumber, `Inspected parcel condition: ${inspectCondition}. Restocked: ${inspectRestock}`);
    showToast(isBn ? 'রিটার্ন পার্সেল ইন্সপেকশন সফলভাবে সম্পন্ন ও স্টক আপডেট হয়েছে।' : 'RMA inspection completed and inventory updated!');
    setInspectModalRma(null);
  };

  // Open Refund Modal
  const handleOpenRefund = (rma: RmaRecord) => {
    setRefundModalRma(rma);
    setRefundAmount(rma.totalRefundAmount);
    setRefundAccount(rma.customerPhone.replace(/[^0-9]/g, ''));
    setRefundTrxId(`TRX-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setRefundMethod(rma.originalPaymentMethod.includes('bKash') ? 'bKash' : rma.originalPaymentMethod.includes('Nagad') ? 'Nagad' : 'SSLCOMMERZ_REVERSAL');
  };

  // Execute Refund
  const handleExecuteRefund = () => {
    if (!refundModalRma) return;

    const updated = rmaList.map(item => {
      if (item.id === refundModalRma.id) {
        return {
          ...item,
          stage: 'REFUND_DISBURSED' as const,
          refundExecution: {
            method: refundMethod,
            accountNumber: refundAccount,
            trxId: refundTrxId,
            disbursedAt: new Date().toISOString(),
            disbursedAmount: refundAmount,
            disbursedBy: 'Finance Desk (Admin)'
          }
        };
      }
      return item;
    });

    saveRmaList(updated);
    logAudit('EXECUTE_REFUND', 'Finance', refundModalRma.rmaNumber, `Disbursed refund ৳${refundAmount} via ${refundMethod} (TrxID: ${refundTrxId})`);
    
    // Simulate SMS notification
    if (sendRefundSms) {
      showToast(isBn ? `৳${refundAmount} রিফান্ড সফল! কাস্টমারকে এসএমএস ভাউচার পাঠানো হয়েছে।` : `Refund of ৳${refundAmount} disbursed! SMS notification sent to customer.`);
    } else {
      showToast(isBn ? `৳${refundAmount} রিফান্ড সফলভাবে সম্পন্ন হয়েছে।` : `Refund of ৳${refundAmount} successfully recorded!`);
    }

    setRefundModalRma(null);
  };

  // Create New RMA
  const handleCreateRma = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(o => o.id === selectedOrderForRma || o.orderNumber === selectedOrderForRma);
    if (!order) {
      showToast(isBn ? 'অনুগ্রহ করে সঠিক অর্ডার নির্বাচন করুন।' : 'Please select a valid order.', 'info');
      return;
    }

    const firstItem = order.items[0];
    const newRecord: RmaRecord = {
      id: `rma-${Date.now()}`,
      rmaNumber: `RMA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      district: order.shippingAddress.district || 'Dhaka',
      requestDate: new Date().toISOString(),
      reason: newRmaReason,
      reasonDetails: newRmaDetails || 'Customer initiated return claim via support desk.',
      productTitle: firstItem ? firstItem.productTitle : 'Ordered Items',
      sku: firstItem ? firstItem.sku : 'SKU-001',
      quantity: firstItem ? firstItem.quantity : 1,
      itemPrice: firstItem ? firstItem.price : order.total,
      totalRefundAmount: order.total,
      originalPaymentMethod: order.paymentMethod,
      originalPaymentStatus: order.paymentStatus,
      stage: 'REQUESTED'
    };

    saveRmaList([newRecord, ...rmaList]);
    updateOrderStatus(order.id, 'RETURN_REQUESTED', `RMA initiated: ${newRecord.rmaNumber}`);
    logAudit('CREATE_RMA', 'Order', newRecord.rmaNumber, `Created return authorization for ${order.orderNumber}`);
    showToast(isBn ? 'নতুন রিটার্ন ও রিফান্ড কেস সফলভাবে নথিভুক্ত হয়েছে।' : `Created new return case: ${newRecord.rmaNumber}`);
    setCreateModalOpen(false);
    setSelectedOrderForRma('');
    setNewRmaDetails('');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['RMA Number', 'Order Number', 'Customer', 'Phone', 'District', 'Product', 'Refund Amount (BDT)', 'Payment Method', 'Stage', 'Date'];
    const rows = rmaList.map(r => [
      r.rmaNumber,
      r.orderNumber,
      `"${r.customerName}"`,
      r.customerPhone,
      r.district,
      `"${r.productTitle}"`,
      r.totalRefundAmount,
      r.originalPaymentMethod,
      r.stage,
      r.requestDate.split('T')[0]
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kisholoy_Returns_Refunds_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Returns & Refunds report exported to CSV');
  };

  return (
    <div id="returns-refunds-admin-container" className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-200">
              {isBn ? 'একত্রিত আরএমএ ও রিফান্ড হাব' : 'UNIFIED RMA & DISBURSEMENT DESK'}
            </span>
            <span className="text-xs text-stone-500 font-mono">v2.0 • Merged Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {isBn ? 'রিটার্ন ও রিফান্ড ব্যবস্থাপনা' : 'Returns & Refunds (RMA) Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            {isBn
              ? 'গ্রাহকদের পণ্য ফেরত নিরীক্ষণ, ওয়্যারহাউস কোয়ালিটি চেকিং ও রিস্টকিং, এবং বিকাশ/নগদ/কার্ডের রিফান্ড অর্থ সরাসরি পরিশোধ করার স্বয়ংসম্পূর্ণ প্ল্যাটফর্ম।'
              : 'Physical parcel intake, warehouse inspection & restock verification, fraud prevention, and bKash/Nagad/Cards financial disbursement.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? '+ নতুন আরএমএ কেস' : '+ Initiate Return Case'}</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl text-xs font-semibold border border-stone-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>{isBn ? 'রিপোর্ট ডাউনলোড (CSV)' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'সক্রিয় আরএমএ কেস' : 'Active Return Cases'}</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-900">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono">
            {activeCasesCount}
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block">
            {isBn ? 'চলমান পার্সেল ও অনুসন্ধান' : 'In transit or pending triage'}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'কোয়ালিটি ইন্সপেকশন অপেক্ষমান' : 'Pending Inspections'}</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900 font-mono">
            {pendingInspectionCount}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-2 block">
            {isBn ? 'ওয়্যারহাউস রিসিভিং কিউ' : 'Awaiting physical hub QC check'}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'রিফান্ড অর্থ প্রদান অপেক্ষমান' : 'Refunds Queued'}</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-800">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-900 font-mono">
            {pendingRefundCount}
          </div>
          <span className="text-[11px] text-rose-700 font-medium mt-2 block">
            {isBn ? 'বিকাশ/নগদ ডিসবার্সমেন্ট প্রস্তুত' : 'Approved, awaiting payment release'}
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'মোট রিফান্ড পরিশোধিত' : 'Total Disbursed'}</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900 font-mono">
            ৳ {totalDisbursedSum.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-2 block">
            {isBn ? '১০০% সফল আর্থিক সেটেলমেন্ট' : 'Settled via gateway or wallet'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isBn ? `সব রেকর্ড (${rmaList.length})` : `All Records (${rmaList.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'inspections'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{isBn ? `ইন্সপেকশন ও রিস্টক (${pendingInspectionCount})` : `RMA Inspection (${pendingInspectionCount})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('disbursements')}
            className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'disbursements'
                ? 'bg-teal-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{isBn ? `রিফান্ড ডিসবার্সমেন্ট (${pendingRefundCount})` : `Refund Disbursements (${pendingRefundCount})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isBn ? 'নিষ্পন্ন ও আর্কাইভ' : 'Completed Archive'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={isBn ? 'আরএমএ #, অর্ডার #, বা ফোন দিয়ে খুঁজুন...' : 'Search RMA #, Order #, Phone...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 bg-stone-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">RMA / Order #</th>
                <th className="p-4">Customer & District</th>
                <th className="p-4">Returned Item & Reason</th>
                <th className="p-4">Refund Amount</th>
                <th className="p-4">RMA Stage</th>
                <th className="p-4">QC / Inventory</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">{isBn ? 'কোন রিটার্ন বা রিফান্ড রেকর্ড খুঁজে পাওয়া যায়নি।' : 'No return or refund records found.'}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{isBn ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।' : 'Try changing your search keywords or filter tab.'}</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((rma) => {
                  const isPendingInspection = rma.stage === 'REQUESTED' || rma.stage === 'PARCEL_RECEIVED';
                  const isPendingRefund = rma.stage === 'REFUND_QUEUED' || (rma.stage === 'INSPECTED' && rma.totalRefundAmount > 0 && rma.originalPaymentStatus === 'PAID');
                  const isCompleted = rma.stage === 'REFUND_DISBURSED' || rma.stage === 'RESTOCKED';

                  return (
                    <tr key={rma.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* RMA / Order # */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{rma.rmaNumber}</span>
                        </div>
                        <Link
                          to={`/admin/orders?search=${encodeURIComponent(rma.orderNumber)}`}
                          className="text-[11px] text-teal-800 hover:underline font-mono block mt-0.5"
                        >
                          Order: {rma.orderNumber}
                        </Link>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {new Date(rma.requestDate).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Customer & District */}
                      <td className="p-4">
                        <span className="font-semibold text-stone-900 block">{rma.customerName}</span>
                        <Link
                          to={`/admin/customers?search=${encodeURIComponent(rma.customerPhone)}`}
                          className="text-stone-500 font-mono text-[11px] hover:text-teal-900 hover:underline"
                        >
                          {rma.customerPhone}
                        </Link>
                        <span className="text-[10px] text-stone-400 block mt-0.5">{rma.district}</span>
                      </td>

                      {/* Item & Reason */}
                      <td className="p-4 max-w-xs">
                        <span className="font-medium text-stone-900 block truncate">{rma.productTitle}</span>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 mt-1">
                          {rma.reason.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5" title={rma.reasonDetails}>
                          {rma.reasonDetails}
                        </p>
                      </td>

                      {/* Amount & Method */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-stone-900 text-sm">
                          ৳ {rma.totalRefundAmount.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-stone-500 block">
                          Orig: {rma.originalPaymentMethod}
                        </span>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          rma.originalPaymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {rma.originalPaymentStatus}
                        </span>
                      </td>

                      {/* RMA Stage */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          rma.stage === 'REFUND_DISBURSED' ? 'bg-emerald-100 text-emerald-900' :
                          rma.stage === 'REFUND_QUEUED' ? 'bg-teal-100 text-teal-900' :
                          rma.stage === 'RESTOCKED' ? 'bg-indigo-100 text-indigo-900' :
                          rma.stage === 'PARCEL_RECEIVED' ? 'bg-amber-100 text-amber-900' :
                          rma.stage === 'REQUESTED' ? 'bg-yellow-100 text-yellow-900' : 'bg-stone-100 text-stone-800'
                        }`}>
                          {rma.stage === 'REFUND_DISBURSED' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          {rma.stage === 'REFUND_QUEUED' && <Wallet className="w-3 h-3 text-teal-700" />}
                          {rma.stage === 'PARCEL_RECEIVED' && <Box className="w-3 h-3 text-amber-700" />}
                          {rma.stage.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* QC / Inventory */}
                      <td className="p-4">
                        {rma.inspectionResult ? (
                          <div>
                            <span className={`font-semibold text-[10px] block ${
                              rma.inspectionResult.condition === 'DAMAGED_SCRAP' ? 'text-rose-700' : 'text-emerald-800'
                            }`}>
                              {rma.inspectionResult.condition.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] text-stone-500 block">
                              Restocked: {rma.inspectionResult.restocked ? 'Yes (Inventory +1)' : 'No (Scrap loss)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[10px] italic">Not inspected yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Document */}
                          <button
                            onClick={() => setPrintRma(rma)}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                            title="Print Return / Refund Document (one PDF)"
                          >
                            <Printer className="w-3 h-3 text-teal-300" />
                            <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
                          </button>

                          {/* Inspect Button */}
                          {isPendingInspection && (
                            <button
                              onClick={() => handleOpenInspection(rma)}
                              className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                            >
                              <Box className="w-3 h-3" />
                              <span>{isBn ? 'ইন্সপেকশন করুন' : 'Inspect'}</span>
                            </button>
                          )}

                          {/* Disburse Refund Button */}
                          {isPendingRefund && (
                            <button
                              onClick={() => handleOpenRefund(rma)}
                              className="px-2.5 py-1 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>{isBn ? 'রিফান্ড প্রদান করুন' : 'Disburse Refund'}</span>
                            </button>
                          )}

                          {/* View Summary */}
                          {isCompleted && (
                            <button
                              onClick={() => handleOpenInspection(rma)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{isBn ? 'বিবরণ' : 'Dossier'}</span>
                            </button>
                          )}
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

      {/* MODAL 1: RMA Physical Inspection & QC */}
      {inspectModalRma && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider font-mono">
                  {inspectModalRma.rmaNumber}
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {isBn ? 'ওয়্যারহাউস কোয়ালিটি ইন্সপেকশন' : 'Warehouse QC & Restock Triage'}
                </h3>
              </div>
              <button
                onClick={() => setInspectModalRma(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Item:</span>
                <span className="font-bold text-stone-900">{inspectModalRma.productTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Customer Claim:</span>
                <span className="font-semibold text-stone-800">{inspectModalRma.reason.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Claim Details:</span>
                <span className="text-stone-600">{inspectModalRma.reasonDetails}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-900 block mb-1.5">
                  {isBn ? 'পণ্যটির শারীরিক অবস্থা (Physical Condition):' : 'Item Physical Condition:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectCondition('PRISTINE_NEW')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      inspectCondition === 'PRISTINE_NEW'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">✨</span>
                    <span>Pristine / Unopened</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectCondition('OPENED_RESELLABLE')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      inspectCondition === 'OPENED_RESELLABLE'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">📦</span>
                    <span>Opened Resellable</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectCondition('DAMAGED_SCRAP')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      inspectCondition === 'DAMAGED_SCRAP'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">⚠️</span>
                    <span>Defective / Scrap</span>
                  </button>
                </div>
              </div>

              {/* Restock checkbox */}
              <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  id="restock-checkbox"
                  checked={inspectRestock}
                  onChange={(e) => setInspectRestock(e.target.checked)}
                  className="rounded text-teal-800 focus:ring-teal-800 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="restock-checkbox" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  {isBn ? 'ইনভেন্টরিতে স্টক পুনর্বহাল (Restock +1 to SKU inventory)' : 'Return item back to active warehouse stock (+1 SKU inventory)'}
                </label>
              </div>

              {/* Inspector notes */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'ইন্সপেকশন মন্তব্য ও অডিট নোট:' : 'Inspection & Quality Notes:'}
                </label>
                <textarea
                  rows={3}
                  value={inspectNotes}
                  onChange={(e) => setInspectNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800"
                  placeholder="Note tags condition, smell, cleanliness, or specific tear location..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setInspectModalRma(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveInspection}
                className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isBn ? 'ইন্সপেকশন অনুমোদন করুন' : 'Approve QC & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Execute Refund Disbursement */}
      {refundModalRma && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider font-mono">
                  {refundModalRma.rmaNumber} • ORDER {refundModalRma.orderNumber}
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {isBn ? 'রিফান্ড অর্থ প্রদান সম্পন্ন করুন' : 'Disburse Customer Refund'}
                </h3>
              </div>
              <button
                onClick={() => setRefundModalRma(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-teal-900">Beneficiary Customer:</span>
                <span className="font-bold text-teal-950">{refundModalRma.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-900">Original Gateway:</span>
                <span className="font-semibold text-teal-950">{refundModalRma.originalPaymentMethod}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-teal-900 font-sans">Authorized Refund Total:</span>
                <span className="font-bold text-teal-950 text-sm">৳ {refundModalRma.totalRefundAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Method selector */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'রিফান্ড প্রদানের মাধ্যম (Disbursement Gateway):' : 'Payout Method / Gateway:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['bKash', 'Nagad', 'SSLCOMMERZ_REVERSAL', 'BANK_EFT'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRefundMethod(m)}
                      className={`p-2 rounded-lg border text-center font-bold text-[11px] transition-colors ${
                        refundMethod === m
                          ? 'border-teal-900 bg-teal-900 text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {m === 'SSLCOMMERZ_REVERSAL' ? 'Card Reversal' : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-900 block mb-1">
                    {isBn ? 'গ্রাহকের ওয়ালেট বা একাউন্ট নম্বর:' : 'Customer Wallet / Acc Number:'}
                  </label>
                  <input
                    type="text"
                    value={refundAccount}
                    onChange={(e) => setRefundAccount(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono"
                    placeholder="017xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-900 block mb-1">
                    {isBn ? 'রিফান্ড ট্রানজাকশন আইডি (TrxID):' : 'Disbursement TrxID / Ref:'}
                  </label>
                  <input
                    type="text"
                    value={refundTrxId}
                    onChange={(e) => setRefundTrxId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono"
                    placeholder="e.g. TRX-982104"
                  />
                </div>
              </div>

              {/* Refund amount */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'পরিশোধের পরিমাণ (BDT):' : 'Amount to Disburse (BDT):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-mono font-bold">৳</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full text-xs pl-7 pr-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono font-bold text-stone-900"
                  />
                </div>
              </div>

              {/* SMS checkbox */}
              <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  id="sms-checkbox"
                  checked={sendRefundSms}
                  onChange={(e) => setSendRefundSms(e.target.checked)}
                  className="rounded text-teal-800 focus:ring-teal-800 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sms-checkbox" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  {isBn ? 'গ্রাহককে স্বয়ংক্রিয় এসএমএস ও ইন-অ্যাপ নিশ্চিতকরণ পাঠান' : 'Dispatch automated SMS voucher and in-app notification to customer'}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setRefundModalRma(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isBn ? 'রিফান্ড চূড়ান্ত করুন ও অর্থ প্রেরণ' : 'Authorize & Disburse Refund'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create New RMA Case */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateRma} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                {isBn ? 'নতুন রিটার্ন কেস নথিবদ্ধ করুন' : 'Initiate New Return / RMA Case'}
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'অর্ডার নির্বাচন করুন:' : 'Select Associated Order:'}
                </label>
                <select
                  value={selectedOrderForRma}
                  onChange={(e) => setSelectedOrderForRma(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 bg-stone-50"
                >
                  <option value="">-- Choose Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer.name} (৳{o.total}) [{o.orderStatus}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'ফেরতের প্রধান কারণ:' : 'Primary Reason for Return:'}
                </label>
                <select
                  value={newRmaReason}
                  onChange={(e) => setNewRmaReason(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 bg-stone-50"
                >
                  <option value="WRONG_SIZE">Wrong Size / Measurement Issue</option>
                  <option value="DEFECTIVE_PRODUCT">Defective / Damaged Product</option>
                  <option value="WRONG_ITEM_SENT">Incorrect Item Dispatched</option>
                  <option value="COLOR_MISMATCH">Color or Shade Mismatch</option>
                  <option value="COURIER_RETURNED">Courier Delivery Failed (Return to Hub)</option>
                  <option value="CHANGED_MIND">Customer Changed Mind</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'বিস্তারিত কারণ ও নোট:' : 'Details & Customer Communication:'}
                </label>
                <textarea
                  rows={3}
                  value={newRmaDetails}
                  onChange={(e) => setNewRmaDetails(e.target.value)}
                  placeholder="Explain customer issue, size required, or packaging damage notes..."
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isBn ? 'কেস তৈরি করুন' : 'Create Return Case'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unified Return / Refund Document Print Modal */}
      {printRma && (
        <ReturnRefundPrintModal
          rma={printRma}
          onClose={() => setPrintRma(null)}
        />
      )}
    </div>
  );
}
