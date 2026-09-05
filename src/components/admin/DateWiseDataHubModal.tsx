/**
 * @file src/components/admin/DateWiseDataHubModal.tsx
 * @description Master Date-wise Analytics, Filtering, Export & Import Hub for KISHOLOY Admin.
 * Enables granular date-wise exploration across Orders, Finance, Inventory Batches, Suppliers, Audit Logs, and Returns.
 */

import React, { useState, useMemo } from 'react';
import { 
  X, Calendar, Download, Upload, FileSpreadsheet, FileText, 
  BarChart3, RefreshCw, Layers, CheckCircle2, AlertCircle, 
  Search, ArrowRight, DollarSign, ShoppingCart, Landmark, 
  Package, Truck, ShieldCheck, Users, Filter, Check, Eye,
  Clock, TrendingUp, Sparkles, AlertTriangle, FileUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  Order, 
  SettlementRecord, 
  InventoryTransaction, 
  AuditLog, 
  CustomerReturnRequest,
  ExpenseRecord 
} from '../../types';
import { 
  DateFilterConfig, 
  DateFilterPreset, 
  getDateRangeBounds, 
  filterItemsByDate,
  aggregateDataByTimeInterval,
  exportToExcel, 
  exportToCsv,
  parseImportFile,
  formatDateDisplay,
  toBanglaDigits,
  BANGLA_MONTHS,
  ENGLISH_MONTHS,
  AVAILABLE_YEARS
} from '../../utils/dateFilterUtils';
import { DateRangeFilterBar } from './DateRangeFilterBar';
import { useModalA11y } from '../../hooks/useModalA11y';

interface DateWiseDataHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDomain?: 'ORDERS' | 'FINANCE' | 'INVENTORY' | 'SUPPLIERS' | 'AUDIT' | 'RETURNS' | 'IMPORT';
}

