import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, BarChart3, 
  ArrowUpRight, Download, Filter, Trash2, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw, Landmark, Receipt,
  Layers, ArrowRight, Search, FileSpreadsheet, Eye, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, ExpenseRecord, SettlementRecord, SettlementStatus, FinancialSummary, ReconciliationAnomaly } from '../types';
import { DateRangeFilterBar } from '../components/admin/DateRangeFilterBar';
import { DateWiseDataHubModal } from '../components/admin/DateWiseDataHubModal';
import { 
  DateFilterConfig, 
  filterItemsByDate, 
  exportToExcel, 
  exportToCsv,
  formatDateDisplay,
  getDateRangeBounds
} from '../utils/dateFilterUtils';

export function FinanceAdmin() {
  const { 
    orders, products, expenses, addExpense, deleteExpense, 
    settlements, addSettlement, updateSettlementStatus, 
    showToast, logAudit, language 
  } = useApp();
  const isBn = language === 'BN';

  const [activeTab, setActiveTab] = useState<'pnl' | 'expenses' | 'settlements' | 'reconciliation'>('pnl');
  const [showDataHub, setShowDataHub] = useState(false);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterConfig>({
    preset: 'ALL',
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(),
  });

  // Server financial summary state
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);

  // Reconciliation state
  const [reconciliationData, setReconciliationData] = useState<{
    scannedOrdersCount: number;
    scannedTransactionsCount: number;
    scannedSettlementsCount: number;
    anomaliesCount: number;
    anomalies: ReconciliationAnomaly[];
    scannedAt: string;
  } | null>(null);
  const [scanningReconciliation, setScanningReconciliation] = useState<boolean>(false);

  // Expense filters & Modal
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('');
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [newExpense, setNewExpense] = useState<{
    category: ExpenseRecord['category'];
    vendor: string;
    amount: string;
    reference: string;
    notes: string;
  }>({
    category: 'PACKAGING',
    vendor: '',
    amount: '',
    reference: '',
    notes: ''
  });

  // Settlement Batch Modal & Status Update Modal
  const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
  const [newSettlement, setNewSettlement] = useState<{
    batchNumber: string;
    gateway: SettlementRecord['gateway'];
    bankAccount: string;
    grossAmount: string;
    gatewayFee: string;
    notes: string;
  }>({
    batchNumber: `SET-${Date.now().toString().slice(-6)}`,
    gateway: 'SSLCOMMERZ',
    bankAccount: 'City Bank AC ***4921 (Kisholoy Ent.)',
    grossAmount: '',
    gatewayFee: '',
    notes: ''
  });

  const [settlingRecord, setSettlingRecord] = useState<SettlementRecord | null>(null);
  const [settlementUtr, setSettlementUtr] = useState<string>('');

  // Fetch financial summary from server API
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/finance/summary');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (e) {
      console.error('Failed to fetch server financial summary', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Run reconciliation scan
  const handleRunReconciliation = async () => {
    setScanningReconciliation(true);
    try {
      const res = await fetch('/api/finance/reconciliation');
      const data = await res.json();
      if (data.success) {
        setReconciliationData(data);
        logAudit('RECONCILIATION_SCAN', 'Finance', 'Automated reconciliation audit completed');
        showToast(`Audit scan completed: ${data.anomaliesCount} anomalies detected.`);
      }
    } catch (e) {
      showToast('Failed to perform reconciliation scan', 'info');
    } finally {
      setScanningReconciliation(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [orders, expenses, settlements]);

  // Date-filtered orders, expenses and settlements
  const dateFilteredOrders = useMemo(() => {
    return filterItemsByDate<Order>(orders, (o: Order) => o.createdAt, dateFilter);
  }, [orders, dateFilter]);

  const dateFilteredExpenses = useMemo(() => {
    return filterItemsByDate<ExpenseRecord>(expenses, (e: ExpenseRecord) => e.date, dateFilter);
  }, [expenses, dateFilter]);

  const dateFilteredSettlements = useMemo(() => {
    return filterItemsByDate<SettlementRecord>(settlements, (s: SettlementRecord) => s.periodStart || (s as any).createdAt, dateFilter);
  }, [settlements, dateFilter]);

  // Recalculate metrics based on active date scope
  const totalRevenue = dateFilteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCogs = dateFilteredOrders.reduce((sum, o) => {
    return sum + (o.items || []).reduce((itemSum, it) => {
      const prod = products.find(p => p.sku === it.sku);
      const unitCost = prod?.costPrice || (it.price * 0.6);
      return itemSum + (unitCost * it.quantity);
    }, 0);
  }, 0);

  const grossProfit = totalRevenue - totalCogs;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const totalOperatingExpenses = dateFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const gatewayFeesTotal = dateFilteredSettlements.reduce((sum, s) => sum + (s.gatewayFee || 0), 0) || (totalRevenue * 0.02);
  const netOperatingProfit = grossProfit - totalOperatingExpenses - gatewayFeesTotal;
  const netProfitMarginPct = totalRevenue > 0 ? (netOperatingProfit / totalRevenue) * 100 : 0;
  const settledFunds = dateFilteredSettlements.filter(s => s.status === 'SETTLED').reduce((sum, s) => sum + s.netPayout, 0);
  const pendingFunds = dateFilteredSettlements.filter(s => s.status !== 'SETTLED').reduce((sum, s) => sum + s.netPayout, 0);

  // Unit Economics
  const activeOrderCount = dateFilteredOrders.filter(o => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'FAILED').length;
  const aov = activeOrderCount > 0 ? totalRevenue / activeOrderCount : 0;
  const avgGrossMarginPerOrder = activeOrderCount > 0 ? grossProfit / activeOrderCount : 0;
  const avgNetProfitPerOrder = activeOrderCount > 0 ? netOperatingProfit / activeOrderCount : 0;

  // Filtered Expenses
  const filteredExpenses = dateFilteredExpenses.filter(exp => {
    const matchesCategory = expenseCategoryFilter === 'ALL' || exp.category === expenseCategoryFilter;
    const matchesSearch = 
      exp.vendor.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
      exp.reference.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(expenseSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalFilteredExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Expense Handlers
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpense.amount);
    if (!newExpense.vendor || isNaN(amountNum) || amountNum <= 0 || !newExpense.reference) {
      showToast('Please fill all required expense fields with a valid amount');
      return;
    }

    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newExpense.category,
          vendor: newExpense.vendor,
          amount: amountNum,
          reference: newExpense.reference,
          notes: newExpense.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        // Adopt the SERVER record so local state and the ledger share one id.
        // Building a local copy here is what made the P&L drift (F-302).
        if (data.expense) {
          addExpense(data.expense);
        }
        setShowExpenseModal(false);
        setNewExpense({
          category: 'PACKAGING',
          vendor: '',
          amount: '',
          reference: '',
          notes: ''
        });
        fetchSummary();
      } else {
        showToast(data.error || 'Failed to record expense', 'info');
      }
    } catch (err) {
      showToast('Failed to record expense', 'info');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await fetch(`/api/finance/expenses/${id}`, { method: 'DELETE' });
      deleteExpense(id);
      fetchSummary();
    } catch (err) {
      showToast('Failed to delete expense', 'info');
    }
  };

  // Settlement Handlers
  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    const grossNum = parseFloat(newSettlement.grossAmount);
    const feeNum = parseFloat(newSettlement.gatewayFee) || (grossNum * 0.02);
    if (!newSettlement.batchNumber || isNaN(grossNum) || grossNum <= 0) {
      showToast('Please enter a valid batch number and gross amount');
      return;
    }

    const netPayout = grossNum - feeNum;
    try {
      const res = await fetch('/api/finance/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: newSettlement.batchNumber,
          gateway: newSettlement.gateway,
          bankAccount: newSettlement.bankAccount,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          totalOrders: 1,
          grossAmount: grossNum,
          gatewayFee: feeNum,
          taxDeducted: 0,
          netPayout,
          status: 'PENDING',
          notes: newSettlement.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        addSettlement({
          batchNumber: newSettlement.batchNumber,
          gateway: newSettlement.gateway,
          bankAccount: newSettlement.bankAccount,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          totalOrders: 1,
          grossAmount: grossNum,
          gatewayFee: feeNum,
          taxDeducted: 0,
          netPayout,
          status: 'PENDING',
          notes: newSettlement.notes
        });
        setShowSettlementModal(false);
        showToast('New settlement batch created.');
        fetchSummary();
      }
    } catch (err) {
      showToast('Failed to create settlement batch', 'info');
    }
  };

  const handleConfirmPayout = async () => {
    if (!settlingRecord) return;
    try {
      const res = await fetch(`/api/finance/settlements/${settlingRecord.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SETTLED',
          utrOrReference: settlementUtr || `NPSB-REF-${Date.now().toString().slice(-6)}`
        })
      });
      const data = await res.json();
      if (data.success) {
        updateSettlementStatus(settlingRecord.id, 'SETTLED', settlementUtr || `NPSB-REF-${Date.now().toString().slice(-6)}`);
        setSettlingRecord(null);
        setSettlementUtr('');
        showToast('Settlement marked as SETTLED in merchant bank account.');
        fetchSummary();
      }
    } catch (err) {
      showToast('Failed to update settlement status', 'info');
    }
  };

  // CSV Export for P&L and Expenses
  const handleExportPnLCsv = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "KISHOLOY PROFIT & LOSS STATEMENT\n";
    csv += `Generated Date,${new Date().toISOString()}\n\n`;
    csv += "Metric,Amount (BDT),Percentage\n";
    csv += `Gross Sales Revenue,${totalRevenue},100%\n`;
    csv += `Cost of Goods Sold (Weaver/Artisan),-${totalCogs},${((totalCogs / (totalRevenue || 1)) * 100).toFixed(1)}%\n`;
    csv += `Gross Merchant Profit,${grossProfit},${grossMarginPct}%\n`;
    csv += `Operating Expenses Total,-${totalOperatingExpenses},${((totalOperatingExpenses / (totalRevenue || 1)) * 100).toFixed(1)}%\n`;
    csv += `Gateway Processing MDR Fees,-${gatewayFeesTotal},-\n`;
    csv += `Net Operating Cashflow,${netOperatingProfit},${netProfitMarginPct}%\n`;
    csv += `Settled in Bank,${settledFunds},-\n`;
    csv += `Pending Gateway Settlements,${pendingFunds},-\n`;

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kisholoy_PnL_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('P&L financial statement downloaded.');
  };

  const handleExportExpensesCsv = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Date,Category,Vendor,Reference,Amount (BDT),Notes\n";
    expenses.forEach(e => {
      csv += `${e.date},${e.category},"${e.vendor}",${e.reference},${e.amount},"${e.notes || ''}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kisholoy_Expenses_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Expense ledger CSV downloaded.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Financial Ledger & Settlement Engine</h1>
          <p className="text-xs text-stone-500">
            Real-time unit economics, weaver COGS reconciliation, 3PL courier charges, and automated gateway payout settlement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDataHub(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-950 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all border border-stone-800"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isBn ? 'মাস্টার ডেট হাব' : 'Date Hub & Export'}</span>
          </button>
          <button
            onClick={fetchSummary}
            className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} /> Sync Live Ledger
          </button>
          <button
            onClick={handleExportPnLCsv}
            className="px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-black flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export P&L (CSV)
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar for Finance */}
      <DateRangeFilterBar
        value={dateFilter}
        onChange={setDateFilter}
        onOpenDataHub={() => setShowDataHub(true)}
        totalFilteredCount={
          activeTab === 'expenses' ? filteredExpenses.length :
          activeTab === 'settlements' ? dateFilteredSettlements.length :
          dateFilteredOrders.length
        }
        totalUnfilteredCount={
          activeTab === 'expenses' ? expenses.length :
          activeTab === 'settlements' ? settlements.length :
          orders.length
        }
        onExportExcel={() => {
          if (activeTab === 'expenses') {
            const data = filteredExpenses.map(e => ({
              'Date': e.date,
              'Category': e.category,
              'Vendor': e.vendor,
              'Reference': e.reference,
              'Amount (BDT)': e.amount,
              'Notes': e.notes || ''
            }));
            exportToExcel(data, 'Expenses', 'Kisholoy_Expenses', dateFilter);
          } else if (activeTab === 'settlements') {
            const data = dateFilteredSettlements.map(s => ({
              'Batch Number': s.batchNumber,
              'Date': s.createdAt,
              'Gateway': s.gateway,
              'Bank Account': s.bankAccount,
              'Status': s.status,
              'Gross (BDT)': s.grossAmount,
              'Gateway Fee (BDT)': s.gatewayFee,
              'Net Payout (BDT)': s.netPayout,
              'UTR Ref': s.utrNumber || ''
            }));
            exportToExcel(data, 'Settlements', 'Kisholoy_Settlements', dateFilter);
          } else {
            handleExportPnLCsv();
          }
        }}
      />

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Gross Sales Revenue</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">৳ {totalRevenue.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Authoritative server verified
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Artisan COGS</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-800">৳ {totalCogs.toLocaleString()}</div>
          <span className="text-[11px] text-stone-500 block mt-1">
            Gross Margin: <strong className="text-stone-700">{grossMarginPct}%</strong>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Net Operating Profit</span>
            <span className="p-1.5 bg-teal-50 text-teal-900 rounded-md">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono ${netOperatingProfit >= 0 ? 'text-teal-950' : 'text-red-700'}`}>
            ৳ {netOperatingProfit.toLocaleString()}
          </div>
          <span className="text-[11px] text-teal-900 font-bold block mt-1">
            {netProfitMarginPct}% Net Operating Margin
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Bank Settled Funds</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-md">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">৳ {settledFunds.toLocaleString()}</div>
          <span className="text-[11px] text-amber-700 font-semibold block mt-1">
            ৳ {pendingFunds.toLocaleString()} in transit / pending
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-xl px-4 pt-3 gap-6 overflow-x-auto text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'pnl'
              ? 'border-teal-900 text-teal-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> P&L Statement & Unit Economics
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'expenses'
              ? 'border-teal-900 text-teal-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Receipt className="w-4 h-4" /> Operational Expense Ledger
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-stone-100 text-[10px] font-bold text-stone-600">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'settlements'
              ? 'border-teal-900 text-teal-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Landmark className="w-4 h-4" /> Gateway Settlements & Bank Batches
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-50 text-[10px] font-bold text-teal-900">
            {settlements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'reconciliation'
              ? 'border-teal-900 text-teal-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Automated Reconciliation Sentinel
          {reconciliationData && reconciliationData.anomaliesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700">
              {reconciliationData.anomaliesCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: P&L Statement & Unit Economics */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Waterfall P&L Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900">Authoritative Financial Statement</h2>
                  <p className="text-xs text-stone-500">Comprehensive real-time profit & loss accounting.</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-semibold border border-emerald-200">
                  Fiscal Period: Current
                </span>
              </div>

              <div className="border border-stone-200 rounded-xl divide-y divide-stone-200 text-xs sm:text-sm">
                <div className="p-3.5 flex justify-between bg-stone-50/70 font-bold text-stone-900">
                  <span>(+) Gross Customer Revenue (Paid & Confirmed Orders)</span>
                  <span className="font-mono">৳ {totalRevenue.toLocaleString()}</span>
                </div>

                <div className="p-3.5 flex justify-between text-stone-700 pl-6">
                  <span>(-) Cost of Goods Sold (Artisan & Weaver Procurement)</span>
                  <span className="font-mono text-red-700">- ৳ {totalCogs.toLocaleString()}</span>
                </div>

                <div className="p-3.5 flex justify-between bg-teal-50/50 font-bold text-teal-950">
                  <span>(=) Gross Merchant Margin</span>
                  <span className="font-mono">৳ {grossProfit.toLocaleString()} ({grossMarginPct}%)</span>
                </div>

                <div className="p-3.5 flex justify-between text-stone-600 pl-6">
                  <span>(-) 3PL Logistics & COD Courier Handling</span>
                  <span className="font-mono text-red-700">
                    - ৳ {(summary?.courierFeesTotal || (orders.length * 80)).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 flex justify-between text-stone-600 pl-6">
                  <span>(-) Eco-Packaging & Mailer Bags</span>
                  <span className="font-mono text-red-700">
                    - ৳ {(summary?.packagingTotal || 14500).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 flex justify-between text-stone-600 pl-6">
                  <span>(-) Digital Marketing & Campaign Ad Spend</span>
                  <span className="font-mono text-red-700">
                    - ৳ {(summary?.marketingTotal || 12000).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 flex justify-between text-stone-600 pl-6">
                  <span>(-) Payment Gateway MDR & Commission Deductions (SSL/bKash)</span>
                  <span className="font-mono text-red-700">- ৳ {gatewayFeesTotal.toLocaleString()}</span>
                </div>

                <div className="p-3.5 flex justify-between text-stone-600 pl-6">
                  <span>(-) General Administration, Rent & Software</span>
                  <span className="font-mono text-red-700">
                    - ৳ {(summary?.otherExpensesTotal || 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 flex justify-between bg-stone-900 text-white font-bold text-base rounded-b-xl">
                  <span>(=) Net Operating Cash Flow</span>
                  <span className="font-mono text-teal-300">৳ {netOperatingProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Unit Economics & Key Metrics Card */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-900" /> Unit Economics (Per Order)
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-lg flex justify-between items-center">
                    <span className="text-stone-600">Average Order Value (AOV)</span>
                    <span className="font-mono font-bold text-stone-900">৳ {Math.round(aov).toLocaleString()}</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-lg flex justify-between items-center">
                    <span className="text-stone-600">Avg Artisan COGS / Order</span>
                    <span className="font-mono font-bold text-stone-700">
                      ৳ {activeOrderCount > 0 ? Math.round(totalCogs / activeOrderCount).toLocaleString() : 0}
                    </span>
                  </div>

                  <div className="p-3 bg-teal-50/60 rounded-lg flex justify-between items-center">
                    <span className="text-teal-950 font-semibold">Gross Profit Contribution</span>
                    <span className="font-mono font-bold text-teal-950">৳ {Math.round(avgGrossMarginPerOrder).toLocaleString()}</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-lg flex justify-between items-center">
                    <span className="text-stone-600">Avg Fulfillment & Gateway Cut</span>
                    <span className="font-mono font-bold text-stone-700">
                      ৳ {activeOrderCount > 0 ? Math.round((totalOperatingExpenses + gatewayFeesTotal) / activeOrderCount).toLocaleString() : 0}
                    </span>
                  </div>

                  <div className="p-3 bg-stone-900 text-white rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-stone-200">Net Profit / Order</span>
                    <span className="font-mono font-bold text-teal-300">৳ {Math.round(avgNetProfitPerOrder).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Settlement Quick Glance */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Gateway Settlement Split</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                    <span className="text-stone-600">City Bank Settled Pool</span>
                    <span className="font-mono font-bold text-emerald-700">৳ {settledFunds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Unsettled / In-Transit Cash</span>
                    <span className="font-mono font-bold text-amber-700">৳ {pendingFunds.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Operational Expense Ledger */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">Operational Expense Ledger</h2>
                <p className="text-xs text-stone-500">Record and audit operating overheads, packaging bills, logistics, and ad costs.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExpensesCsv}
                  className="px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Record New Expense
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-y border-stone-100 py-3">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                {['ALL', 'PACKAGING', 'COURIER_FEES', 'MARKETING', 'OFFICE_RENT', 'SOFTWARE', 'SALARY', 'OTHER'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setExpenseCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      expenseCategoryFilter === cat
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Overheads' : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search vendor or ref..."
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Vendor / Beneficiary</th>
                    <th className="p-3">Invoice / Reference</th>
                    <th className="p-3">Amount (BDT)</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400">
                        No expense records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-3 font-mono text-stone-600 whitespace-nowrap">{exp.date}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-semibold">
                            {exp.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-stone-900">{exp.vendor}</td>
                        <td className="p-3 font-mono text-stone-600">{exp.reference}</td>
                        <td className="p-3 font-mono font-bold text-stone-900">৳ {exp.amount.toLocaleString()}</td>
                        <td className="p-3 text-stone-500 max-w-xs truncate">{exp.notes || '—'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-stone-400 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-stone-200 bg-stone-50 font-bold">
                    <td colSpan={4} className="p-3 text-stone-700">Total Filtered Operating Costs</td>
                    <td className="p-3 font-mono text-stone-900">৳ {totalFilteredExpensesAmount.toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Gateway Settlements & Bank Batches */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">Payment Gateway Settlements & Payout Batches</h2>
                <p className="text-xs text-stone-500">
                  Track SSLCOMMERZ card transfers, bKash Merchant payouts, and Steadfast courier COD cash remittances.
                </p>
              </div>
              <button
                onClick={() => setShowSettlementModal(true)}
                className="px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5 shadow-xs self-start"
              >
                <Plus className="w-4 h-4" /> New Settlement Batch
              </button>
            </div>

            {/* Settlements Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Gateway / Channel</th>
                    <th className="p-3">Destination Bank</th>
                    <th className="p-3">Gross Collection</th>
                    <th className="p-3">Gateway Fee</th>
                    <th className="p-3">Net Payout</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Bank UTR / Ref</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {settlements.map((set) => (
                    <tr key={set.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-stone-900">{set.batchNumber}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 text-[11px] font-bold">
                          {set.gateway}
                        </span>
                      </td>
                      <td className="p-3 text-stone-600">{set.bankAccount}</td>
                      <td className="p-3 font-mono text-stone-700">৳ {set.grossAmount.toLocaleString()}</td>
                      <td className="p-3 font-mono text-red-700">- ৳ {set.gatewayFee.toLocaleString()}</td>
                      <td className="p-3 font-mono font-bold text-stone-900">৳ {set.netPayout.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          set.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' :
                          set.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          set.status === 'ELIGIBLE' ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {set.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-stone-500">{set.utrOrReference || 'Pending Transfer'}</td>
                      <td className="p-3 text-right">
                        {set.status !== 'SETTLED' ? (
                          <button
                            onClick={() => {
                              setSettlingRecord(set);
                              setSettlementUtr(`NPSB-${Math.floor(10000000 + Math.random() * 90000000)}`);
                            }}
                            className="px-2.5 py-1 bg-stone-900 text-white rounded-md text-[11px] font-bold hover:bg-black"
                          >
                            Mark Settled
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Automated Reconciliation Sentinel */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">Automated Financial & Gateway Reconciliation</h2>
                <p className="text-xs text-stone-500">
                  Cross-verify database orders against SSLCOMMERZ/bKash webhooks and courier cash-on-delivery collections.
                </p>
              </div>
              <button
                onClick={handleRunReconciliation}
                disabled={scanningReconciliation}
                className="px-4 py-2.5 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningReconciliation ? 'animate-spin' : ''}`} />
                {scanningReconciliation ? 'Scanning Ledger...' : 'Run Automated Reconciliation Audit'}
              </button>
            </div>

            {reconciliationData ? (
              <div className="space-y-4">
                {/* Audit Status Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-stone-200 rounded-xl p-4 bg-stone-50/50">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Audited Orders</span>
                    <span className="text-lg font-bold font-mono text-stone-900">{reconciliationData.scannedOrdersCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Verified Transactions</span>
                    <span className="text-lg font-bold font-mono text-stone-900">{reconciliationData.scannedTransactionsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Discrepancies Detected</span>
                    <span className={`text-lg font-bold font-mono ${reconciliationData.anomaliesCount === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {reconciliationData.anomaliesCount} Anomalies
                    </span>
                  </div>
                </div>

                {/* Anomalies List */}
                {reconciliationData.anomalies.length === 0 ? (
                  <div className="p-8 border border-emerald-200 bg-emerald-50/50 rounded-xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                    <h3 className="text-sm font-bold text-emerald-900">Zero Discrepancies Found</h3>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      All order payments, gateway MDR fees, and 3PL courier COD remittances match authoritative ledger values with 100% precision.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Detected Financial Anomalies</h3>
                    <div className="space-y-3">
                      {reconciliationData.anomalies.map((anom) => (
                        <div key={anom.id} className="p-4 border border-red-200 bg-red-50/30 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                {anom.severity} SEVERITY
                              </span>
                              <span className="font-mono font-bold text-stone-900 text-xs">{anom.orderNumber}</span>
                            </div>
                            <p className="text-xs text-stone-700 font-medium">{anom.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right text-xs">
                              <span className="text-stone-400 block text-[10px]">Variance</span>
                              <span className="font-mono font-bold text-red-700">৳ {anom.difference.toLocaleString()}</span>
                            </div>
                            <button
                              onClick={() => showToast(`Audit ticket created for ${anom.orderNumber}`)}
                              className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black"
                            >
                              Resolve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 border border-stone-200 rounded-xl text-center space-y-2 bg-stone-50/30">
                <ShieldCheck className="w-8 h-8 text-stone-400 mx-auto" />
                <h3 className="text-sm font-bold text-stone-700">Reconciliation Ready</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Click above to perform automated cross-system balance checking across active orders and gateway accounts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-serif font-bold text-stone-900">Record Operational Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Expense Category *</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="PACKAGING">Packaging & Bags</option>
                  <option value="COURIER_FEES">Courier Logistics & COD Fees</option>
                  <option value="MARKETING">Digital Ad Spend (Meta / Google)</option>
                  <option value="OFFICE_RENT">Office Rent & Utilities</option>
                  <option value="SOFTWARE">Software, Hosting & SMS Subscriptions</option>
                  <option value="SALARY">Artisan Fair Wages & Payroll</option>
                  <option value="OTHER">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Vendor / Payee *</label>
                <input
                  type="text"
                  placeholder="e.g. EcoPack BD Ltd."
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Amount (BDT ৳) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 14500"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Invoice / Receipt Ref *</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-EP-9920"
                    value={newExpense.reference}
                    onChange={(e) => setNewExpense({ ...newExpense, reference: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Notes / Description</label>
                <textarea
                  placeholder="Brief description of the operational expense..."
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-black shadow-xs"
                >
                  Save to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Settlement Batch */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-serif font-bold text-stone-900">Create Settlement Batch</h3>
            <form onSubmit={handleCreateSettlement} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Batch Number *</label>
                <input
                  type="text"
                  value={newSettlement.batchNumber}
                  onChange={(e) => setNewSettlement({ ...newSettlement, batchNumber: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Gateway Channel *</label>
                <select
                  value={newSettlement.gateway}
                  onChange={(e) => setNewSettlement({ ...newSettlement, gateway: e.target.value as any })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="SSLCOMMERZ">SSLCOMMERZ Card / NetBanking</option>
                  <option value="BKASH">bKash Merchant Pool</option>
                  <option value="STEADFAST_COD">Steadfast Courier COD Remittance</option>
                  <option value="PATHAO_COD">Pathao Courier COD Remittance</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Destination Bank Account *</label>
                <input
                  type="text"
                  value={newSettlement.bankAccount}
                  onChange={(e) => setNewSettlement({ ...newSettlement, bankAccount: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Gross Amount (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 25000"
                    value={newSettlement.grossAmount}
                    onChange={(e) => setNewSettlement({ ...newSettlement, grossAmount: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Gateway Fee (৳)</label>
                  <input
                    type="number"
                    placeholder="Auto (2.5%)"
                    value={newSettlement.gatewayFee}
                    onChange={(e) => setNewSettlement({ ...newSettlement, gatewayFee: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettlementModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-black shadow-xs"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Settled & Input UTR */}
      {settlingRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-serif font-bold text-stone-900">Confirm Bank Remittance Payout</h3>
            <p className="text-xs text-stone-500">
              Confirm that <strong>৳ {settlingRecord.netPayout.toLocaleString()}</strong> has been deposited by {settlingRecord.gateway} into {settlingRecord.bankAccount}.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Bank UTR / Transaction Reference *</label>
                <input
                  type="text"
                  value={settlementUtr}
                  onChange={(e) => setSettlementUtr(e.target.value)}
                  placeholder="e.g. NPSB-CB-99201928"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingRecord(null)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  className="px-4 py-2 bg-emerald-800 text-white rounded-lg font-bold hover:bg-emerald-900 shadow-xs"
                >
                  Confirm Payout Deposited
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date-wise Master Data Hub Modal */}
      {showDataHub && (
        <DateWiseDataHubModal
          isOpen={showDataHub}
          onClose={() => setShowDataHub(false)}
          initialDomain="FINANCE"
        />
      )}
    </div>
  );
}
