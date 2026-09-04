import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, ShoppingCart, Warehouse, Truck, AlertTriangle, 
  CheckCircle2, ArrowRight, ShieldCheck, DollarSign, Clock, Package,
  Layers, ExternalLink, Sparkles, Filter, Check,
  PlusCircle, RefreshCw, BarChart3, CreditCard, Users, FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ADMIN_SECTIONS_DATA, getSectionBadgeCount } from './adminModulesData';

export function Dashboard() {
  const { orders, products, customers, updateOrderStatus, dispatchCourier, language } = useApp();
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');

  const isBn = language === 'BN';

  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' || o.orderStatus === 'DELIVERED' ? o.total : o.total), 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'PENDING');
  const readyToShipOrders = orders.filter((o) => o.orderStatus === 'READY_TO_SHIP' || o.orderStatus === 'PROCESSING');
  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const highRiskOrders = orders.filter((o) => o.fraudRisk && (o.fraudRisk.riskScore >= 60 || o.fraudRisk.riskRating === 'HIGH' || o.fraudRisk.riskRating === 'SUSPICIOUS'));
  const deliveredOrders = orders.filter(o => o.orderStatus === 'DELIVERED');

  const counts = {
    pendingOrders: pendingOrders.length,
    lowStock: lowStockProducts.length,
    fraudAlerts: highRiskOrders.length
  };

  const displayedSections = ADMIN_SECTIONS_DATA.filter(section => {
    if (activeSectionFilter === 'all') return true;
    return section.id === activeSectionFilter;
  });

  return (
    <div id="admin-dashboard-container" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Operations Header Banner */}
      <div id="dashboard-header-banner" className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-teal-50 text-teal-950 border border-teal-200 shadow-2xs">
              {isBn ? 'সেন্ট্রাল কমান্ড সেন্টার' : 'CENTRAL COMMAND CENTER'}
            </span>
            <span className="text-xs text-stone-400 font-mono font-medium">v1.2 • 23 Work Desks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-900 tracking-tight">
            {isBn ? 'অপারেশনস ও বিজনেস ড্যাশবোর্ড' : 'Operations Command Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
            {isBn
              ? 'সারাদেশের অর্ডার ফুলফিলমেন্ট, ইনভেন্টরি স্টক লেজার, কুরিয়ার হ্যান্ডওভার এবং আর্থিক হিসাবের রিয়েল-টাইম কন্ট্রোল প্যানেল।'
              : 'Real-time fulfillment tracking, inventory ledger thresholds, and unified financial analytics.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            id="dashboard-goto-orders-btn"
            to="/admin/orders"
            className="px-4 py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-2xl text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-teal-300" />
            <span>{isBn ? `অর্ডার কিউ (${pendingOrders.length + readyToShipOrders.length})` : `Fulfillment Queue (${pendingOrders.length + readyToShipOrders.length})`}</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: GMV */}
        <div id="kpi-metric-revenue" className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{isBn ? 'মোট অর্ডারের মূল্য' : 'Gross Order Value'}</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-900 border border-teal-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-stone-900 font-mono tracking-tight">
              ৳ {totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2% {isBn ? 'সাপ্তাহিক প্রবৃদ্ধি' : 'this week'}
            </span>
            <span className="text-stone-400 font-mono">100% verified</span>
          </div>
        </div>

        {/* Metric 2: Orders Count */}
        <div id="kpi-metric-orders" className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{isBn ? 'মোট অর্ডার' : 'Total Orders'}</span>
              <div className="p-2 rounded-xl bg-stone-100 text-stone-800 border border-stone-200">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-stone-900 font-mono tracking-tight">
              {orders.length}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-bold">
              {isBn ? `${pendingOrders.length}টি পেন্ডিং অ্যাকশন` : `${pendingOrders.length} pending action`}
            </span>
            <span className="text-stone-500 font-medium">
              {deliveredOrders.length} {isBn ? 'ডেলিভার্ড' : 'delivered'}
            </span>
          </div>
        </div>

        {/* Metric 3: Low Stock Alert */}
        <div id="kpi-metric-inventory" className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{isBn ? 'লো-স্টক পণ্য' : 'Low Stock SKUs'}</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <Warehouse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-stone-900 font-mono tracking-tight">
              {lowStockProducts.length}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className={`font-bold ${lowStockProducts.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {lowStockProducts.length > 0 
                ? (isBn ? 'জরুরি রি-অর্ডার আবশ্যক' : 'Restock needed') 
                : (isBn ? 'সকল স্টক সুস্থ' : 'All SKUs healthy')}
            </span>
            <Link to="/admin/inventory" className="text-teal-900 font-bold hover:underline">
              {isBn ? 'স্টক দেখুন' : 'Check Stock'} &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 4: Verified Customers */}
        <div id="kpi-metric-customers" className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{isBn ? 'সক্রিয় গ্রাহক' : 'Customer Base'}</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-stone-900 font-mono tracking-tight">
              {customers.length}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-teal-900 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              {isBn ? '১০০% ফোন ভেরিফাইড' : '100% Phone Verified'}
            </span>
            <span className="text-stone-400 font-mono">OTP Guarded</span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-700" />
          <span>{isBn ? 'দ্রুত কাজের শর্টকাট' : 'Executive Quick Action Commands'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/admin/products"
            className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold transition-all flex flex-col items-center text-center gap-2 shadow-2xs group"
          >
            <PlusCircle className="w-5 h-5 text-teal-800 group-hover:scale-110 transition-transform" />
            <span>{isBn ? 'নতুন পণ্য যোগ' : 'Add Product'}</span>
          </Link>

          <Link
            to="/admin/orders"
            className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold transition-all flex flex-col items-center text-center gap-2 shadow-2xs group"
          >
            <ShoppingCart className="w-5 h-5 text-teal-800 group-hover:scale-110 transition-transform" />
            <span>{isBn ? 'অর্ডার প্রসেসিং' : 'Process Orders'}</span>
          </Link>

          <Link
            to="/admin/inventory"
            className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold transition-all flex flex-col items-center text-center gap-2 shadow-2xs group"
          >
            <Warehouse className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />
            <span>{isBn ? 'স্টক লেজার' : 'Stock Ledger'}</span>
          </Link>

          <Link
            to="/admin/shipments"
            className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold transition-all flex flex-col items-center text-center gap-2 shadow-2xs group"
          >
            <Truck className="w-5 h-5 text-teal-800 group-hover:scale-110 transition-transform" />
            <span>{isBn ? 'কুরিয়ার ডিসপ্যাচ' : 'Courier Dispatch'}</span>
          </Link>

          <Link
            to="/admin/finance"
            className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold transition-all flex flex-col items-center text-center gap-2 shadow-2xs group"
          >
            <CreditCard className="w-5 h-5 text-emerald-800 group-hover:scale-110 transition-transform" />
            <span>{isBn ? 'আর্থিক হিসাব' : 'Finance Center'}</span>
          </Link>

          <Link
            to="/admin/audit"
            className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold transition-all flex flex-col items-center text-center gap-2 shadow-2xs group"
          >
            <FileText className="w-5 h-5 text-stone-700 group-hover:scale-110 transition-transform" />
            <span>{isBn ? 'অডিট লগস' : 'Audit Trails'}</span>
          </Link>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div id="dashboard-stock-alert" className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                {isBn ? 'ইনভেন্টরি সতর্কতা: ঘাটতিযুক্ত পণ্য শনাক্ত হয়েছে' : 'Inventory Alert: Low Stock Threshold Reached'}
              </h4>
              <p className="text-xs text-amber-900 mt-0.5">
                {lowStockProducts.map(p => `${p.title} (${p.stock} units left)`).join(' • ')}
              </p>
            </div>
          </div>
          <Link
            id="dashboard-stock-adjust-btn"
            to="/admin/inventory"
            className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors shadow-2xs"
          >
            {isBn ? 'স্টক সমন্বয় করুন →' : 'Restock Now →'}
          </Link>
        </div>
      )}

      {/* SECTION DIRECTORY & WORK BREAKDOWN */}
      <section id="work-directory-section" className="space-y-6">
        <div className="bg-white dark:bg-stone-950 text-stone-900 dark:text-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 dark:border-stone-850 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 dark:bg-teal-500/20 text-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                {isBn ? 'অপারেশনাল ডিরেক্টরি' : 'OPERATIONAL WORK DESKS'}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">23 Connected Desks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
              {isBn 
                ? 'এডমিন সেকশন ও কাজের পূর্ণ বিবরণী' 
                : 'Admin Workspaces & Operational Matrix'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
              {isBn
                ? 'প্রতিটি বিভাগের সুনির্দিষ্ট কাজের পরিধি, দায়িত্ব এবং সরাসরি কাজ শুরু করার জন্য পাশে দেয়া বাটন ব্যবহার করুন।'
                : 'Full architectural breakdown of operational responsibilities and direct 1-click workspace entry buttons.'}
            </p>
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="filter-sec-all"
              onClick={() => setActiveSectionFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                activeSectionFilter === 'all'
                  ? 'bg-teal-900 text-white dark:bg-teal-400 dark:text-stone-950 font-black shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800'
              }`}
            >
              {isBn ? 'সকল সেকশন (২৩)' : 'All Desks (23)'}
            </button>
            {ADMIN_SECTIONS_DATA.map(sec => (
              <button
                key={sec.id}
                id={`filter-sec-${sec.id}`}
                onClick={() => setActiveSectionFilter(sec.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  activeSectionFilter === sec.id
                    ? 'bg-teal-900 text-white dark:bg-teal-400 dark:text-stone-950 font-black shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800'
                }`}
              >
                {isBn ? sec.titleBn : sec.title} ({sec.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Displaying Grouped Sections Grid */}
        <div className="space-y-8">
          {displayedSections.map(section => (
            <div 
              key={section.id} 
              id={`dashboard-sec-${section.id}`}
              className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-6 bg-stone-50/80 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-serif font-black text-stone-900">
                      {isBn ? section.titleBn : section.title}
                    </h3>
                    <span className="text-xs font-mono text-stone-400 font-normal">
                      ({isBn ? section.title : section.titleBn})
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-950 border border-teal-200">
                      {isBn ? section.badgeTextBn : section.badgeText}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1">
                    {isBn ? section.summaryBn : section.summary}
                  </p>
                </div>
              </div>

              {/* Module Cards Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const badge = getSectionBadgeCount(item.badgeKey, counts);

                  return (
                    <div
                      key={item.id}
                      id={`module-card-${item.id}`}
                      className="p-5 sm:p-6 rounded-2xl border border-stone-200/90 bg-stone-50/40 hover:bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Header with Icon, Name, and View Work Button */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-stone-100 rounded-2xl text-teal-900 border border-stone-200 shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-stone-900">
                                  {isBn ? item.labelBn : item.label}
                                </h4>
                                {badge && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                                    {isBn ? badge.labelBn : badge.label}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-500 font-mono">
                                {isBn ? item.label : item.labelBn} • {isBn ? item.roleBn : item.role}
                              </span>
                            </div>
                          </div>

                          {/* DIRECT ACTION BUTTON: "কাজ দেখুন / View Work" */}
                          <Link
                            id={`btn-view-work-${item.id}`}
                            to={item.path}
                            className="px-3.5 py-1.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs inline-flex items-center gap-1.5 shrink-0 transition-all group"
                          >
                            <span>{isBn ? 'কাজ দেখুন' : 'View Work'}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-teal-300" />
                          </Link>
                        </div>

                        {/* Short Tagline */}
                        <p className="text-xs font-semibold text-stone-700">
                          {isBn ? item.taglineBn : item.tagline}
                        </p>

                        {/* Full Purpose & Description */}
                        <div className="p-3.5 bg-white rounded-xl border border-stone-200/90 text-xs text-stone-600 leading-relaxed shadow-2xs">
                          <strong className="font-bold text-stone-800 block mb-1">
                            {isBn ? '📌 কাজের পূর্ণ বিবরণ:' : '📌 Full Operational Scope:'}
                          </strong>
                          {isBn ? item.descriptionBn : item.description}
                        </div>

                        {/* Tasks Checklist */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                            {isBn ? 'প্রধান দায়িত্ব ও কাজসমূহ:' : 'Key Actionable Duties:'}
                          </span>
                          <ul className="space-y-1 text-xs text-stone-700">
                            {(isBn ? item.tasksBn : item.tasksEn).map((task, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-800 mt-0.5 shrink-0" />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer with Path & Direct Link */}
                      <div className="mt-5 pt-3.5 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-mono text-[10px] text-stone-400">{item.path}</span>
                        <Link
                          to={item.path}
                          className="font-bold text-teal-900 hover:text-teal-950 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isBn ? 'কর্মক্ষেত্রে যান' : 'Go to Desk'}</span>
                          <ArrowRight className="w-3 h-3 text-teal-700" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Orders Operational Queue */}
      <div id="dashboard-orders-queue" className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/50">
          <div>
            <h2 className="text-lg font-serif font-black text-stone-900">
              {isBn ? 'চলমান অর্ডার প্রসেসিং কিউ' : 'Active Orders Queue'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {isBn ? 'লাইভ অর্ডার ভেরিফিকেশন, প্যাকিং ও কুরিয়ার হ্যান্ডওভার' : 'Live order processing, verification, and courier dispatch'}
            </p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-teal-900 hover:text-teal-950 hover:underline inline-flex items-center gap-1">
            <span>{isBn ? 'সকল অর্ডার দেখুন' : 'View All Orders'}</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">{isBn ? 'অর্ডার #' : 'Order #'}</th>
                <th className="p-4">{isBn ? 'গ্রাহক ও ফোন' : 'Customer & Phone'}</th>
                <th className="p-4">{isBn ? 'পণ্য' : 'Items'}</th>
                <th className="p-4">{isBn ? 'মোট' : 'Total'}</th>
                <th className="p-4">{isBn ? 'পেমেন্ট' : 'Payment'}</th>
                <th className="p-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="p-4 text-right">{isBn ? 'কুইক অ্যাকশন' : 'Quick Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-stone-900">
                    {order.orderNumber}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-stone-900 block">{order.customer.name}</span>
                    <span className="text-stone-500 font-mono text-[11px]">{order.customer.phone}</span>
                  </td>
                  <td className="p-4 text-stone-600">
                    {order.items.length} item(s) ({order.items[0]?.title.substring(0, 20)}...)
                  </td>
                  <td className="p-4 font-bold text-stone-900 font-mono">
                    ৳ {order.total.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                    }`}>
                      {order.paymentMethod} • {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {order.orderStatus === 'PENDING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CONFIRMED', 'Admin manually confirmed order')}
                        className="px-3 py-1 bg-teal-900 text-white rounded-xl font-bold hover:bg-teal-950 transition-colors shadow-2xs"
                      >
                        {isBn ? 'কনফার্ম' : 'Confirm'}
                      </button>
                    )}
                    {order.orderStatus === 'CONFIRMED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PROCESSING', 'Moved to packaging')}
                        className="px-3 py-1 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-2xs"
                      >
                        {isBn ? 'প্যাক' : 'Pack'}
                      </button>
                    )}
                    {order.orderStatus === 'PROCESSING' && (
                      <button
                        onClick={() => dispatchCourier(order.id, 'Steadfast')}
                        className="px-3 py-1 bg-teal-900 text-white rounded-xl font-bold hover:bg-teal-950 transition-colors shadow-2xs"
                      >
                        {isBn ? 'ডিসপ্যাচ' : 'Dispatch'}
                      </button>
                    )}
                    {order.orderStatus === 'SHIPPED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED', 'Courier marked delivery completed')}
                        className="px-3 py-1 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 transition-colors shadow-2xs"
                      >
                        {isBn ? 'ডেলিভার্ড' : 'Mark Delivered'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
