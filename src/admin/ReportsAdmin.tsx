/**
 * @file src/admin/ReportsAdmin.tsx
 * @description Phase 17: Reporting, Business Intelligence, 64-District Telemetry, Financial Analytics & Document Engine
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, FileSpreadsheet, TrendingUp, MapPin, 
  Receipt, Truck, ShieldCheck, Printer, Eye, Layers, 
  Sparkles, RefreshCw, Filter, Calendar, Users, ShoppingBag, 
  FileText, CheckCircle2, ChevronRight, PieChart, AlertTriangle,
  ArrowUpRight, ArrowDownRight, DollarSign, PackageCheck, Clock,
  Globe2, Scale, Percent, Wallet, Banknote, HelpCircle, Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  Order, 
  DistrictMetric, 
  CategoryMetric, 
  ArtisanSourcingMetric, 
  TaxVatSummary,
  InventoryVelocityMetric,
  FinancialPnLReport,
  CustomerCohortMetric,
  CourierPerformanceMetric,
  SalesTrendPoint
} from '../types';
import { BusinessDocumentModal } from '../components/admin/BusinessDocumentModal';
import { PrintOrderDocumentsModal } from '../components/print/PrintOrderDocumentsModal';
import { ReportPrintModal } from '../components/print/ReportPrintModal';
import { AdminHelpButton } from '../components/admin/AdminHelpModal';
import { REPORTS_HELP_DATA } from './reportsHelpData';

export function ReportsAdmin() {
  const { orders, products, categories, siteContent, showToast, logAudit } = useApp();

  // Active Tab navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'districts' | 'artisans' | 'inventory' | 'pnl_tax' | 'documents' | 'exports'>('overview');
  
  // Date range filters
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | '1D' | '2D' | '5D' | '7D' | '30D' | '90D' | 'YTD' | 'CUSTOM'>('30D');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [reportPrintOpen, setReportPrintOpen] = useState(false);
  
  // Bilingual toggle (EN / BN)
  const [lang, setLang] = useState<'EN' | 'BN'>('EN');

  // Division filter for 64 districts
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [districtSearch, setDistrictSearch] = useState<string>('');

  // Loading indicator
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  // Server Analytics Data state
  const [analyticsData, setAnalyticsData] = useState<{
    kpis: {
      totalOrders: number;
      grossRevenue: number;
      discounts: number;
      netSales: number;
      aov: number;
      totalItemsSold: number;
      avgBasketSize: number;
      grossProfit: number;
      grossMarginPct: number;
      netOperatingProfit: number;
      netMarginPct: number;
      overallDeliverySuccessRate: number;
      rtoRate: number;
      onlineSharePct: number;
      codSharePct: number;
      inTransitCodFloat: number;
    };
    districtMetrics: DistrictMetric[];
    categoryMetrics: CategoryMetric[];
    artisanMetrics: ArtisanSourcingMetric[];
    inventoryVelocityMetrics: InventoryVelocityMetric[];
    financialPnl: FinancialPnLReport;
    customerCohorts: CustomerCohortMetric;
    courierPerformance: CourierPerformanceMetric[];
    salesTrend: SalesTrendPoint[];
    taxSummary: TaxVatSummary;
  } | null>(null);

  // Document Modal state
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    type: 'INVOICE' | 'PACKING_SLIP' | 'COURIER_MANIFEST' | 'TAX_STATEMENT';
    selectedOrder?: Order;
  }>({
    isOpen: false,
    type: 'INVOICE'
  });

  const [selectedOrderForDoc, setSelectedOrderForDoc] = useState<string>(orders[0]?.orderNumber || '');

  // Fetch live server report
  const fetchReport = async () => {
    setLoadingAnalytics(true);
    try {
      let url = `/api/reports/analytics?range=${dateRange}`;
      if (dateRange === 'CUSTOM' && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData({
          kpis: data.kpis,
          districtMetrics: data.districtMetrics || [],
          categoryMetrics: data.categoryMetrics || [],
          artisanMetrics: data.artisanMetrics || [],
          inventoryVelocityMetrics: data.inventoryVelocityMetrics || [],
          financialPnl: data.financialPnl,
          customerCohorts: data.customerCohorts,
          courierPerformance: data.courierPerformance || [],
          salesTrend: data.salesTrend || [],
          taxSummary: data.taxSummary
        });
      }
    } catch (e) {
      console.error('Failed to load server analytics report', e);
      showToast(lang === 'BN' ? 'রিপোর্ট লোড করতে ব্যর্থ হয়েছে' : 'Failed to load reports', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange, customFrom, customTo, orders.length]);

  // Open Document Modal Helper
  const openDoc = (type: 'INVOICE' | 'PACKING_SLIP' | 'COURIER_MANIFEST' | 'TAX_STATEMENT', orderNumber?: string) => {
    const targetOrder = orders.find(o => o.orderNumber === (orderNumber || selectedOrderForDoc)) || orders[0];
    setDocumentModal({
      isOpen: true,
      type,
      selectedOrder: targetOrder
    });
    logAudit('GENERATE_DOCUMENT', 'Reports', targetOrder ? targetOrder.orderNumber : type, `Generated ${type} document`);
  };

  // CSV Export Master Engine
  const handleExportCsv = (reportType: 'ORDERS' | 'INVENTORY' | 'DISTRICTS' | 'ARTISANS' | 'TAX' | 'FINANCIAL_PNL') => {
    // Direct link to server export endpoint
    const downloadUrl = `/api/reports/export/${reportType.toLowerCase()}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Kisholoy_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAudit('EXPORT_REPORT', 'Reports', reportType, `Exported ${reportType} CSV`);
    showToast(lang === 'BN' ? `${reportType} সিএসভি ডাউনলোড শুরু হয়েছে` : `Downloading ${reportType} CSV`, 'success');
  };

  // Filtered districts
  const filteredDistricts = (analyticsData?.districtMetrics || []).filter(d => {
    const matchesDiv = selectedDivision === 'ALL' || d.division === selectedDivision;
    const matchesSearch = !districtSearch || d.district.toLowerCase().includes(districtSearch.toLowerCase());
    return matchesDiv && matchesSearch;
  });

  const kpis = analyticsData?.kpis || {
    totalOrders: orders.length,
    grossRevenue: orders.reduce((s, o) => s + o.total, 0),
    discounts: orders.reduce((s, o) => s + (o.discount || 0), 0),
    netSales: orders.reduce((s, o) => s + o.total, 0),
    aov: orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0,
    totalItemsSold: orders.reduce((s, o) => s + o.items.reduce((is, it) => is + it.quantity, 0), 0),
    avgBasketSize: 1.8,
    grossProfit: Math.round(orders.reduce((s, o) => s + o.total, 0) * 0.38),
    grossMarginPct: 38.0,
    netOperatingProfit: Math.round(orders.reduce((s, o) => s + o.total, 0) * 0.18),
    netMarginPct: 18.0,
    overallDeliverySuccessRate: 96.5,
    rtoRate: 3.5,
    onlineSharePct: 35.0,
    codSharePct: 65.0,
    inTransitCodFloat: 45000
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Executive Ribbon */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-teal-800" />
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                {lang === 'BN' ? 'ব্যবসা বিশ্লেষণ ও আর্থিক প্রতিবেদন' : 'Reporting, BI & Financial Analytics'}
              </h1>
              <AdminHelpButton helpData={REPORTS_HELP_DATA.GMV_NET_SALES} />
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {lang === 'BN' 
                ? '৬৪ জেলার ডেলিভারি টেলিমেট্রি, তাঁতি মজুরি বিশ্লেষণ, এনবিআর মূসক-৬.৩ ভ্যাট এবং রিয়েল-টাইম বাণিজ্যিক অন্তর্দৃষ্টি।'
                : 'Bangladesh 64-district delivery telemetry, artisan fair-wage sourcing, NBR VAT (Mushak-6.3), and executive commercial intelligence.'}
            </p>
          </div>

          {/* Action Toolbar: Refresh, Language, Date Range */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bilingual Toggle */}
            <div className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-0.5 text-xs font-medium">
              <button
                onClick={() => setLang('EN')}
                className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'EN' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-500 hover:text-stone-900'}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('BN')}
                className={`px-2.5 py-1 rounded-md transition-colors ${lang === 'BN' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-500 hover:text-stone-900'}`}
              >
                বাংলা
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg p-1 text-xs">
              {(['TODAY', '2D', '5D', '7D', '30D', '90D', 'YTD', 'ALL'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    dateRange === range 
                      ? 'bg-stone-900 text-white font-bold shadow-xs' 
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  {range === 'TODAY' && (lang === 'BN' ? '১ দিন' : '1D')}
                  {range === '2D' && '2D'}
                  {range === '5D' && '5D'}
                  {range === '7D' && '7D'}
                  {range === '30D' && '30D'}
                  {range === '90D' && '90D'}
                  {range === 'YTD' && 'YTD'}
                  {range === 'ALL' && (lang === 'BN' ? 'সব' : 'All')}
                </button>
              ))}
              <button
                onClick={() => setDateRange('CUSTOM')}
                className={`px-2 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  dateRange === 'CUSTOM' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {lang === 'BN' ? 'কাস্টম' : 'Custom'}
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchReport}
              disabled={loadingAnalytics}
              className="p-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin text-teal-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker Accordion */}
        {dateRange === 'CUSTOM' && (
          <div className="flex items-center gap-3 pt-3 border-t border-stone-100 text-xs">
            <span className="text-stone-500 font-medium">{lang === 'BN' ? 'তারিখ নির্বাচন করুন:' : 'Select Range:'}</span>
            <input 
              type="date" 
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1 border border-stone-300 rounded text-stone-800 bg-white"
            />
            <span className="text-stone-400">to</span>
            <input 
              type="date" 
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1 border border-stone-300 rounded text-stone-800 bg-white"
            />
            <button
              onClick={fetchReport}
              className="px-3 py-1 bg-teal-800 text-white font-bold rounded hover:bg-teal-900 transition-colors"
            >
              {lang === 'BN' ? 'প্রয়োগ করুন' : 'Apply'}
            </button>
          </div>
        )}

        {/* Executive KPI Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* GMV Gross Revenue */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{lang === 'BN' ? 'মোট বিক্রয় (GMV)' : 'Gross Revenue'}</span>
              <AdminHelpButton helpData={REPORTS_HELP_DATA.GMV_NET_SALES} size="sm" />
            </div>
            <div className="text-base sm:text-lg font-bold text-stone-900 font-mono">
              ৳{kpis.grossRevenue.toLocaleString('en-BD')}
            </div>
            <div className="text-[11px] text-teal-700 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {kpis.totalOrders} {lang === 'BN' ? 'টি অর্ডার' : 'orders'}
            </div>
          </div>

          {/* Gross Margin */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{lang === 'BN' ? 'গ্রস মার্জিন %' : 'Gross Margin'}</span>
              <AdminHelpButton helpData={REPORTS_HELP_DATA.COGS_GROSS_MARGIN} size="sm" />
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-900 font-mono">
              {kpis.grossMarginPct}%
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              ৳{kpis.grossProfit.toLocaleString('en-BD')} {lang === 'BN' ? 'লাভ' : 'profit'}
            </div>
          </div>

          {/* AOV */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{lang === 'BN' ? 'গড় অর্ডার মান (AOV)' : 'Average Order'}</span>
              <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="text-base sm:text-lg font-bold text-stone-900 font-mono">
              ৳{kpis.aov.toLocaleString('en-BD')}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              {kpis.avgBasketSize} {lang === 'BN' ? 'পণ্য/ঝুড়ি' : 'items/basket'}
            </div>
          </div>

          {/* 3PL Delivery Fulfillment */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{lang === 'BN' ? 'ডেলিভারি সাফল্য' : '3PL Success'}</span>
              <Truck className="w-3.5 h-3.5 text-teal-700" />
            </div>
            <div className="text-base sm:text-lg font-bold text-teal-900 font-mono">
              {kpis.overallDeliverySuccessRate}%
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              RTO: <span className="text-amber-700 font-bold">{kpis.rtoRate}%</span>
            </div>
          </div>

          {/* COD Float In-Transit */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{lang === 'BN' ? 'সিওডি ট্রানজিট ঝুঁকি' : 'COD Float'}</span>
              <Banknote className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-900 font-mono">
              ৳{kpis.inTransitCodFloat.toLocaleString('en-BD')}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              {kpis.codSharePct}% {lang === 'BN' ? 'সিওডি শেয়ার' : 'COD share'}
            </div>
          </div>

          {/* NBR VAT Payable */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{lang === 'BN' ? 'এনবিআর প্রদেয় ভ্যাট' : 'NBR VAT Due'}</span>
              <AdminHelpButton helpData={REPORTS_HELP_DATA.NBR_VAT_MUSHAK_63} size="sm" />
            </div>
            <div className="text-base sm:text-lg font-bold text-stone-900 font-mono">
              ৳{analyticsData?.taxSummary.netVatPayable.toLocaleString('en-BD') || '0'}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              মূসক-৬.৩ (৫%)
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {lang === 'BN' ? 'নির্বাহী ওভারভিউ ও বিক্রয়' : 'Executive Overview & Velocity'}
        </button>

        <button
          onClick={() => setActiveTab('districts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'districts'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          {lang === 'BN' ? '৬৪ জেলার টেলিমেট্রি' : '64-District Telemetry'}
        </button>

        <button
          onClick={() => setActiveTab('artisans')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'artisans'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          {lang === 'BN' ? 'তাঁতি পল্লী ও সংগ্রহ' : 'Artisan Guilds & Sourcing'}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          {lang === 'BN' ? 'ইনভেন্টরি ঘূর্ণন ও স্টক' : 'Inventory Velocity & DIR'}
        </button>

        <button
          onClick={() => setActiveTab('pnl_tax')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'pnl_tax'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          {lang === 'BN' ? 'আর্থিক P&L ও এনবিআর ভ্যাট' : 'Financial P&L & NBR VAT'}
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          {lang === 'BN' ? 'অফিসিয়াল চালান ও প্রিন্ট' : 'Document Generator (Mushak-6.3)'}
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'exports'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Download className="w-4 h-4" />
          {lang === 'BN' ? 'ডেটা এক্সপোর্ট (CSV)' : 'Export Center'}
        </button>
      </div>

      {/* Tab 1: Executive Overview & Sales Velocity */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Unified Report Print Action */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500">
              {lang === 'BN' ? 'এই রেজেঞ্জের সম্পূর্ণ ব্যবসায়িক রিপোর্ট এক পিডিএফে প্রিন্ট করুন।' : 'Print the full business report for this date range as one PDF.'}
            </p>
            <button
              onClick={() => setReportPrintOpen(true)}
              className="px-4 py-2 bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-teal-950 shadow-xs"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              {lang === 'BN' ? 'রিপোর্ট প্রিন্ট করুন' : 'Print Business Report'}
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-800 text-teal-200 font-normal">One PDF</span>
            </button>
          </div>

          {/* Sales & Profit Velocity Bar Chart (Last 7 Days) */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">
                  {lang === 'BN' ? 'দৈনিক বিক্রয় ও মুনাফা গতিশীলতা (৭ দিন)' : 'Daily Revenue & Gross Profit Velocity'}
                </h2>
                <p className="text-xs text-stone-500">
                  {lang === 'BN' ? 'অর্ডার আয়তন বনাম নেট গ্রস মার্জিন বিশ্লেষণ' : 'Real-time sales velocity comparison with true artisan COGS'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-teal-800"></span>
                  <span>{lang === 'BN' ? 'রাজস্ব (Revenue)' : 'Revenue (BDT)'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600"></span>
                  <span>{lang === 'BN' ? 'মুনাফা (Profit)' : 'Gross Profit'}</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6 border-b border-stone-100 pb-2">
              {(analyticsData?.salesTrend || []).map((day, idx) => {
                const maxVal = 80000;
                const revHeight = Math.min(100, Math.max(15, (day.revenue / maxVal) * 100));
                const profitHeight = Math.min(100, Math.max(10, (day.profit / maxVal) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-mono text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ৳{day.revenue.toLocaleString('en-BD')}
                    </div>
                    <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-40">
                      <div 
                        style={{ height: `${revHeight}%` }} 
                        className="w-1/2 bg-teal-800 rounded-t-sm transition-all group-hover:bg-teal-900"
                        title={`Revenue: ৳${day.revenue}`}
                      />
                      <div 
                        style={{ height: `${profitHeight}%` }} 
                        className="w-1/2 bg-emerald-600 rounded-t-sm transition-all group-hover:bg-emerald-700"
                        title={`Gross Profit: ৳${day.profit}`}
                      />
                    </div>
                    <div className="text-[11px] font-medium text-stone-600 text-center truncate w-full">
                      {day.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mid Row: Category Velocity + Payment & Logistics Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Sales & Margin Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    {lang === 'BN' ? 'ক্যাটাগরি ভিত্তিক বিক্রয় ও মার্জিন' : 'Category Velocity & Profit Contribution'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {lang === 'BN' ? 'পণ্যের মোট বিক্রয়, স্টক ভ্যালু ও গ্রস মার্জিন' : 'Unit sales, gross margins, and locked working capital'}
                  </p>
                </div>
                <AdminHelpButton helpData={REPORTS_HELP_DATA.COGS_GROSS_MARGIN} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-semibold bg-stone-50/50">
                      <th className="py-2.5 px-3">{lang === 'BN' ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'বিক্রিত ইউনিট' : 'Units Sold'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'মোট বিক্রয়' : 'Gross Sales'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'গ্রস মার্জিন' : 'Gross Margin'}</th>
                      <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'স্টক ইউনিট' : 'Live Stock'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(analyticsData?.categoryMetrics || []).map(cat => (
                      <tr key={cat.categoryId} className="hover:bg-stone-50/70">
                        <td className="py-2.5 px-3 font-medium text-stone-900">
                          {lang === 'BN' ? cat.categoryNameBn || cat.categoryName : cat.categoryName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-700">{cat.unitsSold}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">৳{cat.grossSales.toLocaleString('en-BD')}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                            cat.marginPct >= 40 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {cat.marginPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">{cat.stockUnits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Logistics Mix Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-5">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">
                  {lang === 'BN' ? 'পেমেন্ট ও ৩পিএল পার্টনার মিশ্রণ' : 'Payment & 3PL Logistics Mix'}
                </h2>
                <p className="text-xs text-stone-500">
                  {lang === 'BN' ? 'ক্যাশ অন ডেলিভারি বনাম অনলাইন পেমেন্ট' : 'Gateway settlement vs COD collection ratios'}
                </p>
              </div>

              {/* Payment Ratio Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">Cash on Delivery (COD)</span>
                  <span className="font-mono font-bold text-amber-800">{kpis.codSharePct}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: `${kpis.codSharePct}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">Online Gateway (SSLCOMMERZ / bKash)</span>
                  <span className="font-mono font-bold text-teal-800">{kpis.onlineSharePct}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-teal-800 h-2.5 rounded-full" style={{ width: `${kpis.onlineSharePct}%` }} />
                </div>
              </div>

              {/* 3PL Courier Breakdown Table */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <div className="text-xs font-bold text-stone-800">
                  {lang === 'BN' ? 'কুরিয়ার ডেলিভারি পারফরম্যান্স' : 'Courier Performance Matrix'}
                </div>
                <div className="space-y-2 text-xs">
                  {(analyticsData?.courierPerformance || []).map(courier => (
                    <div key={courier.provider} className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/50 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-stone-900">{courier.provider}</div>
                        <div className="text-[11px] text-stone-500">{courier.bookedCount} parcels booked ({courier.avgDeliveryHours}h SLA)</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-800">{courier.successRate}% delivered</div>
                        <div className="text-[10px] text-stone-500 font-mono">COD: ৳{courier.totalCodHandled.toLocaleString('en-BD')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bangladesh 64 Districts Telemetry */}
      {activeTab === 'districts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-800" />
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    {lang === 'BN' ? 'বাংলাদেশের ৬৪ জেলার ডেলিভারি টেলিমেট্রি' : 'Bangladesh 64-District Telemetry'}
                  </h2>
                  <AdminHelpButton helpData={REPORTS_HELP_DATA.REGIONAL_64_DISTRICTS} />
                </div>
                <p className="text-xs text-stone-500">
                  {lang === 'BN' 
                    ? 'আঞ্চলিক অর্ডার ভলিউম, রাজস্ব অবদান, ডেলিভারি সাফল্য হার ও রিটার্ন (RTO) ট্র্যাকিং'
                    : 'Geographic distribution across all 8 administrative divisions with delivery success and RTO flags.'}
                </p>
              </div>

              {/* District Search & Export */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder={lang === 'BN' ? 'জেলা অনুসন্ধান...' : 'Search district...'}
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs w-44 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>
                <button
                  onClick={() => handleExportCsv('DISTRICTS')}
                  className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            {/* Division Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'].map(div => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                    selectedDivision === div 
                      ? 'bg-teal-900 text-white font-bold' 
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {div === 'ALL' ? (lang === 'BN' ? 'সব বিভাগ' : 'All Divisions') : div}
                </button>
              ))}
            </div>

            {/* 64 Districts Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                    <th className="py-2.5 px-3">{lang === 'BN' ? 'জেলা' : 'District'}</th>
                    <th className="py-2.5 px-3">{lang === 'BN' ? 'বিভাগ' : 'Division'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'অর্ডার সংখ্যা' : 'Orders'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'মোট রাজস্ব' : 'Revenue (BDT)'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'ডেলিভারি সাফল্য' : 'Fulfillment %'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'আরটিও ঝুঁকি' : 'RTO %'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'গড় ট্রানজিট' : 'Avg Transit'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'সিওডি শেয়ার' : 'COD Share'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredDistricts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-stone-500">
                        {lang === 'BN' ? 'কোনো জেলা পাওয়া যায়নি' : 'No districts found matching filter'}
                      </td>
                    </tr>
                  ) : (
                    filteredDistricts.map(d => (
                      <tr key={d.district} className="hover:bg-stone-50/70">
                        <td className="py-2.5 px-3 font-bold text-stone-900 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {d.district}
                        </td>
                        <td className="py-2.5 px-3 text-stone-500">{d.division}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-700">{d.orderCount}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          ৳{d.revenue.toLocaleString('en-BD')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                            d.deliverySuccessRate >= 95 
                              ? 'bg-emerald-50 text-emerald-800' 
                              : d.deliverySuccessRate >= 85 
                              ? 'bg-amber-50 text-amber-800' 
                              : 'bg-red-50 text-red-800'
                          }`}>
                            {d.deliverySuccessRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-mono text-[11px] ${
                            (d.rtoRate || 0) > 8 ? 'text-red-700 font-bold' : 'text-stone-500'
                          }`}>
                            {d.rtoRate || 0}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">{d.avgDeliveryHours}h</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">{d.codSharePct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Artisan Guilds & Sourcing Matrix */}
      {activeTab === 'artisans' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-800" />
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    {lang === 'BN' ? 'তাঁতি পল্লী ও সামাজিক প্রভাব বিশ্লেষণ' : 'Artisan Guilds & Fair-Wage Sourcing Matrix'}
                  </h2>
                  <AdminHelpButton helpData={REPORTS_HELP_DATA.ARTISAN_SOURCING_MATRIX} />
                </div>
                <p className="text-xs text-stone-500">
                  {lang === 'BN'
                    ? 'টাঙ্গাইল, রাজশাহী, ডেমরা মসলিন, কুমিল্লা খাদি ও রংপুর শতরঞ্জি তাঁতিদের ন্যায্য মজুরি বিতরণ'
                    : 'Ethical craft preservation ledger tracking direct weaver payouts across Bangladesh heritage clusters.'}
                </p>
              </div>

              <button
                onClick={() => handleExportCsv('ARTISANS')}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>

            {/* Cluster Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(analyticsData?.artisanMetrics || []).map(cluster => (
                <div key={cluster.originCluster} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-sm">{cluster.originCluster}</h3>
                      <p className="text-xs text-stone-500">{cluster.clusterBn}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {cluster.productCount} SKUs
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-stone-200">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{lang === 'BN' ? 'বিক্রিত কারুপণ্য:' : 'Units Sold:'}</span>
                      <span className="font-mono font-bold text-stone-800">{cluster.unitsSold}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{lang === 'BN' ? 'তাঁতি মজুরি বিতরণ:' : 'Weaver Payouts Disbursed:'}</span>
                      <span className="font-mono font-bold text-emerald-800">৳{cluster.weaverPayoutDisbursed.toLocaleString('en-BD')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{lang === 'BN' ? 'খুচরা বিক্রয় অবদান:' : 'Retail Sales Turnover:'}</span>
                      <span className="font-mono font-bold text-stone-900">৳{cluster.retailSalesContribution.toLocaleString('en-BD')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{lang === 'BN' ? 'ন্যায্য মজুরি অনুপাত:' : 'Fair-Wage Share:'}</span>
                      <span className="font-mono font-bold text-teal-900">{cluster.fairWageMarginPct || 65}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Inventory Velocity & Health */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-teal-800" />
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    {lang === 'BN' ? 'মজুদ পণ্যের ঘূর্ণন গতি ও স্টক স্বাস্থ্য (DIR)' : 'Inventory Velocity & Days of Supply (DIR)'}
                  </h2>
                  <AdminHelpButton helpData={REPORTS_HELP_DATA.INVENTORY_VELOCITY_HEALTH} />
                </div>
                <p className="text-xs text-stone-500">
                  {lang === 'BN'
                    ? 'বিক্রয় গতিবেগ, স্টক ফুরিয়ে যাওয়ার আনুমানিক দিন এবং অলস ইনভেন্টরি সতর্কতা'
                    : 'Stockout risk projections, fast-sellers, deadstock identification, and capital valuation at cost vs retail.'}
                </p>
              </div>

              <button
                onClick={() => handleExportCsv('INVENTORY')}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>

            {/* Inventory Velocity Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">{lang === 'BN' ? 'পণ্যের নাম' : 'Product Title'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'বর্তমান স্টক' : 'Stock'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'বিক্রিত ইউনিট' : 'Units Sold'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'মজুদ সরবরাহ (দিন)' : 'Days of Supply'}</th>
                    <th className="py-2.5 px-3 text-right">{lang === 'BN' ? 'ক্রয়মূল্যে স্টক মান' : 'Valuation (Cost)'}</th>
                    <th className="py-2.5 px-3 text-center">{lang === 'BN' ? 'স্ট্যাটাস' : 'Velocity Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(analyticsData?.inventoryVelocityMetrics || []).map(item => (
                    <tr key={item.sku} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-800">{item.sku}</td>
                      <td className="py-2.5 px-3 font-medium text-stone-900 truncate max-w-xs">{item.title}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700">{item.stock}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700">{item.unitsSold}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">{item.daysOfSupply}d</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700">৳{item.stockValuationCost.toLocaleString('en-BD')}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.velocityStatus === 'FAST_MOVING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.velocityStatus === 'LOW_STOCK'
                            ? 'bg-red-100 text-red-800'
                            : item.velocityStatus === 'DEADSTOCK'
                            ? 'bg-stone-200 text-stone-700'
                            : 'bg-teal-50 text-teal-800'
                        }`}>
                          {item.velocityStatus}
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

      {/* Tab 5: Financial P&L & NBR Statutory VAT */}
      {activeTab === 'pnl_tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial P&L Statement */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    {lang === 'BN' ? 'আর্থিক আয়-ব্যয় বিবরণী (P&L)' : 'Trading Profit & Loss Statement'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {lang === 'BN' ? 'মোট বিক্রয়, উৎপাদন খরচ ও প্রকৃত পরিচালন মুনাফা' : 'Gross revenue, COGS, operating expenses, and EBITDA'}
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('FINANCIAL_PNL')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>

              {analyticsData?.financialPnl && (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="font-medium text-stone-600">{lang === 'BN' ? 'মোট পণ্য বিক্রয় (GMV)' : 'Gross Merchandise Value (GMV)'}</span>
                    <span className="font-mono font-bold text-stone-900">৳{analyticsData.financialPnl.grossRevenue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100 text-amber-800">
                    <span className="font-medium">{lang === 'BN' ? 'প্রদত্ত ছাড় ও কুপন' : 'Discounts & Promotional Vouchers'}</span>
                    <span className="font-mono font-bold">-৳{analyticsData.financialPnl.discounts.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100 font-bold text-stone-900">
                    <span>{lang === 'BN' ? 'নেট বিক্রয় (Net Sales)' : 'Net Realized Sales'}</span>
                    <span className="font-mono">৳{analyticsData.financialPnl.netSales.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100 text-red-800">
                    <span className="font-medium">{lang === 'BN' ? 'বিক্রিত পণ্যের ক্রয়মূল্য (COGS)' : 'Cost of Goods Sold (COGS)'}</span>
                    <span className="font-mono font-bold">-৳{analyticsData.financialPnl.cogs.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 bg-emerald-50 px-2 rounded-lg font-bold text-emerald-950">
                    <span>{lang === 'BN' ? 'গ্রস ট্রেডিং মুনাফা (Gross Profit)' : `Gross Trading Profit (${analyticsData.financialPnl.grossMarginPct}%)`}</span>
                    <span className="font-mono text-sm">৳{analyticsData.financialPnl.grossProfit.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100 text-stone-600">
                    <span className="font-medium">{lang === 'BN' ? 'মোট পরিচালন ব্যয় (Expenses)' : 'Operating Expenses (Logistics/Packing/Mktg)'}</span>
                    <span className="font-mono font-bold">-৳{analyticsData.financialPnl.expensesTotal.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 bg-teal-900 text-white px-3 rounded-lg font-bold">
                    <span>{lang === 'BN' ? 'নীট পরিচালন আয় (Net EBITDA)' : `Net Operating Income (${analyticsData.financialPnl.netMarginPct}%)`}</span>
                    <span className="font-mono text-base">৳{analyticsData.financialPnl.netOperatingProfit.toLocaleString('en-BD')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* NBR Statutory VAT (Mushak-6.3 & 9.1) Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-teal-800" />
                    <h2 className="text-base font-serif font-bold text-stone-900">
                      {lang === 'BN' ? 'এনবিআর মূসক-৬.৩ ও ৯.১ ভ্যাট বিবরণী' : 'NBR VAT Compliance (Mushak-6.3 & 9.1)'}
                    </h2>
                    <AdminHelpButton helpData={REPORTS_HELP_DATA.NBR_VAT_MUSHAK_63} />
                  </div>
                  <p className="text-xs text-stone-500">
                    {lang === 'BN' ? 'জাতীয় রাজস্ব বোর্ডের মূল্য সংযোজন কর আইন, ২০১২ অনুবর্তী হিসাব' : 'Statutory e-commerce VAT summary according to Bangladesh VAT Act, 2012'}
                  </p>
                </div>
                <button
                  onClick={() => openDoc('TAX_STATEMENT')}
                  className="px-2.5 py-1 bg-stone-900 text-white rounded text-xs font-bold hover:bg-black flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" /> Print
                </button>
              </div>

              {analyticsData?.taxSummary && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1 text-stone-700">
                    <div className="flex justify-between">
                      <span className="font-medium">BIN Number:</span>
                      <span className="font-mono font-bold text-stone-900">{analyticsData.taxSummary.binNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tax Assessment Period:</span>
                      <span className="font-mono">{analyticsData.taxSummary.taxPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Treasury Challan Ref:</span>
                      <span className="font-mono text-teal-900 font-bold">{analyticsData.taxSummary.challanNumber}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-600">{lang === 'BN' ? 'করযোগ্য মোট বিক্রয়:' : 'Gross Taxable Supplies:'}</span>
                      <span className="font-mono font-bold">৳{analyticsData.taxSummary.grossTaxableSales.toLocaleString('en-BD')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-600">{lang === 'BN' ? 'নির্ধারিত করের হার:' : 'Standard Rate (E-commerce):'}</span>
                      <span className="font-mono font-bold text-teal-900">5.0%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-600">{lang === 'BN' ? 'আদায়কৃত আউটপুট ভ্যাট:' : 'Output VAT Collected:'}</span>
                      <span className="font-mono font-bold">৳{analyticsData.taxSummary.vatCollected.toLocaleString('en-BD')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100 text-emerald-800">
                      <span className="font-medium">{lang === 'BN' ? 'ইনপুট কর রেয়াত (Input Rebate):' : 'Input Tax Rebate (Supplier Invoices):'}</span>
                      <span className="font-mono font-bold">-৳{analyticsData.taxSummary.inputTaxRebate.toLocaleString('en-BD')}</span>
                    </div>
                    <div className="flex justify-between py-2.5 bg-emerald-50 text-emerald-950 px-3 rounded-lg font-bold">
                      <span>{lang === 'BN' ? 'সরকারি কোষাগারে প্রদেয় নীট ভ্যাট:' : 'Net VAT Payable to Bangladesh Treasury:'}</span>
                      <span className="font-mono text-sm">৳{analyticsData.taxSummary.netVatPayable.toLocaleString('en-BD')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Official Business Document Generator */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">
                  {lang === 'BN' ? 'অফিসিয়াল বাণিজ্যিক দলিল ও প্রিন্ট হাব' : 'Official Commercial Document Hub'}
                </h2>
                <p className="text-xs text-stone-500">
                  {lang === 'BN'
                    ? 'এনবিআর মূসক-৬.৩ চালান, ওয়্যারহাউস প্যাকিং স্লিপ এবং ৩পিএল কুরিয়ার হ্যান্ডওভার ম্যানিফেস্ট প্রিন্ট করুন'
                    : 'Generate print-ready Mushak-6.3 tax invoices, warehouse packing slips, and 3PL courier handover manifests.'}
                </p>
              </div>

              {/* Order selector dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">{lang === 'BN' ? 'অর্ডার:' : 'Order:'}</span>
                <select
                  value={selectedOrderForDoc}
                  aria-label="order for doc"
                  onChange={(e) => setSelectedOrderForDoc(e.target.value)}
                  className="px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono bg-stone-50"
                >
                  {orders.map(o => (
                    <option key={o.orderNumber} value={o.orderNumber}>
                      {o.orderNumber} - ৳{o.total} ({o.customer.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Action Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mushak 6.3 Invoice */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                    <Receipt className="w-4 h-4 text-teal-800" />
                    <span>Mushak-6.3 Tax Invoice</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Statutory tax invoice conforming to Bangladesh National Board of Revenue rules with QR payload.
                  </p>
                </div>
                <button
                  onClick={() => openDoc('INVOICE')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview & Print
                </button>
              </div>

              {/* Warehouse Packing Slip */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                    <FileText className="w-4 h-4 text-teal-800" />
                    <span>Warehouse Packing Slip</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    SKU pick-and-pack list with bin locations, artisan cluster origin, and QA verification checklist.
                  </p>
                </div>
                <button
                  onClick={() => openDoc('PACKING_SLIP')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview & Print
                </button>
              </div>

              {/* Courier Handover Manifest */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                    <Truck className="w-4 h-4 text-teal-800" />
                    <span>3PL Courier Manifest</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Batch parcel handover sheet for Steadfast/Pathao riders with consignment numbers and COD receivables.
                  </p>
                </div>
                <button
                  onClick={() => openDoc('COURIER_MANIFEST')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview & Print
                </button>
              </div>

              {/* Tax Statement */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-teal-800" />
                    <span>NBR VAT Return Sheet</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Official monthly VAT calculation summary sheet ready for NBR tax audit submission.
                  </p>
                </div>
                <button
                  onClick={() => openDoc('TAX_STATEMENT')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Export Center (RFC-4180 CSV & JSON) */}
      {activeTab === 'exports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-800" />
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    {lang === 'BN' ? 'ই-কমার্স এক্সপোর্ট সেন্টার (RFC-4180 CSV)' : 'E-Commerce Data Export Center'}
                  </h2>
                  <AdminHelpButton helpData={REPORTS_HELP_DATA.RFC_EXPORT_CENTER} />
                </div>
                <p className="text-xs text-stone-500">
                  {lang === 'BN'
                    ? 'হিসাব নিরীক্ষা, এক্সেল স্প্রেডশিট ও ইআরপি সফটওয়্যারের জন্য স্ট্যান্ডার্ড সিএসভি ফাইল ডাউনলোড করুন'
                    : 'Download clean, RFC-4180 compliant CSV exports for spreadsheet accounting, 3PL courier auditing, and ERP integrations.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Orders Master Ledger */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-800" />
                    <span>Orders Master Ledger</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Full transactional records including phone numbers, districts, courier consignment codes, and payment statuses.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('ORDERS')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Orders CSV
                </button>
              </div>

              {/* Inventory & Valuation */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-800" />
                    <span>Inventory & Valuation</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Catalog SKUs, live stock on hand, cost prices, retail prices, locked capital valuation, and days of supply.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('INVENTORY')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Inventory CSV
                </button>
              </div>

              {/* Regional Telemetry */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-800" />
                    <span>Regional Telemetry (64 Districts)</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Full breakdown of 64 districts with division mapping, fulfillment success rates, RTO percentages, and transit hours.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('DISTRICTS')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Districts CSV
                </button>
              </div>

              {/* Artisan Sourcing */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-800" />
                    <span>Artisan Sourcing Ledger</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Tangail, Rajshahi, Demra Muslin, and Cumilla Khadi weaver cluster product counts and fair-wage disbursements.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('ARTISANS')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Artisan CSV
                </button>
              </div>

              {/* Financial P&L */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-800" />
                    <span>Financial P&L Ledger</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    GMV, discounts, net sales, true COGS, operating expenses, and EBITDA operating income breakdown.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('FINANCIAL_PNL')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download P&L CSV
                </button>
              </div>

              {/* NBR VAT Summary */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-800" />
                    <span>NBR VAT Return CSV</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Mushak-6.3 and Mushak-9.1 statutory VAT returns matching National Board of Revenue compliance standards.
                  </p>
                </div>
                <button
                  onClick={() => handleExportCsv('TAX')}
                  className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download VAT CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Order Print Modal (Invoice / Packing Slip) */}
      {documentModal.isOpen && documentModal.selectedOrder && (documentModal.type === 'INVOICE' || documentModal.type === 'PACKING_SLIP') && (
        <PrintOrderDocumentsModal
          order={documentModal.selectedOrder}
          siteContent={siteContent}
          onClose={() => setDocumentModal({ ...documentModal, isOpen: false })}
        />
      )}

      {/* Business Document Printable Modal (Manifest / Tax Statement) */}
      {documentModal.isOpen && !(documentModal.selectedOrder && (documentModal.type === 'INVOICE' || documentModal.type === 'PACKING_SLIP')) && (
        <BusinessDocumentModal
          type={documentModal.type}
          order={documentModal.selectedOrder}
          ordersList={orders}
          siteContent={siteContent}
          taxSummary={analyticsData?.taxSummary}
          onClose={() => setDocumentModal({ ...documentModal, isOpen: false })}
        />
      )}

      {/* Unified Business Report Print Modal */}
      <ReportPrintModal
        isOpen={reportPrintOpen}
        onClose={() => setReportPrintOpen(false)}
        dateRange={dateRange}
        from={customFrom}
        to={customTo}
      />
    </div>
  );
}
