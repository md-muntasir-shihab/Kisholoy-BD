import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, ShoppingCart, Warehouse, Truck, AlertTriangle, 
  CheckCircle2, ArrowRight, ShieldCheck, DollarSign, Clock, Package,
  Layers, BookOpen, ExternalLink, Sparkles, Filter, Check
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
    <div id="admin-dashboard-container" className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div id="dashboard-header-banner" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-teal-50 text-teal-900 border border-teal-200">
              {isBn ? 'সেন্ট্রাল কন্ট্রোল সেন্টার' : 'CENTRAL COMMAND CENTER'}
            </span>
            <span className="text-xs text-stone-500 font-mono">v1.2 • 23 Modules</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {isBn ? 'অপারেশনস ও বিজনেস ড্যাশবোর্ড' : 'Operations Command Center'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            {isBn
              ? 'সারাদেশের অর্ডার ফুলফিলমেন্ট, ইনভেন্টরি স্টক লেজার, কুরিয়ার হ্যান্ডওভার এবং আর্থিক হিসাবের রিয়েল-টাইম কন্ট্রোল প্যানেল।'
              : 'Real-time fulfillment, inventory thresholds, and financial telemetry across Bangladesh.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            id="dashboard-goto-orders-btn"
            to="/admin/orders"
            className="px-4 py-2 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isBn ? `অর্ডার কিউ (${pendingOrders.length + readyToShipOrders.length})` : `Fulfillment Queue (${pendingOrders.length + readyToShipOrders.length})`}</span>
          </Link>
          <a
            href="#work-directory-section"
            className="px-4 py-2 bg-stone-100 text-stone-800 hover:bg-stone-200 rounded-xl text-xs font-semibold border border-stone-200 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-700" />
            <span>{isBn ? 'কাজের নির্দেশিকা' : 'Work Guide'}</span>
          </a>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div id="kpi-metric-revenue" className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'মোট অর্ডারের মূল্য' : 'Gross Order Value'}</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-900">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono">
            ৳ {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3" /> {isBn ? '+১৪.২% গত সপ্তাহের তুলনায়' : '+14.2% vs last week'}
          </span>
        </div>

        {/* Metric 2 */}
        <div id="kpi-metric-orders" className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'মোট অর্ডার' : 'Total Orders'}</span>
            <div className="p-2 rounded-lg bg-stone-100 text-stone-800">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono">
            {orders.length}
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block">
            {isBn ? `${pendingOrders.length}টি অর্ডারে কাজ বাকি` : `${pendingOrders.length} pending action`}
          </span>
        </div>

        {/* Metric 3 */}
        <div id="kpi-metric-inventory" className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'লো-স্টক পণ্য' : 'Low Stock SKUs'}</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono">
            {lowStockProducts.length}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-2 block">
            {lowStockProducts.length > 0 
              ? (isBn ? 'জরুরি রি-অর্ডার আবশ্যক' : 'Requires immediate restock') 
              : (isBn ? 'সব পণ্যের স্টক পর্যাপ্ত' : 'All SKUs healthy')}
          </span>
        </div>

        {/* Metric 4 */}
        <div id="kpi-metric-customers" className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'সক্রিয় গ্রাহক' : 'Active Customers'}</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono">
            {customers.length}
          </div>
          <span className="text-[11px] text-stone-500 mt-2 block">
            {isBn ? '১০০% ভেরিফাইড ফোন প্রোফাইল' : '100% verified phone profiles'}
          </span>
        </div>
      </div>

      {/* Critical Action Alerts */}
      {lowStockProducts.length > 0 && (
        <div id="dashboard-stock-alert" className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                {isBn ? 'ইনভেন্টরি সতর্কতা: ঘাটতিযুক্ত পণ্য শনাক্ত হয়েছে' : 'Inventory Alert: Low Stock Detected'}
              </h4>
              <p className="text-xs text-amber-800">
                {lowStockProducts.map(p => `${p.title} (${p.stock} left)`).join(', ')}
              </p>
            </div>
          </div>
          <Link
            id="dashboard-stock-adjust-btn"
            to="/admin/inventory"
            className="px-3 py-1.5 bg-amber-900 text-white rounded-lg text-xs font-bold hover:bg-amber-950 whitespace-nowrap shrink-0 transition-colors"
          >
            {isBn ? 'স্টক সমন্বয় করুন →' : 'Adjust Stock →'}
          </Link>
        </div>
      )}

      {/* SECTION DIRECTORY & WORK BREAKDOWN - REQUESTED CORE REQUIREMENT */}
      <section id="work-directory-section" className="space-y-6">
        <div className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {isBn ? 'অপারেশনাল ডিরেক্টরি' : 'OPERATIONAL DIRECTORY'}
              </span>
              <span className="text-xs text-stone-400 font-mono">23 Work Desks</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              {isBn 
                ? 'এডমিন সেকশন ও কাজের পূর্ণ বিবরণী' 
                : 'Admin Sections & Work Breakdown'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
              {isBn
                ? 'প্রতিটি বিভাগের সুনির্দিষ্ট কাজের পরিধি, দায়িত্ব এবং সরাসরি কাজ শুরু করার জন্য পাশে দেয়া বাটন ব্যবহার করুন।'
                : 'Full breakdown of duties, responsibilities, and direct quick-action buttons to enter every administrative workspace.'}
            </p>
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              id="filter-sec-all"
              onClick={() => setActiveSectionFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSectionFilter === 'all'
                  ? 'bg-teal-500 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750 hover:text-white'
              }`}
            >
              {isBn ? 'সকল সেকশন (২৩)' : 'All (23)'}
            </button>
            {ADMIN_SECTIONS_DATA.map(sec => (
              <button
                key={sec.id}
                id={`filter-sec-${sec.id}`}
                onClick={() => setActiveSectionFilter(sec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSectionFilter === sec.id
                    ? 'bg-teal-500 text-stone-950 font-bold shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-750 hover:text-white'
                }`}
              >
                {isBn ? sec.titleBn : sec.title} ({sec.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Displaying Grouped Sections */}
        <div className="space-y-8">
          {displayedSections.map(section => (
            <div 
              key={section.id} 
              id={`dashboard-sec-${section.id}`}
              className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-5 bg-stone-50/80 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {isBn ? section.titleBn : section.title}
                    </h3>
                    <span className="text-xs font-mono text-stone-400 font-normal">
                      ({isBn ? section.title : section.titleBn})
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200">
                      {isBn ? section.badgeTextBn : section.badgeText}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1">
                    {isBn ? section.summaryBn : section.summary}
                  </p>
                </div>
              </div>

              {/* Module Cards Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const badge = getSectionBadgeCount(item.badgeKey, counts);

                  return (
                    <div
                      key={item.id}
                      id={`module-card-${item.id}`}
                      className="p-5 rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header with Icon, Name, and View Work Button */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-stone-100 rounded-xl text-teal-900 border border-stone-200 shrink-0">
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
                            className="px-3.5 py-1.5 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm inline-flex items-center gap-1.5 shrink-0 transition-all group"
                          >
                            <span>{isBn ? 'কাজ দেখুন' : 'View Work'}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>

                        {/* Short Tagline */}
                        <p className="text-xs font-medium text-stone-700">
                          {isBn ? item.taglineBn : item.tagline}
                        </p>

                        {/* Full Purpose & Description */}
                        <div className="p-3 bg-white rounded-lg border border-stone-200/80 text-xs text-stone-600 leading-relaxed">
                          <strong className="font-semibold text-stone-800 block mb-1">
                            {isBn ? '📌 কাজের পূর্ণ বিবরণ:' : '📌 Full Operational Scope:'}
                          </strong>
                          {isBn ? item.descriptionBn : item.description}
                        </div>

                        {/* Tasks Checklist */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                            {isBn ? 'প্রধান দায়িত্ব ও কাজসমূহ:' : 'Key Actionable Duties:'}
                          </span>
                          <ul className="space-y-1 text-xs text-stone-700">
                            {(isBn ? item.tasksBn : item.tasksEn).map((task, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0" />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer with Path & Direct Link */}
                      <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-mono text-[10px] text-stone-400">{item.path}</span>
                        <Link
                          to={item.path}
                          className="font-bold text-teal-800 hover:text-teal-950 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isBn ? 'কর্মক্ষেত্রে যান' : 'Go to Desk'}</span>
                          <ArrowRight className="w-3 h-3" />
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
      <div id="dashboard-orders-queue" className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900">
              {isBn ? 'চলমান অর্ডার প্রসেসিং কিউ' : 'Active Orders Queue'}
            </h2>
            <p className="text-xs text-stone-500">
              {isBn ? 'লাইভ অর্ডার ভেরিফিকেশন, প্যাকিং ও কুরিয়ার হ্যান্ডওভার' : 'Live order processing, verification, and courier dispatch'}
            </p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-teal-900 hover:underline">
            {isBn ? 'সকল অর্ডার দেখুন →' : 'View All Orders →'}
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                    }`}>
                      {order.paymentMethod} • {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {order.orderStatus === 'PENDING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CONFIRMED', 'Admin manually confirmed order')}
                        className="px-2.5 py-1 bg-teal-900 text-white rounded font-bold hover:bg-teal-950 transition-colors"
                      >
                        {isBn ? 'কনফার্ম' : 'Confirm'}
                      </button>
                    )}
                    {order.orderStatus === 'CONFIRMED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PROCESSING', 'Moved to packaging')}
                        className="px-2.5 py-1 bg-stone-900 text-white rounded font-bold hover:bg-black transition-colors"
                      >
                        {isBn ? 'প্যাক' : 'Pack'}
                      </button>
                    )}
                    {order.orderStatus === 'PROCESSING' && (
                      <button
                        onClick={() => dispatchCourier(order.id, 'Steadfast')}
                        className="px-2.5 py-1 bg-teal-900 text-white rounded font-bold hover:bg-teal-950 transition-colors"
                      >
                        {isBn ? 'ডিসপ্যাচ' : 'Dispatch'}
                      </button>
                    )}
                    {order.orderStatus === 'SHIPPED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED', 'Courier marked delivery completed')}
                        className="px-2.5 py-1 bg-emerald-800 text-white rounded font-bold hover:bg-emerald-900 transition-colors"
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