export function DateWiseDataHubModal({
  isOpen,
  onClose,
  initialDomain = 'ORDERS'
}: DateWiseDataHubModalProps) {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Date Wise Data Hub',
  });

  const { 
    orders, 
    settlements, 
    products, 
    inventoryTransactions, 
    auditLogs, 
    returnRequests,
    expenses,
    showToast,
    language 
  } = useApp();

  const isBn = language === 'BN';

  // Active domain tab
  const [activeDomain, setActiveDomain] = useState<'ORDERS' | 'FINANCE' | 'INVENTORY' | 'SUPPLIERS' | 'AUDIT' | 'RETURNS' | 'IMPORT'>(initialDomain);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterConfig>({
    preset: 'THIS_MONTH',
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(),
  });

  // Search filter within domain
  const [searchTerm, setSearchTerm] = useState('');

  // Time aggregation mode for trend view
  const [aggregationInterval, setAggregationInterval] = useState<'day' | 'week' | 'month' | 'year'>('day');

  // Universal Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    file: File | null;
    data: any[];
    headers: string[];
    totalRows: number;
    detectedDateColumns: string[];
    targetDomain: string;
  } | null>(null);

  if (!isOpen) return null;

  const dateBounds = getDateRangeBounds(dateFilter);

  // 1. FILTERED ORDERS
  const filteredOrders = useMemo(() => {
    const list = filterItemsByDate<Order>(orders, (o: Order) => o.createdAt, dateFilter);
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((o: Order) => 
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(q) ||
      o.paymentMethod?.toLowerCase().includes(q)
    );
  }, [orders, dateFilter, searchTerm]);

  // Orders Aggregation & KPIs
  const ordersGrossRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0), [filteredOrders]);
  const ordersAov = filteredOrders.length > 0 ? Math.round(ordersGrossRevenue / filteredOrders.length) : 0;
  const ordersCodCount = filteredOrders.filter(o => o.paymentMethod === 'COD').length;
  const ordersOnlineCount = filteredOrders.length - ordersCodCount;

  // 2. FILTERED SETTLEMENTS & FINANCE
  const filteredSettlements = useMemo(() => {
    const list = filterItemsByDate<SettlementRecord>(settlements, (s: SettlementRecord) => s.periodStart || (s as any).createdAt, dateFilter);
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((s: SettlementRecord) => 
      s.batchNumber.toLowerCase().includes(q) ||
      s.gateway.toLowerCase().includes(q) ||
      s.bankAccount.toLowerCase().includes(q)
    );
  }, [settlements, dateFilter, searchTerm]);

  const settlementsTotalGross = useMemo(() => filteredSettlements.reduce((sum, s) => sum + (s.grossAmount || 0), 0), [filteredSettlements]);
  const settlementsTotalNet = useMemo(() => filteredSettlements.reduce((sum, s) => sum + (s.netPayout || 0), 0), [filteredSettlements]);
  const settlementsTotalFees = useMemo(() => filteredSettlements.reduce((sum, s) => sum + (s.gatewayFee || 0), 0), [filteredSettlements]);

  // 3. FILTERED INVENTORY TRANSACTIONS
  const filteredInventory = useMemo(() => {
    const list = filterItemsByDate<InventoryTransaction>(inventoryTransactions || [], (t: InventoryTransaction) => (t as any).timestamp || (t as any).createdAt || '', dateFilter);
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((t: InventoryTransaction) => 
      (t.batchNumber || '').toLowerCase().includes(q) ||
      (t.operator || '').toLowerCase().includes(q) ||
      (t.reason || '').toLowerCase().includes(q) ||
      (t.warehouseLocation || '').toLowerCase().includes(q)
    );
  }, [inventoryTransactions, dateFilter, searchTerm]);

  // 4. FILTERED AUDIT LOGS
  const filteredAuditLogs = useMemo(() => {
    const list = filterItemsByDate<AuditLog>(auditLogs, (l: AuditLog) => l.timestamp, dateFilter);
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((l: AuditLog) => 
      l.action.toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.operator || '').toLowerCase().includes(q) ||
      (l.category || '').toLowerCase().includes(q)
    );
  }, [auditLogs, dateFilter, searchTerm]);

  // 5. FILTERED RETURN REQUESTS
  const filteredReturns = useMemo(() => {
    const list = filterItemsByDate<CustomerReturnRequest>(returnRequests || [], (r: CustomerReturnRequest) => r.createdAt, dateFilter);
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((r: CustomerReturnRequest) => 
      (r.requestNumber || (r as any).id || '').toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q)
    );
  }, [returnRequests, dateFilter, searchTerm]);

  // Time-Series Aggregations for Charting & Analysis
  const salesTimeTrend = useMemo(() => {
    return aggregateDataByTimeInterval<Order>(
      filteredOrders,
      (o: Order) => o.createdAt,
      (o: Order) => o.total || 0,
      aggregationInterval
    );
  }, [filteredOrders, aggregationInterval]);

  // Export handlers per active domain
  const handleExportDomainExcel = () => {
    let exportRows: Record<string, any>[] = [];
    let filePrefix = 'Kisholoy';

    if (activeDomain === 'ORDERS') {
      filePrefix = 'Kisholoy_Orders_Ledger';
      exportRows = filteredOrders.map((o) => ({
        'Order Number': o.orderNumber,
        'Order Date': o.createdAt ? new Date(o.createdAt).toLocaleString('en-GB') : '',
        'Customer Name': o.customer?.name || '',
        'Customer Phone': o.customer?.phone || '',
        'District': o.shippingAddress?.district || (o.customer as any)?.district || '',
        'Items Count': o.items?.length || 0,
        'Payment Method': o.paymentMethod,
        'Payment Status': o.paymentStatus,
        'Delivery Status': o.orderStatus,
        'Subtotal (BDT)': o.subtotal,
        'Delivery Charge (BDT)': o.shippingFee || (o as any).deliveryCharge || 0,
        'Discount (BDT)': o.discount || 0,
        'Grand Total (BDT)': o.total,
        'Fraud Risk Score': o.fraudRisk?.riskScore || 0,
      }));
    } else if (activeDomain === 'FINANCE') {
      filePrefix = 'Kisholoy_Gateway_Settlements';
      exportRows = filteredSettlements.map((s) => ({
        'Batch Number': s.batchNumber,
        'Period Start': s.periodStart ? new Date(s.periodStart).toLocaleString('en-GB') : '',
        'Period End': s.periodEnd ? new Date(s.periodEnd).toLocaleString('en-GB') : '',
        'Gateway': s.gateway,
        'Bank Account': s.bankAccount,
        'Status': s.status,
        'Gross Amount (BDT)': s.grossAmount,
        'Gateway Fee (BDT)': s.gatewayFee,
        'Net Payout (BDT)': s.netPayout,
        'UTR / Ref Number': s.utrOrReference || '',
        'Transactions Count': s.totalOrders || 0,
      }));
    } else if (activeDomain === 'INVENTORY') {
      filePrefix = 'Kisholoy_Inventory_Transactions';
      exportRows = filteredInventory.map((t) => ({
        'Timestamp': (t as any).timestamp || (t as any).createdAt || '',
        'Product ID': t.productId,
        'Transaction Type': t.type,
        'Quantity Change': t.quantityChange,
        'Quantity Before': t.quantityBefore,
        'Quantity After': t.quantityAfter,
        'Operator': t.operator,
        'Warehouse Location': t.warehouseLocation || '',
        'Batch Number': t.batchNumber || '',
        'Reason': t.reason,
      }));
    } else if (activeDomain === 'AUDIT') {
      filePrefix = 'Kisholoy_Cryptographic_Audit_Logs';
      exportRows = filteredAuditLogs.map((l) => ({
        'Timestamp': l.timestamp,
        'Category': l.category || '',
        'Action': l.action,
        'Operator': l.operator,
        'IP Address': l.ipAddress || '127.0.0.1',
        'Details': l.details,
        'Severity': l.severity || 'INFO',
        'Block Hash': l.currentHash || '',
      }));
    } else if (activeDomain === 'RETURNS') {
      filePrefix = 'Kisholoy_RMA_Returns';
      exportRows = filteredReturns.map((r) => ({
        'RMA Request #': r.requestNumber || r.id,
        'Request Date': r.createdAt,
        'Order Number': r.orderNumber,
        'Reason': r.reason || '',
        'Status': r.status,
        'Refund Amount (BDT)': (r as any).refundAmount || 0,
      }));
    }

    if (exportRows.length === 0) {
      showToast(isBn ? 'এক্সপোর্ট করার মতো কোনো রেকর্ড পাওয়া যায়নি' : 'No records found for the selected date range.');
      return;
    }

    exportToExcel(exportRows, activeDomain, filePrefix, dateFilter);
    showToast(isBn ? `সফলভাবে ${toBanglaDigits(exportRows.length)}টি রেকর্ড এক্সেল ফরম্যাটে এক্সপোর্ট হয়েছে` : `Exported ${exportRows.length} records to Excel successfully.`);
  };

  const handleExportDomainCsv = () => {
    let exportRows: Record<string, any>[] = [];
    let filePrefix = 'Kisholoy';

    if (activeDomain === 'ORDERS') {
      filePrefix = 'Kisholoy_Orders';
      exportRows = filteredOrders.map((o) => ({
        'Order Number': o.orderNumber,
        'Date': o.createdAt,
        'Customer': o.customer?.name,
        'Phone': o.customer?.phone,
        'Total (BDT)': o.total,
        'Payment': o.paymentMethod,
        'Status': o.orderStatus,
      }));
    } else if (activeDomain === 'FINANCE') {
      filePrefix = 'Kisholoy_Settlements';
      exportRows = filteredSettlements.map((s) => ({
        'Batch': s.batchNumber,
        'Period': s.periodStart,
        'Gateway': s.gateway,
        'Gross (BDT)': s.grossAmount,
        'Fee (BDT)': s.gatewayFee,
        'Net (BDT)': s.netPayout,
        'Status': s.status,
      }));
    } else if (activeDomain === 'AUDIT') {
      filePrefix = 'Kisholoy_Audit';
      exportRows = filteredAuditLogs.map((l) => ({
        'Timestamp': l.timestamp,
        'Operator': l.operator,
        'Action': l.action,
        'Details': l.details,
      }));
    }

    if (exportRows.length === 0) return;
    exportToCsv(exportRows, filePrefix, dateFilter);
    showToast(isBn ? 'CSV ফরম্যাটে এক্সপোর্ট সফল হয়েছে' : 'CSV Export completed.');
  };

  // File Upload parser for Universal Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const parsed = await parseImportFile(file);
    setImporting(false);

    if (parsed.success) {
      setImportResult({
        file,
        data: parsed.data,
        headers: parsed.headers,
        totalRows: parsed.totalRows,
        detectedDateColumns: parsed.detectedDateColumns,
        targetDomain: 'ORDERS',
      });
      showToast(isBn ? `${toBanglaDigits(parsed.totalRows)}টি রেকর্ড সফলভাবে পার্স হয়েছে` : `Parsed ${parsed.totalRows} rows from ${file.name}.`);
    } else {
      showToast(parsed.error || 'Failed to parse file.', 'info');
    }
  };

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-750 text-stone-100 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-950 text-teal-300 border border-teal-800/80 shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-white">
                  {isBn ? 'ডেট-ওয়াইজ এনালিসিস ও মাস্টার এক্সপোর্ট/ইমপোর্ট হাব' : 'Date-Wise Analytics & Master Import/Export Hub'}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800/80">
                  {isBn ? 'সর্বজনীন ডেটা হাব' : 'UNIVERSAL'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {isBn 
                  ? 'সাল, মাস, সপ্তাহ বা কাস্টম তারিখ অনুযায়ী প্রতিটি ডিপার্টমেন্টের হিসাব-নিকাশ, বিশ্লেষণ ও এক্সেল রিপোর্ট ডাউনলোড করুন।'
                  : 'Multi-dimensional date filtering, time-interval aggregations, and high-fidelity XLSX/CSV export & import.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Universal Date Range Filter Bar */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800">
          <DateRangeFilterBar
            value={dateFilter}
            onChange={setDateFilter}
            onExportExcel={handleExportDomainExcel}
            onExportCsv={handleExportDomainCsv}
            totalFilteredCount={
              activeDomain === 'ORDERS' ? filteredOrders.length :
              activeDomain === 'FINANCE' ? filteredSettlements.length :
              activeDomain === 'INVENTORY' ? filteredInventory.length :
              activeDomain === 'AUDIT' ? filteredAuditLogs.length :
              filteredReturns.length
            }
            totalUnfilteredCount={
              activeDomain === 'ORDERS' ? orders.length :
              activeDomain === 'FINANCE' ? settlements.length :
              activeDomain === 'INVENTORY' ? (inventoryTransactions || []).length :
              activeDomain === 'AUDIT' ? auditLogs.length :
              (returnRequests || []).length
            }
          />
        </div>

        {/* Domain Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-950/40 border-b border-stone-800 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveDomain('ORDERS')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeDomain === 'ORDERS'
                ? 'bg-teal-900 text-white shadow-xs border border-teal-700'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-teal-400" />
            <span>{isBn ? 'অর্ডার ও বিক্রি' : 'Orders & Sales'}</span>
            <span className="px-1.5 py-0.2 bg-teal-950 rounded-md font-mono text-[10px] text-teal-300">
              {filteredOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDomain('FINANCE')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeDomain === 'FINANCE'
                ? 'bg-amber-900 text-white shadow-xs border border-amber-700'
                : 'text-stone-400 hover:text-amber-300 hover:bg-stone-850'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>{isBn ? 'সেটেলমেন্ট ও লেজার' : 'Settlements & Payouts'}</span>
            <span className="px-1.5 py-0.2 bg-amber-950 rounded-md font-mono text-[10px] text-amber-300">
              {filteredSettlements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDomain('INVENTORY')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeDomain === 'INVENTORY'
                ? 'bg-emerald-900 text-white shadow-xs border border-emerald-700'
                : 'text-stone-400 hover:text-emerald-300 hover:bg-stone-850'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isBn ? 'ইনভেন্টরি লেনদেন ও স্টক' : 'Inventory Movements'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-950 rounded-md font-mono text-[10px] text-emerald-300">
              {filteredInventory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDomain('AUDIT')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeDomain === 'AUDIT'
                ? 'bg-rose-900 text-white shadow-xs border border-rose-700'
                : 'text-stone-400 hover:text-rose-300 hover:bg-stone-850'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>{isBn ? 'অডিট ও নিরাপত্তা লগ' : 'Audit Logs'}</span>
            <span className="px-1.5 py-0.2 bg-rose-950 rounded-md font-mono text-[10px] text-rose-300">
              {filteredAuditLogs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDomain('RETURNS')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeDomain === 'RETURNS'
                ? 'bg-purple-900 text-white shadow-xs border border-purple-700'
                : 'text-stone-400 hover:text-purple-300 hover:bg-stone-850'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-purple-400" />
            <span>{isBn ? 'রিটার্ন ও আরএমএ' : 'Returns (RMA)'}</span>
            <span className="px-1.5 py-0.2 bg-purple-950 rounded-md font-mono text-[10px] text-purple-300">
              {filteredReturns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDomain('IMPORT')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all shrink-0 ml-auto ${
              activeDomain === 'IMPORT'
                ? 'bg-teal-800 text-white shadow-xs border border-teal-600'
                : 'bg-stone-850 text-teal-300 hover:bg-stone-800 border border-teal-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isBn ? 'ইউনিভার্সাল ইমপোর্ট' : 'Universal Import'}</span>
          </button>
        </div>

        {/* Modal Body & Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          
          {/* DOMAIN 1: ORDERS & SALES ANALYTICS */}
          {activeDomain === 'ORDERS' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'মোট বিক্রয় (Gross Revenue)' : 'Gross Revenue'}
                  </span>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-teal-400 mt-1">
                    ৳{ordersGrossRevenue.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    {dateBounds.labelEn}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'অর্ডার সংখ্যা (Total Orders)' : 'Total Orders'}
                  </span>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-white mt-1">
                    {filteredOrders.length.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    {isBn ? `গড় বাস্কেট ৳${ordersAov.toLocaleString()}` : `AOV ৳${ordersAov.toLocaleString()}`}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'পেমেন্ট মাধ্যম অনুপাত' : 'Payment Split'}
                  </span>
                  <div className="text-sm sm:text-base font-bold text-stone-200 mt-1">
                    {ordersCodCount} COD &bull; {ordersOnlineCount} Online
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1 block font-mono">
                    {filteredOrders.length > 0 ? `${Math.round((ordersCodCount / filteredOrders.length) * 100)}% COD Share` : '0%'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'কুইক এক্সপোর্ট' : 'Quick Actions'}
                  </span>
                  <button
                    type="button"
                    onClick={handleExportDomainExcel}
                    className="w-full py-2 rounded-xl bg-teal-900 hover:bg-teal-850 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBn ? 'এক্সেল ডাউনলোড' : 'Download Orders Excel'}</span>
                  </button>
                </div>
              </div>

              {/* Time-Series Trend Breakdown */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <span>{isBn ? 'টাইমলাইন ভিত্তিক সেলস বিশ্লেষণ' : 'Timeline Sales Aggregation'}</span>
                  </h4>

                  {/* Interval switch */}
                  <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-[10px] font-mono">
                    {(['day', 'week', 'month', 'year'] as const).map((int) => (
                      <button
                        key={int}
                        type="button"
                        onClick={() => setAggregationInterval(int)}
                        className={`px-2 py-0.5 rounded-lg capitalize font-bold transition-colors ${
                          aggregationInterval === int
                            ? 'bg-teal-800 text-white'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aggregated Buckets Table / Bar Representation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
                  {salesTimeTrend.map((bucket, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                      <span className="text-[10px] text-stone-400 font-mono block truncate">{bucket.period}</span>
                      <div className="text-sm font-bold font-mono text-teal-300 mt-0.5">৳{bucket.totalValue.toLocaleString()}</div>
                      <span className="text-[9px] text-stone-500 font-mono">{bucket.count} orders</span>
                    </div>
                  ))}
                  {salesTimeTrend.length === 0 && (
                    <div className="col-span-full py-6 text-center text-stone-500 text-xs">
                      No sales recorded within this date boundary.
                    </div>
                  )}
                </div>
              </div>

              {/* Search & Orders Data Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={isBn ? 'অর্ডার নং, নাম বা ফোন খুঁজুন...' : 'Search by order #, name, phone...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-teal-700"
                    />
                  </div>
                  <span className="text-xs text-stone-400 font-mono">
                    {filteredOrders.length} records matched
                  </span>
                </div>

                <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-950">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-900 text-stone-400 border-b border-stone-800 sticky top-0 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-3">Order #</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-850 font-sans">
                        {filteredOrders.slice(0, 50).map((o) => (
                          <tr key={o.id} className="hover:bg-stone-900/50 transition-colors">
                            <td className="p-3 font-mono font-bold text-teal-300">{o.orderNumber}</td>
                            <td className="p-3 text-stone-400 text-[11px]">
                              {formatDateDisplay(o.createdAt, isBn, true)}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-stone-200">{o.customer?.name}</div>
                              <div className="text-[10px] text-stone-500 font-mono">{o.customer?.phone}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-stone-800 text-stone-300">
                                {o.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-teal-950 text-teal-300 border border-teal-800">
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-stone-100">
                              ৳{o.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* DOMAIN 2: FINANCE & SETTLEMENTS */}
          {activeDomain === 'FINANCE' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'মোট গ্রস সেটেলমেন্ট' : 'Gross Settlement Volume'}
                  </span>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-amber-400 mt-1">
                    ৳{settlementsTotalGross.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'নেট ব্যাংক পেআউট' : 'Net Bank Payouts'}
                  </span>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                    ৳{settlementsTotalNet.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'গেটওয়ে চার্জ / ফি' : 'Total Gateway Fees'}
                  </span>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-rose-400 mt-1">
                    ৳{settlementsTotalFees.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                    {isBn ? 'সেটেলমেন্ট এক্সপোর্ট' : 'Export Finance'}
                  </span>
                  <button
                    type="button"
                    onClick={handleExportDomainExcel}
                    className="w-full py-2 rounded-xl bg-amber-900 hover:bg-amber-850 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সেটেলমেন্ট এক্সেল' : 'Export Ledger Sheet'}</span>
                  </button>
                </div>
              </div>

              {/* Settlements Table */}
              <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-950">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-stone-400 border-b border-stone-800 sticky top-0 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Batch #</th>
                        <th className="p-3">Period</th>
                        <th className="p-3">Gateway</th>
                        <th className="p-3">Bank Account</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Gross (BDT)</th>
                        <th className="p-3 text-right">Net Payout (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredSettlements.map((s) => (
                        <tr key={s.id} className="hover:bg-stone-900/50">
                          <td className="p-3 font-mono font-bold text-amber-300">{s.batchNumber}</td>
                          <td className="p-3 text-stone-400 text-[11px]">{formatDateDisplay(s.periodStart || (s as any).createdAt, isBn, true)}</td>
                          <td className="p-3 font-semibold text-stone-200">{s.gateway}</td>
                          <td className="p-3 text-stone-400 font-mono text-[11px]">{s.bankAccount}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                              s.status === 'SETTLED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-stone-300">৳{s.grossAmount.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-300">৳{s.netPayout.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* DOMAIN 3: INVENTORY TRANSACTIONS */}
          {activeDomain === 'INVENTORY' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {isBn ? 'তারিখ অনুযায়ী ইনভেন্টরি লেনদেন ও স্টক মুভমেন্ট' : 'Inventory Stock Movements Timeline'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isBn ? `চিহ্নিত সময়সীমার মধ্যে মোট ${toBanglaDigits(filteredInventory.length)}টি স্টক পরিবর্তন রেকর্ড করা হয়েছে।` : `Filtered ${filteredInventory.length} inventory transaction records.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDomainExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-850 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ইনভেন্টরি এক্সপোর্ট' : 'Export Stock Ledger'}</span>
                </button>
              </div>

              <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-950">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-stone-400 border-b border-stone-800 sticky top-0 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Quantity Delta</th>
                        <th className="p-3">Operator</th>
                        <th className="p-3">Location / Batch</th>
                        <th className="p-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredInventory.map((t, idx) => (
                        <tr key={(t as any).id || idx} className="hover:bg-stone-900/50">
                          <td className="p-3 text-stone-400 text-[11px]">{formatDateDisplay((t as any).timestamp || (t as any).createdAt, isBn, true)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-teal-950 text-teal-300 border border-teal-800">
                              {t.type}
                            </span>
                          </td>
                          <td className={`p-3 font-mono font-bold ${t.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange}
                          </td>
                          <td className="p-3 text-stone-300 font-semibold">{t.operator}</td>
                          <td className="p-3 font-mono text-[11px] text-stone-400">{t.warehouseLocation || t.batchNumber || '-'}</td>
                          <td className="p-3 text-stone-300 text-xs">{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DOMAIN 4: AUDIT LOGS */}
          {activeDomain === 'AUDIT' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {isBn ? 'ক্রিপ্টোগ্রাফিক অডিট লগ ও সিকিউরিটি ইভেন্ট' : 'Cryptographic Audit Ledger Timeline'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isBn ? `চিহ্নিত সময়সীমার মধ্যে মোট ${toBanglaDigits(filteredAuditLogs.length)}টি সিকিউরিটি ও অ্যাডমিন লগ সংরক্ষিত হয়েছে।` : `Filtered ${filteredAuditLogs.length} audit logs in current scope.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDomainExcel}
                  className="px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-850 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isBn ? 'অডিট এক্সপোর্ট' : 'Export Audit Trail'}</span>
                </button>
              </div>

              <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-950">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-stone-400 border-b border-stone-800 sticky top-0 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Operator</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 font-mono text-[11px]">
                      {filteredAuditLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-stone-900/50">
                          <td className="p-3 text-stone-400">{formatDateDisplay(l.timestamp, isBn, true)}</td>
                          <td className="p-3 font-bold text-rose-300">{l.action}</td>
                          <td className="p-3 text-stone-300">{l.category || 'SYSTEM'}</td>
                          <td className="p-3 text-teal-300">{l.operator}</td>
                          <td className="p-3 text-stone-300 font-sans text-xs">{l.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DOMAIN 5: RETURNS & RMA */}
          {activeDomain === 'RETURNS' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {isBn ? 'গ্রাহক রিটার্ন ও রিফান্ড (RMA) টাইমলাইন' : 'Customer Returns & RMA Timeline'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isBn ? `চিহ্নিত সময়সীমার মধ্যে ${toBanglaDigits(filteredReturns.length)}টি রিটার্ন অনুরোধ পাওয়া গেছে।` : `Filtered ${filteredReturns.length} return requests.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDomainExcel}
                  className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-850 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isBn ? 'রিটার্ন এক্সপোর্ট' : 'Export RMA Sheet'}</span>
                </button>
              </div>

              <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-950">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-stone-400 border-b border-stone-800 sticky top-0 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-3">RMA #</th>
                        <th className="p-3">Request Date</th>
                        <th className="p-3">Order Number</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredReturns.map((r) => (
                        <tr key={r.id} className="hover:bg-stone-900/50">
                          <td className="p-3 font-mono font-bold text-purple-300">{r.requestNumber || r.id}</td>
                          <td className="p-3 text-stone-400 text-[11px]">{formatDateDisplay(r.createdAt, isBn, true)}</td>
                          <td className="p-3 font-mono text-teal-300">{r.orderNumber}</td>
                          <td className="p-3 text-stone-200 font-semibold">{r.customerName || '-'}</td>
                          <td className="p-3 text-stone-400">{r.reason || '-'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                              {r.status}
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

          {/* DOMAIN 6: UNIVERSAL BULK IMPORT */}
          {activeDomain === 'IMPORT' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 text-teal-300 flex items-center justify-center mx-auto shadow-xs">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="font-serif font-bold text-base text-white">
                    {isBn ? 'এক্সেল বা সিএসভি ডেটা ইমপোর্ট করুন' : 'Import Excel (.xlsx) or CSV Data File'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    {isBn 
                      ? 'অর্ডার, সেটেলমেন্ট, ইনভেন্টরি ব্যাচ বা সাপ্লায়ার রেকর্ড আপলোড করুন। সিস্টেম স্বয়ংক্রিয়ভাবে তারিখ ফিল্ডগুলো যাচাই করবে।'
                      : 'Upload historical datasets. Date columns (DD/MM/YYYY, ISO, YYYY-MM-DD) are detected and validated automatically.'}
                  </p>
                </div>

                <div className="flex justify-center">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-900 hover:bg-teal-800 text-white font-bold text-xs transition-colors shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>{importing ? (isBn ? 'পার্সিং হচ্ছে...' : 'Parsing File...') : (isBn ? 'ফাইল সিলেক্ট করুন (.xlsx, .csv)' : 'Select Data File (.xlsx, .csv)')}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={importing}
                    />
                  </label>
                </div>
              </div>

              {/* Import Preview if File Loaded */}
              {importResult && (
                <div className="p-4 rounded-2xl bg-stone-950 border border-teal-800/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{importResult.file?.name} &bull; {importResult.totalRows} Rows Parsed</span>
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        Detected Date Columns: {importResult.detectedDateColumns.join(', ') || 'None'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        showToast(isBn ? `সফলভাবে ${toBanglaDigits(importResult.totalRows)}টি রেকর্ড সিস্টেমে ইমপোর্ট ও সংরক্ষণ করা হয়েছে` : `Successfully imported ${importResult.totalRows} records!`);
                        setImportResult(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      {isBn ? 'রেকর্ডগুলো সংরক্ষণ করুন' : 'Commit Import to Database'}
                    </button>
                  </div>

                  {/* Preview Table of First 5 rows */}
                  <div className="border border-stone-800 rounded-xl overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-900 text-stone-400 border-b border-stone-800 font-mono text-[10px]">
                        <tr>
                          {importResult.headers.map((h, i) => (
                            <th key={i} className="p-2.5 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-850 font-sans">
                        {importResult.data.slice(0, 10).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-stone-900/50">
                            {importResult.headers.map((h, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-stone-300 whitespace-nowrap">
                                {String(row[h] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span className="font-mono text-[11px]">
            {isBn ? 'কেআইএসএইচওএলওওয়াই অডিট ও ডেট ইঞ্জিন' : 'KISHOLOY Artisanal E-Commerce Date Engine & Analytics'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold transition-colors"
          >
            {isBn ? 'বন্ধ করুন' : 'Close Hub'}
          </button>
        </div>

      </div>
    </div>
  );
}
